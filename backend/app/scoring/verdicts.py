from typing import Any


class VerdictEngine:
    """Détermine le verdict final : GO / GO CONDITIONNEL / NO GO / VETO."""

    SCORE_LABELS = {
        (17, 20): {"mention": "Excellent", "color": "#059669"},
        (13, 16): {"mention": "Bon", "color": "#10B981"},
        (10, 12): {"mention": "Passable", "color": "#F59E0B"},
        (7, 9): {"mention": "Insuffisant", "color": "#EF6C00"},
        (4, 6): {"mention": "Mauvais", "color": "#DC2626"},
        (0, 3): {"mention": "Critique", "color": "#991B1B"},
    }

    @staticmethod
    def get_mention(score: float) -> dict:
        score_int = int(score)
        for (low, high), data in VerdictEngine.SCORE_LABELS.items():
            if low <= score_int <= high:
                return {**data, "score": round(score, 1)}
        return {"mention": "Critique", "color": "#991B1B", "score": round(score, 1)}

    def determine(
        self,
        score_total: float,
        score_dirigeant: float,
        deal_data: dict,
        org_settings: dict,
    ) -> dict[str, Any]:
        seuil_go = org_settings.get("seuil_go", 14)
        seuil_conditionnel = org_settings.get("seuil_go_conditionnel", 10)

        # Check VETO conditions (independent of score)
        veto = self._check_veto(score_dirigeant, deal_data, org_settings)
        if veto:
            return {
                "verdict": "veto",
                "label": "VETO",
                "raison": veto,
                "message": f"Financement bloqué : {veto}",
                "style": {
                    "bg": "#FEF2F2",
                    "text": "#991B1B",
                    "border": "#991B1B",
                },
                "mention": self.get_mention(score_total),
            }

        # GO
        if score_total >= seuil_go:
            return {
                "verdict": "go",
                "label": "GO",
                "message": "L'analyse globale est favorable.",
                "style": {
                    "bg": "#F0FDF4",
                    "text": "#059669",
                    "border": "#059669",
                },
                "mention": self.get_mention(score_total),
            }

        # GO CONDITIONNEL
        if score_total >= seuil_conditionnel:
            return {
                "verdict": "go_conditionnel",
                "label": "GO CONDITIONNEL",
                "message": "Points de vigilance — financement possible sous conditions.",
                "style": {
                    "bg": "#FFFBEB",
                    "text": "#B45309",
                    "border": "#F59E0B",
                },
                "mention": self.get_mention(score_total),
            }

        # NO GO
        return {
            "verdict": "no_go",
            "label": "NO GO",
            "message": "Risque trop élevé. Financement déconseillé.",
            "style": {
                "bg": "#FEF2F2",
                "text": "#991B1B",
                "border": "#DC2626",
            },
            "mention": self.get_mention(score_total),
        }

    def _check_veto(
        self, score_dirigeant: float, deal_data: dict, org_settings: dict
    ) -> str | None:
        # Score dirigeant < 4
        if score_dirigeant < 4:
            return "Score dirigeant critique (<4/20)"

        # Cotation BDF = P
        if deal_data.get("cotation_bdf_credit") == "P":
            return "Cotation BDF = P (procédure collective)"

        # Indicateur BDF = 060
        if deal_data.get("indicateur_dirigeant_bdf") == "060":
            return "Indicateur dirigeant BDF = 060"

        # Liquidation judiciaire < 3 ans
        director = deal_data.get("director_analysis", {})
        if director.get("liquidation_recente_3ans"):
            return "Liquidation judiciaire datant de moins de 3 ans"

        # Nombre de liquidations >= seuil
        nb_liq = director.get("nb_societes_liquidees", 0)
        seuil = org_settings.get("nb_liquidations_veto", 2)
        if nb_liq >= seuil:
            return f"{nb_liq} liquidations (seuil: {seuil})"

        return None
