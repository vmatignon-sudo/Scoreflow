from typing import Any


class DirectorScorer:
    """Niveau 5 — Dirigeant et inscriptions. Score /20."""

    # Pondération interne
    WEIGHTS = {
        "historique_judiciaire": 0.35,
        "inscriptions_privileges": 0.25,
        "anciennete_sectorielle": 0.20,
        "changement_recent": 0.10,
        "depenses_somptuaires": 0.10,
    }

    SOMPTUAIRE_KEYWORDS = [
        "ferrari", "lamborghini", "porsche finance", "aston martin",
        "bentley", "rolls royce", "maserati", "bugatti",
        "cartier", "rolex", "hermes", "hermès",
        "louis vuitton", "chanel", "van cleef",
        "private jet", "first class", "yacht",
        "casino", "golf club",
    ]

    @staticmethod
    def score_historique_judiciaire(director_data: dict) -> float:
        nb_mandats = director_data.get("nb_mandats_total", 0)
        nb_liquidees = director_data.get("nb_societes_liquidees", 0)
        nb_proc = director_data.get("nb_procedures_collectives", 0)
        taux_reussite = director_data.get("taux_reussite", 1.0)

        score = 10.0

        # Liquidations
        if nb_liquidees == 0:
            score += 4.0
        elif nb_liquidees == 1:
            score += 0
        elif nb_liquidees == 2:
            score -= 4.0
        else:
            score -= 8.0  # Probable VETO

        # Procédures collectives en cours
        score -= nb_proc * 3.0

        # Taux de réussite
        if nb_mandats > 2:
            if taux_reussite > 0.8:
                score += 3.0
            elif taux_reussite > 0.6:
                score += 1.0
            elif taux_reussite < 0.4:
                score -= 3.0

        return max(0, min(20, score))

    @staticmethod
    def score_inscriptions(director_data: dict, org_settings: dict) -> float:
        score = 10.0

        tresor = director_data.get("privilege_tresor_montant", 0) or 0
        urssaf = director_data.get("privilege_urssaf_montant", 0) or 0
        seuil_tresor = org_settings.get("seuil_privilege_tresor_euros", 1)
        seuil_urssaf = org_settings.get("seuil_privilege_urssaf_euros", 1)

        # Trésor
        if tresor >= seuil_tresor:
            if tresor > 50000:
                score -= 5.0
            elif tresor > 15000:
                score -= 3.0
            else:
                score -= 1.5

        # URSSAF
        if urssaf >= seuil_urssaf:
            if urssaf > 30000:
                score -= 4.0
            elif urssaf > 10000:
                score -= 2.5
            else:
                score -= 1.0

        # Protêts
        inscriptions = director_data.get("inscriptions_privileges", [])
        protets = [i for i in inscriptions if i.get("type") == "protet"]
        score -= len(protets) * 2.0

        return max(0, min(20, score))

    @staticmethod
    def score_anciennete(director_data: dict) -> float:
        jours = director_data.get("jours_depuis_nomination", 0)
        annees = jours / 365.0

        if annees > 10:
            return 16.0
        elif annees > 5:
            return 14.0
        elif annees > 2:
            return 12.0
        elif annees > 1:
            return 10.0
        else:
            return 6.0

    @staticmethod
    def score_changement_recent(director_data: dict, org_settings: dict) -> float:
        jours = director_data.get("jours_depuis_nomination", 999)
        seuil = org_settings.get("seuil_changement_dirigeant_jours", 180)

        if jours < seuil:
            return 6.0  # Malus
        return 14.0

    def score_somptuaire(self, director_data: dict, org_settings: dict) -> float:
        if not org_settings.get("activer_detection_somptuaire", True):
            return 14.0

        signaux = director_data.get("signaux_depenses_somptuaires", [])
        if not signaux:
            return 14.0

        score = 14.0
        seuil = org_settings.get("seuil_depense_somptuaire", 500)

        for signal in signaux:
            montant = signal.get("montant", 0)
            if montant > seuil:
                score -= 2.0

        return max(0, min(20, score))

    def check_veto(self, director_data: dict, deal_data: dict, org_settings: dict) -> str | None:
        """Vérifie les conditions de VETO indépendantes du score."""
        nb_liquidees = director_data.get("nb_societes_liquidees", 0)
        seuil_liq = org_settings.get("nb_liquidations_veto", 2)

        if nb_liquidees >= seuil_liq:
            return f"VETO: {nb_liquidees} liquidations (seuil: {seuil_liq})"

        indicateur_bdf = deal_data.get("indicateur_dirigeant_bdf", "")
        if indicateur_bdf == "060":
            return "VETO: Indicateur BDF dirigeant = 060"

        # Interdiction de gérer
        if director_data.get("interdiction_gerer"):
            return "VETO: Interdiction de gérer en cours"

        return None

    async def compute(self, deal_data: dict) -> dict[str, Any]:
        director_data = deal_data.get("director_analysis", {})
        org_settings = deal_data.get("org_settings", {})

        if not director_data:
            return {"score": 10.0, "details": "Aucune donnée dirigeant"}

        # Check VETO first
        veto = self.check_veto(director_data, deal_data, org_settings)
        if veto:
            return {"score": 0, "veto": True, "veto_raison": veto}

        # Sub-scores
        s_hist = self.score_historique_judiciaire(director_data)
        s_insc = self.score_inscriptions(director_data, org_settings)
        s_anc = self.score_anciennete(director_data)
        s_chg = self.score_changement_recent(director_data, org_settings)
        s_somp = self.score_somptuaire(director_data, org_settings)

        # Weighted score
        score = (
            s_hist * self.WEIGHTS["historique_judiciaire"]
            + s_insc * self.WEIGHTS["inscriptions_privileges"]
            + s_anc * self.WEIGHTS["anciennete_sectorielle"]
            + s_chg * self.WEIGHTS["changement_recent"]
            + s_somp * self.WEIGHTS["depenses_somptuaires"]
        )

        # Indicateur BDF ajustement
        indicateur = deal_data.get("indicateur_dirigeant_bdf", "")
        if indicateur == "050":
            score -= 2.0

        score = max(0, min(20, round(score, 2)))

        return {
            "score": score,
            "sub_scores": {
                "historique_judiciaire": round(s_hist, 2),
                "inscriptions_privileges": round(s_insc, 2),
                "anciennete_sectorielle": round(s_anc, 2),
                "changement_recent": round(s_chg, 2),
                "depenses_somptuaires": round(s_somp, 2),
            },
            "signaux_positifs": director_data.get("signaux_positifs", []),
            "signaux_negatifs": director_data.get("signaux_negatifs", []),
        }
