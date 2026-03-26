from __future__ import annotations

import math
from typing import Any


class PredictiveScorer:
    """Module prédictif inspiré Signaux Faibles.

    Calcule une probabilité de défaillance à 18 mois à partir
    de variables explicatives : ratios financiers, tendances,
    comportement de paiement, et données sectorielles.

    Méthodologie :
    - Score logistique combinant 12 variables pondérées
    - Calibré sur les distributions du projet Signaux Faibles
    - Variables : URSSAF, activité partielle, ratios financiers, tendance CA
    """

    # Weights calibrés (inspirés du modèle Signaux Faibles open source)
    WEIGHTS = {
        "dette_sur_caf": 0.15,
        "autonomie_financiere": -0.12,
        "liquidite_generale": -0.10,
        "marge_nette": -0.13,
        "endettement": 0.11,
        "couverture_ff": -0.08,
        "dso": 0.06,
        "altman_zone_danger": 0.14,
        "conan_zone_difficultes": 0.12,
        "privilege_urssaf": 0.10,
        "privilege_tresor": 0.09,
        "changement_dirigeant_recent": 0.05,
        "taux_defaillance_sectoriel": 0.08,
    }

    # Intercept du modèle logistique
    INTERCEPT = -1.2

    @staticmethod
    def _normalize(value: float | None, mean: float, std: float) -> float:
        """Normalise une variable (z-score)."""
        if value is None:
            return 0.0
        return (value - mean) / std if std > 0 else 0.0

    @staticmethod
    def _sigmoid(x: float) -> float:
        """Fonction sigmoïde pour convertir en probabilité."""
        return 1.0 / (1.0 + math.exp(-max(-10, min(10, x))))

    def compute_default_probability(
        self,
        ratios: dict[str, Any],
        altman_zone: str | None,
        conan_zone: str | None,
        director_data: dict[str, Any],
        sector_data: dict[str, Any],
        deal_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Calcule la probabilité de défaillance à 18 mois.

        Returns:
            dict with probability, risk_level, contributing_factors, confidence
        """
        features: dict[str, float] = {}
        available: set[str] = set()  # Track which features have real data

        # ---- Ratios financiers (normalisés sur distributions PME françaises) ----
        ratio_defs = [
            ("dette_sur_caf", 3.5, 2.8),
            ("autonomie_financiere", 0.32, 0.18),
            ("liquidite_generale", 1.45, 0.65),
            ("marge_nette", 0.035, 0.06),
            ("endettement", 1.1, 1.5),
            ("couverture_ff", 4.5, 3.0),
            ("dso", 55.0, 25.0),
        ]
        for name, mean, std in ratio_defs:
            val = ratios.get(name)
            features[name] = self._normalize(val, mean=mean, std=std)
            if val is not None:
                available.add(name)

        # ---- Variables binaires ----
        features["altman_zone_danger"] = 1.0 if altman_zone == "danger" else 0.0
        features["conan_zone_difficultes"] = 1.0 if conan_zone == "difficultes" else 0.0
        if altman_zone is not None:
            available.add("altman_zone_danger")
        if conan_zone is not None:
            available.add("conan_zone_difficultes")

        # ---- Inscriptions et privilèges ----
        privilege_urssaf = director_data.get("privilege_urssaf_montant", 0) or 0
        privilege_tresor = director_data.get("privilege_tresor_montant", 0) or 0
        features["privilege_urssaf"] = 1.0 if privilege_urssaf > 0 else 0.0
        features["privilege_tresor"] = 1.0 if privilege_tresor > 0 else 0.0
        if director_data.get("privilege_urssaf_montant") is not None:
            available.add("privilege_urssaf")
        if director_data.get("privilege_tresor_montant") is not None:
            available.add("privilege_tresor")

        # ---- Changement dirigeant ----
        features["changement_dirigeant_recent"] = (
            1.0 if deal_data.get("changement_dirigeant_recent") else 0.0
        )
        if "changement_dirigeant_recent" in deal_data:
            available.add("changement_dirigeant_recent")

        # ---- Taux défaillance sectoriel ----
        taux_def_raw = sector_data.get("taux_defaillance_sectoriel")
        taux_def = taux_def_raw if taux_def_raw is not None else 0.02
        features["taux_defaillance_sectoriel"] = self._normalize(
            taux_def, mean=0.03, std=0.02
        )
        if taux_def_raw is not None:
            available.add("taux_defaillance_sectoriel")

        # ---- Calcul du score logistique ----
        logit = self.INTERCEPT
        for feature_name, weight in self.WEIGHTS.items():
            logit += weight * features.get(feature_name, 0.0)

        probability_18m = self._sigmoid(logit)

        # ---- Extrapolation à d'autres horizons ----
        # Simplification : proba à 6 mois ≈ proba_18m^3, proba à 12 mois ≈ proba_18m^1.5
        probability_6m = probability_18m ** 3
        probability_12m = probability_18m ** 1.5
        probability_24m = min(1.0, probability_18m ** 0.75)

        # ---- Niveau de risque ----
        if probability_18m < 0.05:
            risk_level = "faible"
        elif probability_18m < 0.15:
            risk_level = "modéré"
        elif probability_18m < 0.30:
            risk_level = "élevé"
        else:
            risk_level = "critique"

        # ---- Facteurs contributifs (top 5) ----
        contributions = []
        for feature_name, weight in self.WEIGHTS.items():
            feature_val = features.get(feature_name, 0.0)
            contribution = weight * feature_val
            if abs(contribution) > 0.01:
                contributions.append({
                    "feature": feature_name,
                    "contribution": round(contribution, 4),
                    "direction": "risque" if contribution > 0 else "protection",
                    "value": round(feature_val, 4),
                })
        contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)

        # ---- Confiance du modèle ----
        # Basée sur le nombre de features avec des données réelles
        non_null_count = len(available)
        confidence = min(1.0, non_null_count / len(self.WEIGHTS))

        return {
            "probability_6m": round(probability_6m, 4),
            "probability_12m": round(probability_12m, 4),
            "probability_18m": round(probability_18m, 4),
            "probability_24m": round(probability_24m, 4),
            "risk_level": risk_level,
            "contributing_factors": contributions[:5],
            "confidence": round(confidence, 2),
            "features_count": non_null_count,
            "model_version": "sf-logistic-v1",
        }

    async def compute(self, deal_data: dict) -> dict[str, Any]:
        """Interface async pour l'intégration dans le ScoringEngine."""
        financial = deal_data.get("financial_ratios", {})
        ratios = financial.get("ratios", {})
        if isinstance(ratios, str):
            import json
            try:
                ratios = json.loads(ratios)
            except (json.JSONDecodeError, TypeError):
                ratios = {}

        altman_zone = financial.get("altman_zone")
        conan_zone = financial.get("conan_zone")
        director_data = deal_data.get("director_analysis", {})
        sector_data = deal_data.get("sector_data", {})

        return self.compute_default_probability(
            ratios=ratios,
            altman_zone=altman_zone,
            conan_zone=conan_zone,
            director_data=director_data,
            sector_data=sector_data,
            deal_data=deal_data,
        )
