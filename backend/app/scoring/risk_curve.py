from typing import Any


class RiskCurveCalculator:
    """Courbe de Risque Résiduel Net (RRN)."""

    async def compute(self, deal_id: str) -> dict[str, Any]:
        deal = await self._fetch_deal(deal_id)
        return self.compute_curve(deal)

    @staticmethod
    def compute_curve(deal: dict) -> dict[str, Any]:
        loyer_client = deal.get("loyer_mensuel_client", 0) or 0
        loyer_banque = deal.get("loyer_mensuel_banque", 0) or 0
        apport = deal.get("apport_initial", 0) or 0
        depot = deal.get("depot_garantie", 0) or 0
        valeur_initiale = deal.get("prix_achat_ht", 0) or deal.get("montant_finance", 0) or 0
        taux_depre = deal.get("taux_depreciation_annuel", 0.15)
        coeff_recup = deal.get("coefficient_recuperabilite", 0.70)
        duree = deal.get("duree_mois", 48)
        frais_recup_fixes = deal.get("frais_recuperation_fixes", 500)

        # CRD banque = tableau d'amortissement simplifié (linéaire)
        montant_finance = deal.get("montant_finance", 0) or 0

        curve_data = []
        mois_couverture_materiel = None
        mois_couverture_totale = None
        exposition_max = 0

        for m in range(duree + 1):
            # CRD banque (amortissement linéaire)
            crd_banque = max(0, montant_finance * (1 - m / duree)) if duree > 0 else 0

            # Valeur récupérable
            annees = m / 12
            valeur_bien = valeur_initiale * ((1 - taux_depre) ** annees)
            valeur_recuperable = valeur_bien * coeff_recup - frais_recup_fixes

            # Loyers nets cumulés
            loyers_nets = m * (loyer_client - loyer_banque) + apport + depot

            # RRN = CRD - valeur récupérable - loyers nets
            rrn = crd_banque - valeur_recuperable - loyers_nets

            # Couverture matériel : valeur_recuperable > crd_banque
            if mois_couverture_materiel is None and valeur_recuperable >= crd_banque:
                mois_couverture_materiel = m

            # Couverture totale : RRN < 0
            if mois_couverture_totale is None and rrn < 0:
                mois_couverture_totale = m

            exposition_max = max(exposition_max, rrn)

            curve_data.append({
                "mois": m,
                "crd_banque": round(crd_banque, 2),
                "valeur_bien": round(valeur_bien, 2),
                "valeur_recuperable_nette": round(valeur_recuperable, 2),
                "loyers_nets_cumules": round(loyers_nets, 2),
                "rrn": round(rrn, 2),
                "couvert": rrn < 0,
            })

        return {
            "curve_data": curve_data,
            "mois_couverture_materiel": mois_couverture_materiel,
            "mois_couverture_totale": mois_couverture_totale,
            "exposition_max": round(exposition_max, 2),
            "message_couverture": (
                f"À partir du mois {mois_couverture_totale}, vous ne pouvez plus perdre d'argent."
                if mois_couverture_totale
                else "Le deal ne passe jamais en zone de couverture totale sur la durée."
            ),
        }

    async def _fetch_deal(self, deal_id: str) -> dict:
        # TODO: Fetch from Supabase
        return {"id": deal_id}
