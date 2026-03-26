from typing import Any


# Coefficients de récupérabilité par classe d'actif
RECUPERABILITY_COEFFICIENTS: dict[str, dict[str, float]] = {
    "vehicule_leger": {"sans_gps": 0.75, "avec_gps": 0.90},
    "vehicule_utilitaire": {"sans_gps": 0.70, "avec_gps": 0.85},
    "vehicule_luxe_collection": {"sans_gps": 0.80, "avec_gps": 0.95},
    "engin_tp": {"sans_gps": 0.55, "avec_gps": 0.70},
    "machine_industrielle": {"standard": 0.70, "specifique": 0.45},
    "materiel_agricole": {"sans_gps": 0.50, "avec_gps": 0.65},
    "vehicule_pl_transport": {"sans_gps": 0.65, "avec_gps": 0.80},
    "levage_manutention": {"default": 0.65},
    "echafaudage_coffrage": {"default": 0.45},
    "materiel_medical": {"default": 0.60},
    "informatique_bureautique": {"default": 0.40},
    "materiel_restauration": {"default": 0.65},
    "energie_environnement": {"panneaux_solaires": 0.85, "bornes_recharge": 0.55},
    "autre": {"default": 0.50},
}

# Taux de dépréciation annuel par classe
DEPRECIATION_RATES: dict[str, dict[str, float]] = {
    "vehicule_leger": {"an1_3": 0.175, "an4_plus": 0.08},
    "vehicule_utilitaire": {"an1_3": 0.18, "an4_plus": 0.10},
    "vehicule_luxe_collection": {"an1_3": 0.10, "an4_plus": 0.05},
    "engin_tp": {"an1_3": 0.10, "an4_plus": 0.08},
    "machine_industrielle": {"standard": 0.125, "specifique": 0.25},
    "materiel_agricole": {"default": 0.10},
    "vehicule_pl_transport": {"default": 0.15},
    "levage_manutention": {"default": 0.125},
    "echafaudage_coffrage": {"default": 0.065},
    "materiel_medical": {"default": 0.20},
    "informatique_bureautique": {"default": 0.30},
    "materiel_restauration": {"default": 0.15},
    "energie_environnement": {"panneaux_solaires": 0.04, "bornes_recharge": 0.125},
    "autre": {"default": 0.15},
}

BONUS_CONTRAT_RECUPERATEUR = 0.05


class AssetScorer:
    """Niveau 4 — Bien financé. Score /20."""

    @staticmethod
    def get_recuperability_coefficient(
        asset_class: str,
        traceur_gps: bool = False,
        contrat_recuperation: bool = False,
        asset_subclass: str | None = None,
    ) -> float:
        coeffs = RECUPERABILITY_COEFFICIENTS.get(asset_class, {"default": 0.50})

        if asset_class == "machine_industrielle":
            key = "specifique" if asset_subclass == "specifique" else "standard"
            coeff = coeffs.get(key, 0.50)
        elif asset_class == "energie_environnement":
            key = asset_subclass if asset_subclass in coeffs else "panneaux_solaires"
            coeff = coeffs.get(key, 0.55)
        elif traceur_gps and "avec_gps" in coeffs:
            coeff = coeffs["avec_gps"]
        elif "sans_gps" in coeffs:
            coeff = coeffs["sans_gps"]
        else:
            coeff = coeffs.get("default", 0.50)

        if contrat_recuperation:
            coeff += BONUS_CONTRAT_RECUPERATEUR

        return min(coeff, 1.0)

    @staticmethod
    def get_depreciation_rate(
        asset_class: str,
        age_years: int = 0,
        asset_subclass: str | None = None,
    ) -> float:
        rates = DEPRECIATION_RATES.get(asset_class, {"default": 0.15})

        if asset_class in ("vehicule_leger", "vehicule_utilitaire", "vehicule_luxe_collection"):
            return rates["an1_3"] if age_years < 3 else rates["an4_plus"]
        elif asset_class == "machine_industrielle":
            key = "specifique" if asset_subclass == "specifique" else "standard"
            return rates.get(key, 0.15)
        elif asset_class == "energie_environnement":
            key = asset_subclass if asset_subclass in rates else "panneaux_solaires"
            return rates.get(key, 0.10)
        else:
            return rates.get("default", 0.15)

    @staticmethod
    def compute_depreciation_curve(
        valeur_initiale: float,
        taux_annuel: float,
        duree_mois: int,
    ) -> list[dict]:
        curve = []
        for mois in range(duree_mois + 1):
            annees = mois / 12
            valeur = valeur_initiale * ((1 - taux_annuel) ** annees)
            curve.append({
                "mois": mois,
                "valeur": round(valeur, 2),
                "depreciation_pct": round((1 - valeur / valeur_initiale) * 100, 1),
            })
        return curve

    @staticmethod
    def is_esg_eligible(asset_class: str, asset_subclass: str | None = None) -> bool:
        if asset_class == "energie_environnement":
            return True
        if asset_subclass and "electrique" in asset_subclass.lower():
            return True
        return False

    async def compute(self, deal_data: dict) -> dict[str, Any]:
        asset = deal_data.get("asset", {})
        if not asset:
            return {"score": 10.0, "details": "Aucune donnée bien financé"}

        asset_class = asset.get("asset_class", "autre")
        traceur_gps = asset.get("traceur_gps", False)
        contrat_recup = asset.get("contrat_recuperation", False)
        subclass = asset.get("asset_subclass")
        prix_achat = asset.get("prix_achat_ht", 0) or 0
        montant_finance = deal_data.get("montant_finance", 0) or 0
        duree_mois = deal_data.get("duree_mois", 36)
        age_years = asset.get("age_mois_au_financement", 0) / 12 if asset.get("age_mois_au_financement") else 0

        # Coefficient de récupérabilité
        coeff = self.get_recuperability_coefficient(
            asset_class, traceur_gps, contrat_recup, subclass
        )

        # Taux de dépréciation
        taux_depre = self.get_depreciation_rate(asset_class, int(age_years), subclass)

        # Courbe de dépréciation
        valeur_initiale = prix_achat or montant_finance
        curve = self.compute_depreciation_curve(valeur_initiale, taux_depre, duree_mois)

        # Valeur à mi-parcours et fin
        valeur_mi = curve[duree_mois // 2]["valeur"] if len(curve) > duree_mois // 2 else 0
        valeur_fin = curve[-1]["valeur"] if curve else 0

        # LTV (Loan-to-Value) ratio
        ltv_initial = montant_finance / valeur_initiale if valeur_initiale > 0 else 1.0
        ltv_fin = montant_finance / valeur_fin if valeur_fin > 0 else float("inf")

        # Score calculation
        score = 10.0

        # Coefficient récupérabilité scoring
        if coeff >= 0.85:
            score += 3.0
        elif coeff >= 0.70:
            score += 1.5
        elif coeff >= 0.55:
            score += 0
        else:
            score -= 2.0

        # LTV scoring
        if ltv_initial <= 0.7:
            score += 2.0
        elif ltv_initial <= 0.85:
            score += 1.0
        elif ltv_initial <= 1.0:
            score += 0
        else:
            score -= 2.0

        # Depreciation scoring
        if taux_depre <= 0.08:
            score += 2.0
        elif taux_depre <= 0.15:
            score += 1.0
        elif taux_depre <= 0.25:
            score -= 1.0
        else:
            score -= 3.0

        # ESG bonus
        esg_bonus = 0
        if self.is_esg_eligible(asset_class, subclass):
            esg_bonus = 1.5
            score += esg_bonus

        # Traceur GPS bonus already in coeff, but also score impact
        if traceur_gps:
            score += 0.5

        score = max(0, min(20, round(score, 2)))

        return {
            "score": score,
            "coefficient_recuperabilite": coeff,
            "taux_depreciation": taux_depre,
            "ltv_initial": round(ltv_initial, 3),
            "valeur_fin_contrat": valeur_fin,
            "courbe_depreciation": curve,
            "esg_bonus": esg_bonus,
            "esg_eligible": self.is_esg_eligible(asset_class, subclass),
        }
