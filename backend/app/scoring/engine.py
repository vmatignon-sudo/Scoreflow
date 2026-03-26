from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.scoring.financial import FinancialScorer
from app.scoring.asset import AssetScorer
from app.scoring.director import DirectorScorer
from app.scoring.macro_sector import MacroSectorScorer
from app.scoring.verdicts import VerdictEngine
from app.scoring.predictive import PredictiveScorer

logger = logging.getLogger(__name__)

SUPABASE_HEADERS = {
    "apikey": "",
    "Authorization": "",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def _headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


class ScoringEngine:
    """Moteur de scoring principal — orchestre les 5 dimensions."""

    def __init__(self):
        self.financial = FinancialScorer()
        self.asset = AssetScorer()
        self.director = DirectorScorer()
        self.macro_sector = MacroSectorScorer()
        self.verdict_engine = VerdictEngine()
        self.predictive = PredictiveScorer()

    async def compute_full_score(
        self, deal_id: str, organization_id: str, force: bool = False
    ) -> dict[str, Any]:
        deal_data = await self._fetch_deal_data(deal_id)
        org_settings = await self._fetch_org_settings(organization_id)

        # Compute each dimension score (/20)
        score_macro_sector = await self.macro_sector.compute(deal_data)
        score_financier = await self.financial.compute(deal_data)
        score_materiel = await self.asset.compute(deal_data)
        score_dirigeant = await self.director.compute(deal_data)

        # Weighted total
        weights = {
            "macro_sectoriel": org_settings.get("ponderation_macro_sectoriel", 20) / 100,
            "financier": org_settings.get("ponderation_financier", 30) / 100,
            "materiel": org_settings.get("ponderation_materiel", 30) / 100,
            "dirigeant": org_settings.get("ponderation_dirigeant", 20) / 100,
        }

        score_total = (
            score_macro_sector["score"] * weights["macro_sectoriel"]
            + score_financier["score"] * weights["financier"]
            + score_materiel["score"] * weights["materiel"]
            + score_dirigeant["score"] * weights["dirigeant"]
        )

        verdict = self.verdict_engine.determine(
            score_total=score_total,
            score_dirigeant=score_dirigeant["score"],
            deal_data=deal_data,
            org_settings=org_settings,
        )

        # Persist financial ratios to Supabase
        if score_financier.get("ratios"):
            await self._save_financial_ratios(deal_id, deal_data, score_financier)

        # Predictive model (Signaux Faibles inspired)
        predictive = await self.predictive.compute(deal_data)

        result = {
            "deal_id": deal_id,
            "scores": {
                "macro_sectoriel": score_macro_sector,
                "financier": score_financier,
                "materiel": score_materiel,
                "dirigeant": score_dirigeant,
            },
            "score_total": round(score_total, 2),
            "verdict": verdict,
            "ponderation_used": weights,
            "predictive": predictive,
        }

        if verdict["verdict"] in ("go_conditionnel", "no_go"):
            result["optimizer"] = await self._generate_optimizer_suggestions(
                deal_data, org_settings, score_total, weights
            )

        return result

    async def simulate_negotiation(self, deal_id: str, params: dict) -> dict:
        deal_data = await self._fetch_deal_data(deal_id)
        for key, value in params.items():
            if value is not None:
                deal_data[key] = value
        score_materiel = await self.asset.compute(deal_data)
        score_financier = await self.financial.compute(deal_data)
        return {
            "deal_id": deal_id,
            "params_applied": params,
            "new_scores": {
                "materiel": score_materiel,
                "financier": score_financier,
            },
        }

    async def optimize_deal(self, deal_id: str, organization_id: str) -> list[dict]:
        current = await self.compute_full_score(deal_id, organization_id)
        if current["verdict"]["verdict"] == "go":
            return []
        return current.get("optimizer", [])

    # ---- Supabase data fetchers ----

    async def _fetch_deal_data(self, deal_id: str) -> dict:
        """Fetch deal + asset + director + financial data from Supabase."""
        base = settings.supabase_url
        if not base or not settings.supabase_service_role_key:
            logger.warning("Supabase not configured, returning empty deal data")
            return {"id": deal_id}

        headers = _headers()
        result: dict[str, Any] = {"id": deal_id}

        async with httpx.AsyncClient(timeout=15.0) as client:
            # Deal
            resp = await client.get(
                f"{base}/rest/v1/deals?id=eq.{deal_id}&select=*",
                headers=headers,
            )
            if resp.status_code == 200:
                rows = resp.json()
                if rows:
                    result.update(rows[0])

            # Asset
            resp = await client.get(
                f"{base}/rest/v1/deal_assets?deal_id=eq.{deal_id}&select=*&limit=1",
                headers=headers,
            )
            if resp.status_code == 200:
                rows = resp.json()
                if rows:
                    result["asset"] = rows[0]

            # Financial ratios (latest year)
            resp = await client.get(
                f"{base}/rest/v1/deal_financial_ratios?deal_id=eq.{deal_id}&select=*&order=annee.desc&limit=1",
                headers=headers,
            )
            if resp.status_code == 200:
                rows = resp.json()
                if rows:
                    result["financial_ratios"] = rows[0]

            # Director analysis
            resp = await client.get(
                f"{base}/rest/v1/deal_director_analysis?deal_id=eq.{deal_id}&select=*&limit=1",
                headers=headers,
            )
            if resp.status_code == 200:
                rows = resp.json()
                if rows:
                    result["director_analysis"] = rows[0]

        logger.info(
            "Fetched deal data for %s: keys=%s, has_asset=%s, has_financial=%s",
            deal_id,
            list(result.keys()),
            "asset" in result,
            "financial_ratios" in result,
        )

        return result

    async def _fetch_org_settings(self, organization_id: str) -> dict:
        base = settings.supabase_url
        if not base or not settings.supabase_service_role_key:
            return self._default_settings()

        headers = _headers()

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{base}/rest/v1/organizations?id=eq.{organization_id}&select=settings",
                headers=headers,
            )
            if resp.status_code == 200:
                rows = resp.json()
                if rows and rows[0].get("settings"):
                    return rows[0]["settings"]

        return self._default_settings()

    @staticmethod
    def _default_settings() -> dict:
        return {
            "ponderation_macro_sectoriel": 20,
            "ponderation_financier": 30,
            "ponderation_materiel": 30,
            "ponderation_dirigeant": 20,
            "seuil_go": 14,
            "seuil_go_conditionnel": 10,
        }

    async def _save_financial_ratios(
        self, deal_id: str, deal_data: dict, score_financier: dict
    ) -> None:
        """Persist computed ratios to deal_financial_ratios table."""
        base = settings.supabase_url
        if not base or not settings.supabase_service_role_key:
            return

        headers = _headers()
        ratios = score_financier.get("ratios", {})
        fin = deal_data.get("financial_ratios", {})

        payload = {
            "deal_id": deal_id,
            "annee": fin.get("annee_exercice") or fin.get("annee"),
            "ca": fin.get("ca"),
            "ebitda": fin.get("ebitda"),
            "ebit": fin.get("ebit"),
            "resultat_net": fin.get("resultat_net"),
            "caf": fin.get("caf"),
            "actif_total": fin.get("actif_total"),
            "actif_circulant": fin.get("actif_circulant"),
            "stocks": fin.get("stocks"),
            "creances_clients": fin.get("creances_clients"),
            "passif_total": fin.get("passif_total"),
            "passif_circulant": fin.get("passif_circulant"),
            "dettes_financieres": fin.get("dettes_financieres"),
            "fonds_propres": fin.get("fonds_propres"),
            "capitaux_permanents": fin.get("capitaux_permanents"),
            "tresorerie": fin.get("tresorerie"),
            "charges_personnel": fin.get("charges_personnel"),
            "valeur_ajoutee": fin.get("valeur_ajoutee"),
            "frais_financiers": fin.get("frais_financiers"),
            "ratios": ratios,
            "score_altman_z": score_financier.get("altman", {}).get("z"),
            "altman_zone": score_financier.get("altman", {}).get("zone"),
            "score_conan_holder": score_financier.get("conan_holder", {}).get("z"),
            "conan_zone": score_financier.get("conan_holder", {}).get("zone"),
        }

        # Remove None values to avoid PostgREST errors
        payload = {k: v for k, v in payload.items() if v is not None}

        async with httpx.AsyncClient(timeout=10.0) as client:
            # Upsert: delete existing then insert
            await client.delete(
                f"{base}/rest/v1/deal_financial_ratios?deal_id=eq.{deal_id}",
                headers=headers,
            )
            resp = await client.post(
                f"{base}/rest/v1/deal_financial_ratios",
                headers=headers,
                json=payload,
            )
            if resp.status_code >= 300:
                logger.error("Failed to save ratios: %s %s", resp.status_code, resp.text)
            else:
                logger.info("Saved financial ratios for deal %s", deal_id)

    async def _generate_optimizer_suggestions(
        self, deal_data: dict, org_settings: dict, current_score: float, weights: dict
    ) -> list[dict]:
        target = org_settings.get("seuil_go", 14)
        gap = target - current_score
        suggestions = []

        if gap > 0:
            suggestions.append({
                "type": "depot_garantie",
                "description": "Augmenter le dépôt de garantie",
                "impact_estime": min(gap * 0.3, 2.0),
                "effort": "faible",
            })
            suggestions.append({
                "type": "apport_initial",
                "description": "Augmenter l'apport initial",
                "impact_estime": min(gap * 0.4, 3.0),
                "effort": "moyen",
            })
            suggestions.append({
                "type": "duree_mois",
                "description": "Réduire la durée du financement",
                "impact_estime": min(gap * 0.3, 2.0),
                "effort": "moyen",
            })

        return suggestions[:3]
