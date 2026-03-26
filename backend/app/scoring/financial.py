from __future__ import annotations

from typing import Any


class FinancialScorer:
    """Niveau 3 — Analyse financière. Score /20."""

    # Altman Z' (PME non cotées)
    @staticmethod
    def altman_z_prime(
        fr: float, rr: float, ebit: float, fp: float,
        df: float, ca: float, at: float,
    ) -> tuple[float, str]:
        if at == 0:
            return 0.0, "danger"
        z = (
            0.717 * (fr / at)
            + 0.847 * (rr / at)
            + 3.107 * (ebit / at)
            + 0.420 * (fp / max(df, 1))
            + 0.998 * (ca / at)
        )
        if z > 2.9:
            zone = "sain"
        elif z > 1.23:
            zone = "gris"
        else:
            zone = "danger"
        return round(z, 3), zone

    # Conan & Holder (PME françaises)
    @staticmethod
    def conan_holder(
        ebe: float, dettes: float, cp: float, at: float,
        dispo: float, ff: float, ca: float,
        charges_pers: float, va: float,
    ) -> tuple[float, str]:
        if dettes == 0 or at == 0 or ca == 0 or va == 0:
            return 0.0, "difficultes"
        z = (
            0.24 * (ebe / dettes)
            + 0.22 * (cp / at)
            + 0.16 * (dispo / at)
            - 0.87 * (ff / ca)
            - 0.10 * (charges_pers / va)
        )
        if z > 0.09:
            zone = "sain"
        elif z > 0.04:
            zone = "attention"
        else:
            zone = "difficultes"
        return round(z, 3), zone

    @staticmethod
    def compute_ratios(data: dict) -> dict[str, Any]:
        """Calcul de tous les ratios financiers depuis les données comptables."""
        ca = data.get("ca", 0) or 0
        ebitda = data.get("ebitda", 0) or 0
        ebit = data.get("ebit", 0) or 0
        resultat_net = data.get("resultat_net", 0) or 0
        caf = data.get("caf", 0) or 0
        actif_total = data.get("actif_total", 0) or 0
        actif_circulant = data.get("actif_circulant", 0) or 0
        stocks = data.get("stocks", 0) or 0
        creances = data.get("creances_clients", 0) or 0
        passif_total = data.get("passif_total", 0) or 0
        passif_circulant = data.get("passif_circulant", 0) or 0
        dettes_fin = data.get("dettes_financieres", 0) or 0
        fp = data.get("fonds_propres", 0) or 0
        cap_perm = data.get("capitaux_permanents", 0) or 0
        tresorerie = data.get("tresorerie", 0) or 0
        charges_pers = data.get("charges_personnel", 0) or 0
        va = data.get("valeur_ajoutee", 0) or 0
        ff = data.get("frais_financiers", 0) or 0

        def safe_div(a, b):
            return round(a / b, 4) if b != 0 else None

        frng = cap_perm - (actif_total - actif_circulant)
        bfr = actif_circulant - stocks - passif_circulant
        tn = frng - bfr

        ratios = {
            # Liquidité
            "liquidite_generale": safe_div(actif_circulant, passif_circulant),
            "liquidite_reduite": safe_div(actif_circulant - stocks, passif_circulant),
            "liquidite_immediate": safe_div(tresorerie, passif_circulant),
            "bfr": bfr,
            "frng": frng,
            "tresorerie_nette": tn,
            "jours_tresorerie": safe_div(tresorerie * 365, ca) if ca else None,
            # Capacité
            "caf": caf,
            "dette_sur_caf": safe_div(dettes_fin, caf),
            # DSCR = CAF / service annuel de la dette (remboursement annuel)
            "dscr": safe_div(caf, dettes_fin) if dettes_fin else None,
            "couverture_ff": safe_div(ebitda, ff),
            # Structure
            "autonomie_financiere": safe_div(fp, passif_total),
            "endettement": safe_div(dettes_fin, fp),
            "gearing": safe_div(dettes_fin - tresorerie, fp),
            "levier": safe_div(passif_total, fp),
            # Rentabilité
            "marge_ebitda": safe_div(ebitda, ca),
            "marge_ebit": safe_div(ebit, ca),
            "marge_nette": safe_div(resultat_net, ca),
            "roe": safe_div(resultat_net, fp),
            "roa": safe_div(resultat_net, actif_total),
            "roce": safe_div(ebit, cap_perm) if cap_perm else None,
            # Activité
            "dso": safe_div(creances * 365, ca),
            "dpo": safe_div(passif_circulant * 365, ca),
            "rotation_actif": safe_div(ca, actif_total),
        }
        # CCC (Cash Conversion Cycle) = DSO + DIO - DPO
        dio = safe_div(stocks * 365, ca)
        if ratios["dso"] is not None and dio is not None and ratios["dpo"] is not None:
            ratios["ccc"] = round(ratios["dso"] + dio - ratios["dpo"], 1)
        else:
            ratios["ccc"] = None
        return ratios

    def score_from_ratios(self, ratios: dict, duree_mois: int = 36) -> float:
        """Convertit les ratios en score /20 avec pondération selon durée."""
        score = 10.0  # Base

        # Pondération dynamique selon durée
        if duree_mois <= 24:
            # Court terme : liquidité et DSCR
            w = {"liquidite": 0.30, "capacite": 0.30, "structure": 0.15, "rentabilite": 0.15, "activite": 0.10}
        elif duree_mois <= 48:
            # Moyen terme : CAF/dette, autonomie
            w = {"liquidite": 0.15, "capacite": 0.25, "structure": 0.25, "rentabilite": 0.20, "activite": 0.15}
        else:
            # Long terme : structure, ROCE, tendance
            w = {"liquidite": 0.10, "capacite": 0.20, "structure": 0.30, "rentabilite": 0.25, "activite": 0.15}

        # Liquidité sub-score
        lg = ratios.get("liquidite_generale")
        if lg is not None:
            if lg > 2.0:
                score += 4.0 * w["liquidite"]
            elif lg > 1.5:
                score += 2.0 * w["liquidite"]
            elif lg > 1.0:
                score += 0
            else:
                score -= 4.0 * w["liquidite"]

        # Capacité sub-score
        dcaf = ratios.get("dette_sur_caf")
        if dcaf is not None:
            if dcaf < 2:
                score += 4.0 * w["capacite"]
            elif dcaf < 4:
                score += 2.0 * w["capacite"]
            elif dcaf < 6:
                score += 0
            else:
                score -= 4.0 * w["capacite"]

        # Structure sub-score
        auto_fin = ratios.get("autonomie_financiere")
        if auto_fin is not None:
            if auto_fin > 0.4:
                score += 4.0 * w["structure"]
            elif auto_fin > 0.25:
                score += 2.0 * w["structure"]
            elif auto_fin > 0.15:
                score += 0
            else:
                score -= 4.0 * w["structure"]

        # Rentabilité sub-score
        mn = ratios.get("marge_nette")
        if mn is not None:
            if mn > 0.08:
                score += 4.0 * w["rentabilite"]
            elif mn > 0.03:
                score += 2.0 * w["rentabilite"]
            elif mn > 0:
                score += 0
            else:
                score -= 4.0 * w["rentabilite"]

        # Activité sub-score
        dso = ratios.get("dso")
        if dso is not None:
            if dso < 30:
                score += 4.0 * w["activite"]
            elif dso < 60:
                score += 2.0 * w["activite"]
            elif dso < 90:
                score += 0
            else:
                score -= 4.0 * w["activite"]

        return max(0, min(20, round(score, 2)))

    def score_cotation_bdf(self, cote_credit: str | None) -> float:
        """Ajustement selon cotation BDF."""
        if not cote_credit:
            return 0
        adjustments = {
            "P": -99,  # VETO
            "8": -4, "7": -3,
            "6": -2, "5-": -1, "5+": -1,
            "4+": 0, "4": 0,
            "3+": 0.5, "3": 1,
            "2": 1, "1+": 1,
        }
        return adjustments.get(cote_credit, 0)

    async def compute(self, deal_data: dict) -> dict[str, Any]:
        financial_data = deal_data.get("financial_ratios", {})
        if not financial_data:
            return {"score": 10.0, "details": "Aucune donnée financière disponible"}

        ratios = self.compute_ratios(financial_data)
        duree = deal_data.get("duree_mois", 36)
        score = self.score_from_ratios(ratios, duree)

        # Altman Z'
        altman_z, altman_zone = self.altman_z_prime(
            fr=ratios.get("frng", 0) or 0,
            rr=financial_data.get("resultat_net", 0) or 0,
            ebit=financial_data.get("ebit", 0) or 0,
            fp=financial_data.get("fonds_propres", 0) or 0,
            df=financial_data.get("dettes_financieres", 0) or 0,
            ca=financial_data.get("ca", 0) or 0,
            at=financial_data.get("actif_total", 0) or 0,
        )

        # Conan & Holder
        conan_z, conan_zone = self.conan_holder(
            ebe=financial_data.get("ebitda", 0) or 0,
            dettes=financial_data.get("dettes_financieres", 0) or 0,
            cp=financial_data.get("fonds_propres", 0) or 0,
            at=financial_data.get("actif_total", 0) or 0,
            dispo=financial_data.get("tresorerie", 0) or 0,
            ff=financial_data.get("frais_financiers", 0) or 0,
            ca=financial_data.get("ca", 0) or 0,
            charges_pers=financial_data.get("charges_personnel", 0) or 0,
            va=financial_data.get("valeur_ajoutee", 0) or 0,
        )

        # BDF adjustment
        bdf_adj = self.score_cotation_bdf(deal_data.get("cotation_bdf_credit"))
        if bdf_adj == -99:
            return {"score": 0, "veto": True, "veto_raison": "Cotation BDF = P"}

        score = max(0, min(20, score + bdf_adj))

        return {
            "score": score,
            "ratios": ratios,
            "altman": {"z": altman_z, "zone": altman_zone},
            "conan_holder": {"z": conan_z, "zone": conan_zone},
            "bdf_adjustment": bdf_adj,
        }
