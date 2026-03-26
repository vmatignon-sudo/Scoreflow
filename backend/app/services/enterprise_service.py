from __future__ import annotations

import httpx
from typing import Any


class EnterpriseService:
    """Service d'enrichissement entreprise via APIs publiques françaises."""

    RECHERCHE_URL = "https://recherche-entreprises.api.gouv.fr/search"
    INPI_URL = "https://data.inpi.fr/api"

    async def search_by_siren(self, siren: str) -> dict[str, Any]:
        """Enrichissement automatique depuis API Recherche Entreprises."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    self.RECHERCHE_URL,
                    params={"q": siren, "per_page": 1},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get("results", [])
                    if results:
                        return self._normalize_enterprise(results[0])
            except Exception:
                pass
        return {}

    async def search_by_name(self, name: str) -> list[dict[str, Any]]:
        """Recherche par raison sociale."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    self.RECHERCHE_URL,
                    params={"q": name, "per_page": 5},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return [
                        self._normalize_enterprise(r) for r in data.get("results", [])
                    ]
            except Exception:
                pass
        return []

    async def check_inpi_liasses(self, siren: str) -> dict[str, Any]:
        """Vérifie si des liasses fiscales sont disponibles via INPI."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    f"{self.INPI_URL}/companies/{siren}/documents",
                )
                if resp.status_code == 200:
                    data = resp.json()
                    liasses = [
                        d for d in data.get("documents", [])
                        if "liasse" in d.get("type", "").lower()
                        or "compte" in d.get("type", "").lower()
                    ]
                    return {
                        "available": len(liasses) > 0,
                        "documents": liasses,
                    }
            except Exception:
                pass
        return {"available": False, "documents": []}

    @staticmethod
    def _normalize_enterprise(raw: dict) -> dict[str, Any]:
        """Normalise les données API en format ScoreFlow."""
        siege = raw.get("siege", {})
        dirigeants = raw.get("dirigeants", [])
        dirigeant = dirigeants[0] if dirigeants else {}

        return {
            "siren": raw.get("siren", ""),
            "raison_sociale": raw.get("nom_complet", ""),
            "forme_juridique": raw.get("nature_juridique", ""),
            "code_naf": siege.get("activite_principale", ""),
            "secteur_label": siege.get("libelle_activite_principale", ""),
            "adresse": f"{siege.get('adresse', '')} {siege.get('code_postal', '')} {siege.get('commune', '')}".strip(),
            "date_creation_entreprise": raw.get("date_creation", ""),
            "dirigeant_nom": dirigeant.get("nom", ""),
            "dirigeant_prenom": dirigeant.get("prenoms", ""),
            "dirigeant_date_nomination": dirigeant.get("date_mise_a_jour", ""),
            "nombre_etablissements": raw.get("nombre_etablissements", 0),
            "tranche_effectif": raw.get("tranche_effectif_salarie", ""),
            "etat_administratif": raw.get("etat_administratif", ""),
            "procedures_collectives": raw.get("complements", {}).get(
                "collectivite_territoriale", {}
            ),
        }
