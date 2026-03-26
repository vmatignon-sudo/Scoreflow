from typing import Any
from app.scoring.financial import FinancialScorer
from app.scoring.asset import AssetScorer
from app.scoring.director import DirectorScorer
from app.scoring.macro_sector import MacroSectorScorer
from app.scoring.verdicts import VerdictEngine


class ScoringEngine:
    """Moteur de scoring principal — orchestre les 5 dimensions."""

    def __init__(self):
        self.financial = FinancialScorer()
        self.asset = AssetScorer()
        self.director = DirectorScorer()
        self.macro_sector = MacroSectorScorer()
        self.verdict_engine = VerdictEngine()

    async def compute_full_score(
        self, deal_id: str, organization_id: str, force: bool = False
    ) -> dict[str, Any]:
        # Retrieve deal data from Supabase
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

        # Determine verdict
        verdict = self.verdict_engine.determine(
            score_total=score_total,
            score_dirigeant=score_dirigeant["score"],
            deal_data=deal_data,
            org_settings=org_settings,
        )

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
        }

        # Generate optimizer suggestions if needed
        if verdict["verdict"] in ("go_conditionnel", "no_go"):
            result["optimizer"] = await self._generate_optimizer_suggestions(
                deal_data, org_settings, score_total, weights
            )

        return result

    async def simulate_negotiation(self, deal_id: str, params: dict) -> dict:
        deal_data = await self._fetch_deal_data(deal_id)
        # Apply negotiation params
        for key, value in params.items():
            if value is not None:
                deal_data[key] = value
        # Recompute affected scores
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
        # Compute current score first
        current = await self.compute_full_score(deal_id, organization_id)
        if current["verdict"]["verdict"] == "go":
            return []
        return current.get("optimizer", [])

    async def _fetch_deal_data(self, deal_id: str) -> dict:
        # TODO: Fetch from Supabase
        return {"id": deal_id}

    async def _fetch_org_settings(self, organization_id: str) -> dict:
        # TODO: Fetch from Supabase
        return {
            "ponderation_macro_sectoriel": 20,
            "ponderation_financier": 30,
            "ponderation_materiel": 30,
            "ponderation_dirigeant": 20,
            "seuil_go": 14,
            "seuil_go_conditionnel": 10,
        }

    async def _generate_optimizer_suggestions(
        self, deal_data: dict, org_settings: dict, current_score: float, weights: dict
    ) -> list[dict]:
        target = org_settings.get("seuil_go", 14)
        gap = target - current_score
        suggestions = []

        # Priority: depot_garantie > apport > duree > valeur_residuelle
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
