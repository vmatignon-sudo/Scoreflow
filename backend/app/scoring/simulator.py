from typing import Any


class IncidentSimulator:
    """Simulateur d'incident — calcul du bilan net selon mois de défaut."""

    async def simulate(
        self,
        deal_id: str,
        mois_defaut: int,
        delai_recuperation: int = 2,
        taux_frais: float = 0.12,
    ) -> dict[str, Any]:
        # TODO: Fetch real deal data from Supabase
        deal = await self._fetch_deal(deal_id)
        return self.compute_scenario(deal, mois_defaut, delai_recuperation, taux_frais)

    @staticmethod
    def compute_scenario(
        deal: dict,
        mois_defaut: int,
        delai_recuperation: int = 2,
        taux_frais: float = 0.12,
    ) -> dict[str, Any]:
        loyer_client = deal.get("loyer_mensuel_client", 0) or 0
        loyer_banque = deal.get("loyer_mensuel_banque", 0) or 0
        frais_dossier = deal.get("frais_dossier_banque", 0) or 0
        penalites = deal.get("penalites_remboursement_anticipe", 0) or 0
        depot_garantie = deal.get("depot_garantie", 0) or 0
        valeur_bien = deal.get("prix_achat_ht", 0) or deal.get("montant_finance", 0) or 0
        taux_depre = deal.get("taux_depreciation_annuel", 0.15)
        coeff_recup = deal.get("coefficient_recuperabilite", 0.70)
        duree_totale = deal.get("duree_mois", 48)

        # Revenus encaissés
        loyers_encaisses = mois_defaut * loyer_client

        # Coûts bancaires
        cout_bancaire = (mois_defaut + delai_recuperation) * loyer_banque + frais_dossier

        # Loyers perdus pendant le délai
        loyers_perdus = delai_recuperation * loyer_client

        # CRD banque au moment de la récupération
        mois_total_ecoulé = mois_defaut + delai_recuperation
        # Simplification : CRD linéaire
        crd_banque = max(0, loyer_banque * (duree_totale - mois_total_ecoulé))

        # Valeur du bien à la récupération
        annees = mois_total_ecoulé / 12
        valeur_bien_recup = valeur_bien * ((1 - taux_depre) ** annees)

        # Coût de récupération
        cout_recuperation = valeur_bien_recup * taux_frais

        # Valeur nette après récupération
        valeur_nette = valeur_bien_recup * coeff_recup - cout_recuperation

        # Bilan net
        bilan_net = (
            loyers_encaisses
            + valeur_nette
            + depot_garantie
            - cout_bancaire
            - crd_banque
            - penalites
        )

        # Taux de récupération
        exposition_totale = cout_bancaire + crd_banque + penalites
        taux_recuperation = (
            (loyers_encaisses + valeur_nette + depot_garantie) / exposition_totale
            if exposition_totale > 0
            else 0
        )

        # Seuil de rentabilité
        seuil_rentabilite = None
        for m in range(1, duree_totale + 1):
            annees_m = (m + delai_recuperation) / 12
            vb_m = valeur_bien * ((1 - taux_depre) ** annees_m)
            vn_m = vb_m * coeff_recup - vb_m * taux_frais
            rev_m = m * loyer_client
            cout_m = (m + delai_recuperation) * loyer_banque + frais_dossier
            crd_m = max(0, loyer_banque * (duree_totale - m - delai_recuperation))
            bilan_m = rev_m + vn_m + depot_garantie - cout_m - crd_m - penalites
            if bilan_m > 0:
                seuil_rentabilite = m
                break

        # Dépôt de garantie suggéré
        depot_suggere = max(0, -bilan_net) if bilan_net < 0 else 0

        return {
            "mois_defaut": mois_defaut,
            "delai_recuperation_mois": delai_recuperation,
            "loyers_encaisses": round(loyers_encaisses, 2),
            "loyers_perdus": round(loyers_perdus, 2),
            "cout_bancaire_total": round(cout_bancaire, 2),
            "crd_au_defaut": round(crd_banque, 2),
            "valeur_bien_recuperation": round(valeur_bien_recup, 2),
            "cout_recuperation": round(cout_recuperation, 2),
            "valeur_nette_bien": round(valeur_nette, 2),
            "bilan_net": round(bilan_net, 2),
            "taux_recuperation": round(taux_recuperation, 3),
            "seuil_rentabilite_mois": seuil_rentabilite,
            "depot_garantie_suggere": round(depot_suggere, 2),
            "penalites": round(penalites, 2),
        }

    async def _fetch_deal(self, deal_id: str) -> dict:
        # TODO: Fetch from Supabase
        return {"id": deal_id}
