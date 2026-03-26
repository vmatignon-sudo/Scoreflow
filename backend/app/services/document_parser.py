from __future__ import annotations

from typing import Any
from fastapi import UploadFile


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

    async def parse_liasse(self, file: UploadFile, deal_id: str) -> dict[str, Any]:
        """Parse une liasse fiscale PDF/XML."""
        content = await file.read()
        filename = file.filename or ""

        if filename.lower().endswith(".xml"):
            return await self._parse_liasse_xml(content)
        else:
            return await self._parse_liasse_pdf(content)

    async def parse_devis(self, file: UploadFile, deal_id: str) -> dict[str, Any]:
        """Parse un devis fournisseur avec OCR + Claude."""
        content = await file.read()
        # TODO: OCR with Mistral then extract with Claude API
        return {
            "status": "pending",
            "message": "Document en cours d'analyse",
            "extracted": {},
        }

    async def parse_releve_bancaire(
        self, file: UploadFile, deal_id: str
    ) -> dict[str, Any]:
        """Parse un relevé bancaire et détecte les signaux."""
        content = await file.read()
        # TODO: OCR + detection
        return {
            "status": "pending",
            "incidents": [],
            "depenses_somptuaires": [],
            "flux_analysis": {},
        }

    async def _parse_liasse_xml(self, content: bytes) -> dict:
        """Parse une liasse XML DGFiP."""
        # TODO: Parse XML cerfa format
        return {"format": "xml", "status": "pending"}

    async def _parse_liasse_pdf(self, content: bytes) -> dict:
        """Parse une liasse PDF via OCR."""
        # TODO: Mistral OCR + Claude extraction
        return {"format": "pdf", "status": "pending"}

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
