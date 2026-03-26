from __future__ import annotations

import asyncio
import base64
import xml.etree.ElementTree as ET
from typing import Any

import httpx
from fastapi import UploadFile

from app.core.config import settings

# Timeout for external API calls (seconds)
API_TIMEOUT = 60.0


class DocumentParser:
    """Service de parsing des documents (liasses, devis, relevés)."""

    SOMPTUAIRE_KEYWORDS = [
        "ferrari", "lamborghini", "porsche finance", "aston martin",
        "bentley", "rolls royce", "maserati", "bugatti",
        "cartier", "rolex", "hermes", "hermès",
        "louis vuitton", "chanel", "van cleef",
        "private jet", "first class", "yacht",
        "casino", "golf club",
    ]

    # Mapping cerfa liasse fiscale fields
    LIASSE_FIELDS = {
        "FL": "ca", "FO": "valeur_ajoutee", "FU": "ebitda",
        "GG": "resultat_net", "GA": "ebit",
        "CO": "actif_total", "BJ": "actif_circulant",
        "BK": "stocks", "BX": "creances_clients",
        "EE": "passif_total", "DL": "passif_circulant",
        "DU": "dettes_financieres", "DL": "fonds_propres",
        "DI": "capitaux_permanents", "CF": "tresorerie",
        "FY": "charges_personnel", "GU": "frais_financiers",
    }

    async def parse_liasse(self, file: UploadFile, deal_id: str) -> dict[str, Any]:
        """Parse une liasse fiscale PDF/XML."""
        content = await file.read()
        filename = file.filename or ""

        try:
            if filename.lower().endswith(".xml"):
                return await asyncio.wait_for(
                    self._parse_liasse_xml(content),
                    timeout=API_TIMEOUT,
                )
            else:
                return await asyncio.wait_for(
                    self._parse_liasse_pdf(content, deal_id),
                    timeout=API_TIMEOUT,
                )
        except asyncio.TimeoutError:
            return {
                "status": "error",
                "error": f"Parsing timeout after {int(API_TIMEOUT)}s",
            }

    async def parse_devis(self, file: UploadFile, deal_id: str) -> dict[str, Any]:
        """Parse un devis fournisseur avec OCR + Claude."""
        content = await file.read()

        try:
            return await asyncio.wait_for(
                self._extract_devis_with_claude(content, file.filename or "devis.pdf"),
                timeout=API_TIMEOUT,
            )
        except asyncio.TimeoutError:
            return {"status": "error", "error": "Extraction timeout"}

    async def parse_releve_bancaire(
        self, file: UploadFile, deal_id: str
    ) -> dict[str, Any]:
        """Parse un relevé bancaire et détecte les signaux."""
        content = await file.read()

        try:
            return await asyncio.wait_for(
                self._extract_releve_with_claude(content, file.filename or "releve.pdf"),
                timeout=API_TIMEOUT,
            )
        except asyncio.TimeoutError:
            return {"status": "error", "error": "Extraction timeout"}

    async def _parse_liasse_xml(self, content: bytes) -> dict:
        """Parse une liasse XML DGFiP (format cerfa)."""
        try:
            root = ET.fromstring(content)
            data: dict[str, Any] = {"format": "xml", "status": "done"}
            extracted = {}

            # Parse cerfa XML structure
            for elem in root.iter():
                tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                if tag in self.LIASSE_FIELDS and elem.text:
                    try:
                        extracted[self.LIASSE_FIELDS[tag]] = float(
                            elem.text.replace(",", ".").replace(" ", "")
                        )
                    except ValueError:
                        pass

            data["extracted"] = extracted
            return data
        except ET.ParseError:
            return {"format": "xml", "status": "error", "error": "XML invalide"}

    async def _parse_liasse_pdf(self, content: bytes, deal_id: str) -> dict:
        """Parse une liasse PDF via Claude API (vision)."""
        if not settings.anthropic_api_key:
            return {
                "format": "pdf",
                "status": "error",
                "error": "ANTHROPIC_API_KEY non configurée",
            }

        b64 = base64.standard_b64encode(content).decode("utf-8")

        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 4096,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "document",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "application/pdf",
                                        "data": b64,
                                    },
                                },
                                {
                                    "type": "text",
                                    "text": (
                                        "Extrais les données financières de cette liasse fiscale française. "
                                        "Retourne UNIQUEMENT un JSON avec ces clés (valeurs numériques en euros, sans espaces ni symboles) :\n"
                                        "ca, ebitda, ebit, resultat_net, caf, actif_total, actif_circulant, "
                                        "stocks, creances_clients, passif_total, passif_circulant, "
                                        "dettes_financieres, fonds_propres, capitaux_permanents, tresorerie, "
                                        "charges_personnel, valeur_ajoutee, frais_financiers, annee_exercice.\n"
                                        "Si une valeur est introuvable, mets null."
                                    ),
                                },
                            ],
                        }
                    ],
                },
            )

        if resp.status_code != 200:
            return {
                "format": "pdf",
                "status": "error",
                "error": f"Claude API error: {resp.status_code}",
            }

        data = resp.json()
        text = data.get("content", [{}])[0].get("text", "")

        # Extract JSON from response
        import json
        try:
            # Find JSON in response
            start = text.index("{")
            end = text.rindex("}") + 1
            extracted = json.loads(text[start:end])
        except (ValueError, json.JSONDecodeError):
            return {
                "format": "pdf",
                "status": "error",
                "error": "Impossible d'extraire les données du PDF",
                "raw_response": text[:500],
            }

        return {"format": "pdf", "status": "done", "extracted": extracted}

    async def _extract_devis_with_claude(self, content: bytes, filename: str) -> dict:
        """Extrait les données d'un devis fournisseur via Claude."""
        if not settings.anthropic_api_key:
            return {"status": "error", "error": "ANTHROPIC_API_KEY non configurée"}

        b64 = base64.standard_b64encode(content).decode("utf-8")

        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 2048,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "document",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "application/pdf",
                                        "data": b64,
                                    },
                                },
                                {
                                    "type": "text",
                                    "text": (
                                        "Extrais les données de ce devis fournisseur. "
                                        "Retourne UNIQUEMENT un JSON avec ces clés :\n"
                                        "marque, modele, reference_constructeur, annee_fabrication, "
                                        "numero_serie, vin, kilometrage, heures_moteur, "
                                        "prix_achat_ht (nombre), options (liste de strings), "
                                        "fournisseur_nom, fournisseur_siren, date_devis.\n"
                                        "Si une valeur est introuvable, mets null."
                                    ),
                                },
                            ],
                        }
                    ],
                },
            )

        if resp.status_code != 200:
            return {"status": "error", "error": f"Claude API error: {resp.status_code}"}

        data = resp.json()
        text = data.get("content", [{}])[0].get("text", "")

        import json
        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            extracted = json.loads(text[start:end])
        except (ValueError, json.JSONDecodeError):
            return {"status": "error", "error": "Extraction échouée", "raw": text[:500]}

        return {"status": "done", "extracted": extracted}

    async def _extract_releve_with_claude(self, content: bytes, filename: str) -> dict:
        """Extrait et analyse un relevé bancaire via Claude."""
        if not settings.anthropic_api_key:
            return {"status": "error", "error": "ANTHROPIC_API_KEY non configurée"}

        b64 = base64.standard_b64encode(content).decode("utf-8")

        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 4096,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "document",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "application/pdf",
                                        "data": b64,
                                    },
                                },
                                {
                                    "type": "text",
                                    "text": (
                                        "Analyse ce relevé bancaire français. Retourne UNIQUEMENT un JSON :\n"
                                        "{\n"
                                        '  "solde_debut": nombre,\n'
                                        '  "solde_fin": nombre,\n'
                                        '  "total_credits": nombre,\n'
                                        '  "total_debits": nombre,\n'
                                        '  "nb_incidents": nombre (rejets, impayés),\n'
                                        '  "nb_jours_debiteur": nombre,\n'
                                        '  "operations_suspectes": [{"libelle": "...", "montant": nombre, "type": "somptuaire|inhabituel"}],\n'
                                        '  "regularite_flux": "regulier" | "irregulier" | "saisonnier"\n'
                                        "}\n"
                                        "Si une valeur est introuvable, mets null."
                                    ),
                                },
                            ],
                        }
                    ],
                },
            )

        if resp.status_code != 200:
            return {"status": "error", "error": f"Claude API error: {resp.status_code}"}

        data = resp.json()
        text = data.get("content", [{}])[0].get("text", "")

        import json
        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            extracted = json.loads(text[start:end])
        except (ValueError, json.JSONDecodeError):
            return {"status": "error", "error": "Extraction échouée", "raw": text[:500]}

        # Detect somptuaire from operations
        operations = extracted.get("operations_suspectes", [])
        libelles = [op.get("libelle", "") for op in operations]
        somptuaires = self.detect_somptuaire(libelles)

        return {
            "status": "done",
            "extracted": extracted,
            "depenses_somptuaires": somptuaires,
            "incidents": extracted.get("nb_incidents", 0),
        }

    def detect_somptuaire(
        self, libelles: list[str], seuil: float = 500
    ) -> list[dict]:
        """Détecte les dépenses somptuaires dans les libellés bancaires."""
        signals = []
        for libelle in libelles:
            libelle_lower = libelle.lower()
            for keyword in self.SOMPTUAIRE_KEYWORDS:
                if keyword in libelle_lower:
                    signals.append({
                        "libelle": libelle,
                        "keyword": keyword,
                        "type": "somptuaire",
                    })
                    break
        return signals
