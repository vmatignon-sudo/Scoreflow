from __future__ import annotations

from typing import Any


# Matrice de croisement macro × sectoriel
CROSS_MATRIX = {
    ("bon", "bon"): {"label": "Excellent", "bonus": 0},
    ("bon", "neutre"): {"label": "Bon", "bonus": 0},
    ("bon", "mauvais"): {"label": "Vigilance", "bonus": -2},
    ("neutre", "bon"): {"label": "Bon", "bonus": 1},
    ("neutre", "neutre"): {"label": "Passable", "bonus": 0},
    ("neutre", "mauvais"): {"label": "Risqué", "bonus": -1},
    ("mauvais", "bon"): {"label": "Bon", "bonus": 1},
    ("mauvais", "neutre"): {"label": "Vigilance", "bonus": -1},
    ("mauvais", "mauvais"): {"label": "Risqué", "bonus": -2},
}


class MacroSectorScorer:
    """Niveaux 1+2 — Macro × Sectoriel. Score combiné /20."""

    @staticmethod
    def score_macro(indicators: dict) -> tuple[float, str]:
        """Score macro brut /20 à partir des indicateurs."""
        score = 10.0

        # PIB
        pib = indicators.get("pib_croissance", 0)
        if pib > 2.0:
            score += 2.0
        elif pib > 0.5:
            score += 1.0
        elif pib > 0:
            score += 0
        elif pib > -1.0:
            score -= 1.5
        else:
            score -= 3.0

        # Inflation
        inflation = indicators.get("inflation", 2.0)
        if inflation < 2.0:
            score += 1.0
        elif inflation < 3.5:
            score += 0
        elif inflation < 5.0:
            score -= 1.0
        else:
            score -= 2.0

        # Taux BCE
        taux = indicators.get("taux_bce", 4.0)
        if taux < 2.0:
            score += 1.5
        elif taux < 3.5:
            score += 0.5
        elif taux < 5.0:
            score -= 0.5
        else:
            score -= 1.5

        # PMI
        pmi = indicators.get("pmi_manufacturier", 50)
        if pmi > 55:
            score += 1.5
        elif pmi > 50:
            score += 0.5
        elif pmi > 45:
            score -= 0.5
        else:
            score -= 2.0

        # Confiance
        confiance = indicators.get("indice_confiance_entreprises", 100)
        if confiance > 110:
            score += 1.0
        elif confiance > 95:
            score += 0
        else:
            score -= 1.0

        score = max(0, min(20, score))

        # Classify phase
        if score >= 14:
            phase = "bon"
        elif score >= 8:
            phase = "neutre"
        else:
            phase = "mauvais"

        return round(score, 2), phase

    @staticmethod
    def score_sector(sector_data: dict) -> tuple[float, str]:
        """Score sectoriel brut /20."""
        score = 10.0

        # Taux de défaillance sectoriel
        taux_def = sector_data.get("taux_defaillance_sectoriel", 0.02)
        if taux_def < 0.01:
            score += 3.0
        elif taux_def < 0.03:
            score += 1.0
        elif taux_def < 0.06:
            score -= 1.0
        else:
            score -= 3.0

        # DSO moyen sectoriel
        dso = sector_data.get("dso_moyen_sectoriel", 60)
        if dso < 30:
            score += 1.5
        elif dso < 60:
            score += 0.5
        elif dso < 90:
            score -= 0.5
        else:
            score -= 1.5

        # Tendance
        tendance = sector_data.get("tendance_sectoriel", "stable")
        if tendance == "croissance":
            score += 2.0
        elif tendance == "stable":
            score += 0
        elif tendance == "ralentissement":
            score -= 1.0
        else:  # crise
            score -= 3.0

        # Chocs récents
        chocs = sector_data.get("chocs_recents", [])
        score -= len(chocs) * 1.0

        score = max(0, min(20, score))

        if score >= 14:
            phase = "bon"
        elif score >= 8:
            phase = "neutre"
        else:
            phase = "mauvais"

        return round(score, 2), phase

    async def compute(self, deal_data: dict) -> dict[str, Any]:
        macro_data = deal_data.get("macro_data", {})
        sector_data = deal_data.get("sector_data", {})

        score_m, phase_m = self.score_macro(macro_data)
        score_s, phase_s = self.score_sector(sector_data)

        # Croisement
        cross_key = (phase_m, phase_s)
        cross = CROSS_MATRIX.get(cross_key, {"label": "Passable", "bonus": 0})

        # Score combiné : macro 40% + sectoriel 60% + bonus/malus
        combined = score_m * 0.4 + score_s * 0.6 + cross["bonus"]
        combined = max(0, min(20, round(combined, 2)))

        return {
            "score": combined,
            "score_macro": score_m,
            "score_sectoriel": score_s,
            "phase_macro": phase_m,
            "phase_sectoriel": phase_s,
            "matrice_croisement": cross["label"],
            "bonus_malus": cross["bonus"],
        }
