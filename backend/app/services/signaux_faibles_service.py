from __future__ import annotations

import httpx
from typing import Any


class SignauxFaiblesService:
    """Service d'intégration des données publiques Signaux Faibles.

    Sources :
    - data.economie.gouv.fr : ratios financiers détaillés par SIREN
    - data.economie.gouv.fr : ratios sectoriels par NAF
    - Méthodologie : github.com/signaux-faibles/
    """

    RATIOS_SIREN_URL = (
        "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/"
        "ratios_inpi_bce/records"
    )
    RATIOS_SECTORS_URL = (
        "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/"
        "ratios_inpi_bce_sectors/records"
    )

    async def get_siren_ratios(self, siren: str) -> dict[str, Any]:
        """Récupère les ratios financiers publics par SIREN.

        Source : API ratios_inpi_bce (data.economie.gouv.fr)
        Données : ratios calculés par le Ministère de l'Économie.
        """
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(
                    self.RATIOS_SIREN_URL,
                    params={
                        "where": f'siren="{siren}"',
                        "limit": 10,
                        "order_by": "annee DESC",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    records = data.get("results", [])
                    return {
                        "available": len(records) > 0,
                        "records": records,
                        "years": [r.get("annee") for r in records if r.get("annee")],
                    }
            except Exception:
                pass
        return {"available": False, "records": [], "years": []}

    async def get_sector_benchmarks(self, code_naf: str) -> dict[str, Any]:
        """Récupère les percentiles sectoriels (Q10/Q25/Q50/Q75/Q90).

        Source : API ratios_inpi_bce_sectors
        Permet de positionner une entreprise vs son secteur.
        """
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                naf_short = code_naf[:4] if len(code_naf) > 4 else code_naf
                resp = await client.get(
                    self.RATIOS_SECTORS_URL,
                    params={
                        "where": f'naf="{naf_short}"',
                        "limit": 50,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    records = data.get("results", [])
                    return {
                        "available": len(records) > 0,
                        "benchmarks": self._parse_benchmarks(records),
                        "naf": naf_short,
                    }
            except Exception:
                pass
        return {"available": False, "benchmarks": {}, "naf": code_naf}

    async def cross_validate_ratios(
        self, computed_ratios: dict, siren: str
    ) -> dict[str, Any]:
        """Vérifie croisé : compare les ratios calculés depuis la liasse
        avec les ratios de l'API publique pour le même SIREN.

        Retourne les écarts > 5% pour signalement.
        """
        public = await self.get_siren_ratios(siren)
        if not public["available"]:
            return {"validated": False, "reason": "Données publiques non disponibles"}

        latest = public["records"][0] if public["records"] else {}
        discrepancies = []

        # Mapping entre nos ratios et ceux de l'API publique
        mapping = {
            "autonomie_financiere": "ratio_autonomie_financiere",
            "endettement": "ratio_endettement",
            "liquidite_generale": "ratio_liquidite_generale",
            "marge_nette": "ratio_marge_nette",
            "rotation_actif": "ratio_rotation_actif",
        }

        for our_key, api_key in mapping.items():
            our_val = computed_ratios.get(our_key)
            api_val = latest.get(api_key)
            if our_val is not None and api_val is not None:
                try:
                    our_f = float(our_val)
                    api_f = float(api_val)
                    if api_f != 0:
                        ecart = abs(our_f - api_f) / abs(api_f)
                        if ecart > 0.05:
                            discrepancies.append({
                                "ratio": our_key,
                                "computed": round(our_f, 4),
                                "public": round(api_f, 4),
                                "ecart_pct": round(ecart * 100, 1),
                            })
                except (ValueError, TypeError):
                    pass

        return {
            "validated": True,
            "discrepancies": discrepancies,
            "has_discrepancies": len(discrepancies) > 0,
            "public_year": latest.get("annee"),
        }

    @staticmethod
    def _parse_benchmarks(records: list) -> dict[str, dict]:
        """Parse les percentiles sectoriels en structure utilisable."""
        benchmarks: dict[str, dict] = {}
        for record in records:
            name = record.get("ratio_name") or record.get("ratio") or ""
            if name:
                benchmarks[name] = {
                    "q10": record.get("q10") or record.get("percentile_10"),
                    "q25": record.get("q25") or record.get("percentile_25"),
                    "q50": record.get("q50") or record.get("percentile_50") or record.get("mediane"),
                    "q75": record.get("q75") or record.get("percentile_75"),
                    "q90": record.get("q90") or record.get("percentile_90"),
                }
        return benchmarks
