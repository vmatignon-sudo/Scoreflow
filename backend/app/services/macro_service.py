from __future__ import annotations

import httpx
from typing import Any

from app.core.cache import cache_get, cache_set, cache_key


class MacroService:
    """Service pour récupérer les indicateurs macroéconomiques."""

    INSEE_MELODI_URL = "https://api.insee.fr/melodi/data"
    BDF_WEBSTAT_URL = "https://webstat.banque-france.fr/api"
    EUROSTAT_URL = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"

    CACHE_TTL = 86400  # 24h

    async def get_current_indicators(self) -> dict[str, Any]:
        """Récupère les indicateurs macro actuels (cache 24h)."""
        key = cache_key("macro", "indicators")
        cached = cache_get(key)
        if cached is not None:
            return cached

        indicators = {}

        async with httpx.AsyncClient(timeout=10.0) as client:
            # PIB
            indicators["pib_croissance"] = await self._fetch_pib(client)
            # Inflation
            indicators["inflation"] = await self._fetch_inflation(client)
            # Taux BCE
            indicators["taux_bce"] = await self._fetch_taux_bce(client)
            # PMI
            indicators["pmi_manufacturier"] = await self._fetch_pmi(client)
            # Confiance
            indicators["indice_confiance_entreprises"] = await self._fetch_confiance(client)
            # Phase du cycle
            indicators["phase_cycle"] = self._determine_phase(indicators)

        cache_set(key, indicators, self.CACHE_TTL)
        return indicators

    async def _fetch_pib(self, client: httpx.AsyncClient) -> float:
        try:
            # INSEE Melodi API - PIB trimestriel
            resp = await client.get(
                f"{self.INSEE_MELODI_URL}/FR/PIB",
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                return float(data.get("value", 1.0))
        except Exception:
            pass
        return 1.0  # Fallback

    async def _fetch_inflation(self, client: httpx.AsyncClient) -> float:
        try:
            resp = await client.get(
                f"{self.INSEE_MELODI_URL}/FR/IPC",
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                return float(data.get("value", 2.5))
        except Exception:
            pass
        return 2.5

    async def _fetch_taux_bce(self, client: httpx.AsyncClient) -> float:
        try:
            resp = await client.get(
                f"{self.BDF_WEBSTAT_URL}/dataset/FM/M.U2.EUR.RT.MM.EURIBOR3MD_.HSTA",
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                return float(data.get("value", 4.0))
        except Exception:
            pass
        return 4.0

    async def _fetch_pmi(self, client: httpx.AsyncClient) -> float:
        # PMI from Eurostat
        return 48.5  # Placeholder

    async def _fetch_confiance(self, client: httpx.AsyncClient) -> float:
        return 98.0  # Placeholder

    def _determine_phase(self, indicators: dict) -> str:
        pib = indicators.get("pib_croissance", 0)
        pmi = indicators.get("pmi_manufacturier", 50)
        confiance = indicators.get("indice_confiance_entreprises", 100)

        if pib > 2 and pmi > 52 and confiance > 105:
            return "expansion"
        elif pib > 0.5 and pmi > 48:
            return "plateau"
        elif pib > -0.5:
            return "ralentissement"
        else:
            return "recession"
