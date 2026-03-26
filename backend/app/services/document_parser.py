from __future__ import annotations

import asyncio
import base64
import io
import json
import re
import xml.etree.ElementTree as ET
from typing import Any

import httpx
from fastapi import UploadFile

from app.core.config import settings

API_TIMEOUT = 60.0

# =========================================================================
# CERFA CODE MAPPING — Liasse fiscale DGFiP
# 2050 (bilan actif), 2051 (bilan passif), 2052-2053 (compte résultat)
# =========================================================================
CERFA_CODES: dict[str, str] = {
    # 2050 — Bilan actif
    "AA": "immobilisations_incorporelles",
    "AB": "frais_etablissement",
    "AN": "immobilisations_corporelles",
    "BH": "immobilisations_financieres",
    "BJ": "actif_circulant",
    "BK": "stocks",
    "BX": "creances_clients",
    "CF": "tresorerie",
    "CO": "actif_total",
    # 2051 — Bilan passif
    "DA": "capitaux_propres",
    "DC": "capital_social",
    "DI": "capitaux_permanents",
    "DL": "fonds_propres",
    "DP": "provisions_risques",
    "DU": "dettes_financieres",
    "DV": "emprunts_obligataires",
    "DX": "emprunts_credit",
    "EA": "fournisseurs",
    "EC": "dettes_fiscales_sociales",
    "EE": "passif_total",
    # 2052 — Compte de résultat
    "FA": "ventes_marchandises",
    "FC": "production_vendue_biens",
    "FD": "production_vendue_services",
    "FL": "ca",
    "FO": "valeur_ajoutee",
    "FP": "subventions_exploitation",
    "FU": "ebitda",  # EBE
    "FV": "dotations_amortissements",
    "FW": "dotations_provisions",
    "FY": "charges_personnel",
    "GA": "ebit",  # Résultat d'exploitation
    "GE": "produits_financiers",
    "GF": "charges_financieres",
    "GG": "resultat_net",
    "GU": "frais_financiers",
    "GW": "resultat_courant",
    # 2053 — Suite
    "HA": "produits_exceptionnels",
    "HB": "charges_exceptionnelles",
    "HE": "participation_salaries",
    "HK": "impot_benefices",
    "HN": "resultat_exercice",
    # Passif circulant (calculé)
    "DL_calc": "passif_circulant",
}

# Mapping XML liasse (différentes nomenclatures possibles)
XML_FIELD_MAP: dict[str, str] = {
    **CERFA_CODES,
    # Aliases fréquents dans les XML DGFiP
    "chiffre_affaires": "ca",
    "total_actif": "actif_total",
    "total_passif": "passif_total",
    "resultat_net_comptable": "resultat_net",
    "excedent_brut_exploitation": "ebitda",
    "resultat_exploitation": "ebit",
}


class DocumentParser:
    """Service de parsing — 0 appel Claude pour liasses et relevés."""

    SOMPTUAIRE_KEYWORDS = [
        "ferrari", "lamborghini", "porsche finance", "aston martin",
        "bentley", "rolls royce", "maserati", "bugatti",
        "cartier", "rolex", "hermes", "hermès",
        "louis vuitton", "chanel", "van cleef",
        "private jet", "first class", "yacht",
        "casino", "golf club",
    ]

    async def parse_liasse(self, file: UploadFile, deal_id: str) -> dict[str, Any]:
        """Parse une liasse fiscale PDF/XML — Python pur, pas d'API."""
        content = await file.read()
        filename = (file.filename or "").lower()

        try:
            if filename.endswith(".xml"):
                return await asyncio.wait_for(
                    self._parse_liasse_xml(content), timeout=API_TIMEOUT
                )
            else:
                return await asyncio.wait_for(
                    self._parse_liasse_pdf_native(content), timeout=API_TIMEOUT
                )
        except asyncio.TimeoutError:
            return {"status": "error", "error": f"Parsing timeout ({int(API_TIMEOUT)}s)"}

    async def parse_devis(self, file: UploadFile, deal_id: str) -> dict[str, Any]:
        """Parse un devis fournisseur — SEUL cas qui utilise Claude API."""
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
        """Parse un relevé bancaire — Python pur avec pdfplumber."""
        content = await file.read()
        try:
            return await asyncio.wait_for(
                self._parse_releve_native(content), timeout=API_TIMEOUT
            )
        except asyncio.TimeoutError:
            return {"status": "error", "error": "Parsing timeout"}

    # ======================================================================
    # LIASSE XML — parsing Python pur
    # ======================================================================

    async def _parse_liasse_xml(self, content: bytes) -> dict:
        try:
            root = ET.fromstring(content)
            extracted: dict[str, Any] = {}

            for elem in root.iter():
                tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                tag_upper = tag.upper().strip()

                # Try CERFA code first
                field_name = CERFA_CODES.get(tag_upper)
                # Then try XML alias
                if not field_name:
                    field_name = XML_FIELD_MAP.get(tag.lower())

                if field_name and elem.text:
                    val = self._parse_number(elem.text)
                    if val is not None:
                        extracted[field_name] = val

            # Derive missing fields
            self._derive_fields(extracted)

            return {"format": "xml", "status": "done", "extracted": extracted}
        except ET.ParseError:
            return {"format": "xml", "status": "error", "error": "XML invalide"}

    # ======================================================================
    # LIASSE PDF — parsing Python pur avec pdfplumber + regex CERFA
    # ======================================================================

    async def _parse_liasse_pdf_native(self, content: bytes) -> dict:
        """Extrait les données CERFA depuis un PDF de liasse fiscale."""
        try:
            import pdfplumber
        except ImportError:
            return {
                "format": "pdf",
                "status": "error",
                "error": "pdfplumber non installé",
            }

        extracted: dict[str, Any] = {}
        full_text = ""

        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    full_text += text + "\n"

                    # Also try tables (CERFA forms often have structured tables)
                    tables = page.extract_tables() or []
                    for table in tables:
                        for row in table:
                            if row and len(row) >= 2:
                                self._extract_cerfa_from_row(row, extracted)
        except Exception as e:
            return {"format": "pdf", "status": "error", "error": str(e)}

        # Regex patterns for CERFA codes in text
        # Pattern: code letter(s) followed by amount (with spaces, dots, commas)
        self._extract_cerfa_from_text(full_text, extracted)

        # Try to detect year
        year_match = re.search(r"exercice[:\s]*(\d{4})", full_text, re.IGNORECASE)
        if year_match:
            extracted["annee_exercice"] = int(year_match.group(1))
        else:
            year_match = re.search(r"(20[12]\d)", full_text)
            if year_match:
                extracted["annee_exercice"] = int(year_match.group(1))

        # Derive missing fields
        self._derive_fields(extracted)

        status = "done" if len(extracted) >= 5 else "partial"
        return {
            "format": "pdf",
            "status": status,
            "extracted": extracted,
            "fields_found": len(extracted),
        }

    def _extract_cerfa_from_text(self, text: str, extracted: dict) -> None:
        """Extract CERFA codes from raw text using regex."""
        lines = text.split("\n")
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Pattern 1: "FL  1 850 000" or "FL 1850000"
            for code, field in CERFA_CODES.items():
                if len(code) > 3:
                    continue  # Skip calculated fields
                pattern = rf'\b{code}\b[:\s]*([\d\s.,\-]+)'
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    val = self._parse_number(match.group(1))
                    if val is not None and field not in extracted:
                        extracted[field] = val

            # Pattern 2: Named fields "Chiffre d'affaires : 1 850 000"
            named_patterns = [
                (r"chiffre\s+d['\u2019]affaires[:\s]*([\d\s.,\-]+)", "ca"),
                (r"résultat\s+net[:\s]*([\d\s.,\-]+)", "resultat_net"),
                (r"total\s+actif[:\s]*([\d\s.,\-]+)", "actif_total"),
                (r"total\s+passif[:\s]*([\d\s.,\-]+)", "passif_total"),
                (r"fonds\s+propres[:\s]*([\d\s.,\-]+)", "fonds_propres"),
                (r"capitaux\s+propres[:\s]*([\d\s.,\-]+)", "fonds_propres"),
                (r"dettes\s+financi[èe]res[:\s]*([\d\s.,\-]+)", "dettes_financieres"),
                (r"trésorerie[:\s]*([\d\s.,\-]+)", "tresorerie"),
                (r"valeur\s+ajoutée[:\s]*([\d\s.,\-]+)", "valeur_ajoutee"),
                (r"excédent\s+brut[:\s]*([\d\s.,\-]+)", "ebitda"),
                (r"charges\s+de?\s*personnel[:\s]*([\d\s.,\-]+)", "charges_personnel"),
                (r"stocks[:\s]*([\d\s.,\-]+)", "stocks"),
                (r"créances\s+clients[:\s]*([\d\s.,\-]+)", "creances_clients"),
            ]
            for pattern, field in named_patterns:
                if field not in extracted:
                    match = re.search(pattern, line, re.IGNORECASE)
                    if match:
                        val = self._parse_number(match.group(1))
                        if val is not None:
                            extracted[field] = val

    def _extract_cerfa_from_row(self, row: list, extracted: dict) -> None:
        """Extract values from a PDF table row."""
        if not row or len(row) < 2:
            return
        cell0 = str(row[0] or "").strip().upper()
        # Check if first cell is a CERFA code
        if cell0 in CERFA_CODES:
            # Find the first numeric cell
            for cell in row[1:]:
                val = self._parse_number(str(cell or ""))
                if val is not None:
                    field = CERFA_CODES[cell0]
                    if field not in extracted:
                        extracted[field] = val
                    break

    @staticmethod
    def _parse_number(text: str) -> float | None:
        """Parse un nombre depuis un texte (gère espaces, virgules, parenthèses)."""
        if not text:
            return None
        text = text.strip()
        # Handle parentheses for negatives: (1 234) → -1234
        negative = False
        if text.startswith("(") and text.endswith(")"):
            negative = True
            text = text[1:-1]
        # Remove spaces and non-breaking spaces
        text = re.sub(r'[\s\u00a0]', '', text)
        # Replace comma with dot
        text = text.replace(",", ".")
        # Remove trailing dots
        text = text.rstrip(".")
        # Remove any remaining non-numeric chars except dot and minus
        text = re.sub(r'[^\d.\-]', '', text)
        if not text or text in (".", "-", "-."):
            return None
        try:
            val = float(text)
            return -val if negative else val
        except ValueError:
            return None

    @staticmethod
    def _derive_fields(extracted: dict) -> None:
        """Calcule les champs dérivés manquants."""
        # CAF = résultat net + dotations amortissements
        if "caf" not in extracted:
            rn = extracted.get("resultat_net", 0)
            da = extracted.get("dotations_amortissements", 0)
            if rn:
                extracted["caf"] = rn + (da or 0)

        # Passif circulant = passif total - capitaux permanents
        if "passif_circulant" not in extracted:
            pt = extracted.get("passif_total")
            cp = extracted.get("capitaux_permanents")
            if pt and cp:
                extracted["passif_circulant"] = pt - cp

        # Actif circulant dérivé si manquant
        if "actif_circulant" not in extracted:
            at = extracted.get("actif_total")
            immo = extracted.get("immobilisations_corporelles", 0)
            immo_inc = extracted.get("immobilisations_incorporelles", 0)
            immo_fin = extracted.get("immobilisations_financieres", 0)
            if at:
                extracted["actif_circulant"] = at - immo - immo_inc - immo_fin

    # ======================================================================
    # RELEVÉ BANCAIRE — parsing Python pur
    # ======================================================================

    async def _parse_releve_native(self, content: bytes) -> dict:
        """Parse un relevé bancaire avec pdfplumber — pas de Claude."""
        try:
            import pdfplumber
        except ImportError:
            return {"status": "error", "error": "pdfplumber non installé"}

        try:
            lines_data: list[dict] = []
            full_text = ""

            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    full_text += text + "\n"

            # Extract credit/debit amounts
            total_credit = 0.0
            total_debit = 0.0
            incidents = 0

            # Common patterns in French bank statements
            amount_pattern = re.compile(
                r'([\d\s.,]+)\s*(CR|DB|[CD])\b', re.IGNORECASE
            )
            for match in amount_pattern.finditer(full_text):
                val = self._parse_number(match.group(1))
                direction = match.group(2).upper()
                if val and val > 0:
                    if direction in ("CR", "C"):
                        total_credit += val
                    else:
                        total_debit += val

            # Detect incidents
            incident_keywords = ["rejet", "impayé", "retour", "sans provision", "interdit"]
            for keyword in incident_keywords:
                incidents += len(re.findall(keyword, full_text, re.IGNORECASE))

            # Detect somptuaire
            somptuaires = self.detect_somptuaire(full_text.split("\n"))

            # Detect regularity
            months_found = set()
            for m in re.finditer(r'\b(0[1-9]|1[0-2])/\d{4}\b', full_text):
                months_found.add(m.group())
            regularity = "regulier" if len(months_found) >= 3 else "irregulier"

            return {
                "status": "done",
                "extracted": {
                    "total_credits": round(total_credit, 2),
                    "total_debits": round(total_debit, 2),
                    "nb_incidents": incidents,
                    "regularite_flux": regularity,
                },
                "depenses_somptuaires": somptuaires,
                "incidents": incidents,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # ======================================================================
    # DEVIS FOURNISSEUR — seul appel Claude (document non structuré)
    # ======================================================================

    async def _extract_devis_with_claude(self, content: bytes, filename: str) -> dict:
        """Extrait les données d'un devis — SEUL usage de Claude API."""
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
                    "max_tokens": 1024,
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
                                        "Extrais du devis. JSON uniquement : "
                                        '{"marque":"","modele":"","annee_fabrication":null,'
                                        '"numero_serie":"","vin":"","kilometrage":null,'
                                        '"heures_moteur":null,"prix_achat_ht":null,'
                                        '"options":[],"fournisseur_nom":"","fournisseur_siren":"","date_devis":""}'
                                        " Null si introuvable."
                                    ),
                                },
                            ],
                        }
                    ],
                },
            )

        if resp.status_code != 200:
            return {"status": "error", "error": f"Claude API {resp.status_code}"}

        data = resp.json()
        text = data.get("content", [{}])[0].get("text", "")

        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            extracted = json.loads(text[start:end])
        except (ValueError, json.JSONDecodeError):
            return {"status": "error", "error": "Extraction échouée"}

        return {"status": "done", "extracted": extracted}

    # ======================================================================
    # UTILS
    # ======================================================================

    def detect_somptuaire(
        self, libelles: list[str], seuil: float = 500
    ) -> list[dict]:
        signals = []
        for libelle in libelles:
            libelle_lower = libelle.lower()
            for keyword in self.SOMPTUAIRE_KEYWORDS:
                if keyword in libelle_lower:
                    signals.append({
                        "libelle": libelle.strip(),
                        "keyword": keyword,
                        "type": "somptuaire",
                    })
                    break
        return signals
