from __future__ import annotations

import httpx
from typing import Any

from app.core.cache import cache_get, cache_set, cache_key


class SectorService:
    """Service pour récupérer les données sectorielles via NAF."""

    RATIOS_SECTORS_URL = (
        "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/"
        "ratios_inpi_bce_sectors/records"
    )
    RATIOS_SIREN_URL = (
        "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/"
        "ratios_inpi_bce/records"
    )
    BODACC_URL = "https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records"

    CACHE_TTL = 86400  # 24h

    async def get_sector_data(self, code_naf: str) -> dict[str, Any]:
        key = cache_key("sector", code_naf)
        cached = cache_get(key)
        if cached is not None:
            return cached

        async with httpx.AsyncClient(timeout=10.0) as client:
            ratios = await self._fetch_sector_ratios(client, code_naf)
            defaillances = await self._fetch_defaillances(client, code_naf)

        result = {
            "code_naf": code_naf,
            "ratios_sectoriels": ratios,
            "defaillances": defaillances,
        }
        cache_set(key, result, self.CACHE_TTL)
        return result

    async def get_siren_ratios(self, siren: str) -> dict[str, Any]:
        """Récupère les ratios financiers par SIREN depuis l'API open data."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                resp = await client.get(
                    self.RATIOS_SIREN_URL,
                    params={"where": f'siren="{siren}"', "limit": 5},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {"records": data.get("results", [])}
            except Exception:
                pass
        return {"records": []}

    async def _fetch_sector_ratios(
        self, client: httpx.AsyncClient, code_naf: str
    ) -> dict:
        try:
            resp = await client.get(
                self.RATIOS_SECTORS_URL,
                params={"where": f'naf="{code_naf}"', "limit": 20},
            )
            if resp.status_code == 200:
                data = resp.json()
                records = data.get("results", [])
                return self._parse_sector_percentiles(records)
        except Exception:
            pass
        return {}

    async def _fetch_defaillances(
        self, client: httpx.AsyncClient, code_naf: str
    ) -> dict:
        try:
            resp = await client.get(
                self.BODACC_URL,
                params={
                    "where": f'codeactivite="{code_naf}" AND typeavis="Procédure collective"',
                    "limit": 50,
                    "order_by": "dateparution DESC",
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                return {
                    "count_30j": len([r for r in results]),
                    "records": results[:10],
                }
        except Exception:
            pass
        return {"count_30j": 0, "records": []}

    @staticmethod
    def _parse_sector_percentiles(records: list) -> dict:
        """Parse les percentiles Q10/Q25/Q50/Q75/Q90 des ratios sectoriels."""
        percentiles = {}
        for record in records:
            ratio_name = record.get("ratio_name", "")
            if ratio_name:
                percentiles[ratio_name] = {
                    "q10": record.get("q10"),
                    "q25": record.get("q25"),
                    "q50": record.get("q50"),
                    "q75": record.get("q75"),
                    "q90": record.get("q90"),
                }
        return percentiles
