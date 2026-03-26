"""Tests unitaires du moteur de scoring."""
import pytest
from app.scoring.financial import FinancialScorer
from app.scoring.asset import AssetScorer
from app.scoring.director import DirectorScorer
from app.scoring.macro_sector import MacroSectorScorer
from app.scoring.verdicts import VerdictEngine
from app.scoring.simulator import IncidentSimulator
from app.scoring.risk_curve import RiskCurveCalculator


class TestFinancialScorer:
    def test_altman_z_sain(self):
        z, zone = FinancialScorer.altman_z_prime(
            fr=100000, rr=50000, ebit=80000,
            fp=200000, df=100000, ca=500000, at=400000,
        )
        assert zone == "sain"
        assert z > 2.9

    def test_altman_z_danger(self):
        z, zone = FinancialScorer.altman_z_prime(
            fr=-50000, rr=-20000, ebit=-10000,
            fp=50000, df=200000, ca=100000, at=300000,
        )
        assert zone == "danger"
        assert z < 1.23

    def test_altman_z_zero_actif(self):
        z, zone = FinancialScorer.altman_z_prime(
            fr=0, rr=0, ebit=0, fp=0, df=0, ca=0, at=0,
        )
        assert z == 0.0
        assert zone == "danger"

    def test_conan_holder_sain(self):
        z, zone = FinancialScorer.conan_holder(
            ebe=100000, dettes=200000, cp=300000,
            at=500000, dispo=50000, ff=10000,
            ca=800000, charges_pers=200000, va=400000,
        )
        assert zone == "sain"
        assert z > 0.09

    def test_conan_holder_difficultes(self):
        z, zone = FinancialScorer.conan_holder(
            ebe=10000, dettes=300000, cp=50000,
            at=400000, dispo=5000, ff=40000,
            ca=200000, charges_pers=180000, va=200000,
        )
        assert zone == "difficultes"

    def test_compute_ratios(self):
        data = {
            "ca": 1000000, "ebitda": 100000, "ebit": 80000,
            "resultat_net": 50000, "caf": 90000,
            "actif_total": 800000, "actif_circulant": 400000,
            "stocks": 50000, "creances_clients": 200000,
            "passif_total": 800000, "passif_circulant": 300000,
            "dettes_financieres": 150000, "fonds_propres": 250000,
            "capitaux_permanents": 500000, "tresorerie": 60000,
            "charges_personnel": 400000, "valeur_ajoutee": 500000,
            "frais_financiers": 20000,
        }
        ratios = FinancialScorer.compute_ratios(data)
        assert ratios["liquidite_generale"] is not None
        assert ratios["liquidite_generale"] > 1.0
        assert ratios["marge_nette"] == 0.05
        assert ratios["autonomie_financiere"] is not None

    def test_score_from_ratios_range(self):
        scorer = FinancialScorer()
        ratios = {
            "liquidite_generale": 2.5,
            "dette_sur_caf": 1.5,
            "autonomie_financiere": 0.5,
            "marge_nette": 0.10,
            "dso": 25,
        }
        score = scorer.score_from_ratios(ratios, duree_mois=36)
        assert 0 <= score <= 20

    def test_cotation_bdf_veto(self):
        scorer = FinancialScorer()
        adj = scorer.score_cotation_bdf("P")
        assert adj == -99

    def test_cotation_bdf_neutral(self):
        scorer = FinancialScorer()
        adj = scorer.score_cotation_bdf("4+")
        assert adj == 0


class TestAssetScorer:
    def test_recuperability_vehicule_gps(self):
        coeff = AssetScorer.get_recuperability_coefficient(
            "vehicule_leger", traceur_gps=True,
        )
        assert coeff == 0.90

    def test_recuperability_vehicule_no_gps(self):
        coeff = AssetScorer.get_recuperability_coefficient(
            "vehicule_leger", traceur_gps=False,
        )
        assert coeff == 0.75

    def test_recuperability_with_contrat(self):
        coeff = AssetScorer.get_recuperability_coefficient(
            "vehicule_leger", traceur_gps=True, contrat_recuperation=True,
        )
        assert abs(coeff - 0.95) < 1e-9

    def test_recuperability_informatique(self):
        coeff = AssetScorer.get_recuperability_coefficient(
            "informatique_bureautique",
        )
        assert coeff == 0.40

    def test_depreciation_vehicule_jeune(self):
        rate = AssetScorer.get_depreciation_rate("vehicule_leger", age_years=1)
        assert rate == 0.175

    def test_depreciation_vehicule_ancien(self):
        rate = AssetScorer.get_depreciation_rate("vehicule_leger", age_years=5)
        assert rate == 0.08

    def test_depreciation_curve(self):
        curve = AssetScorer.compute_depreciation_curve(100000, 0.15, 48)
        assert len(curve) == 49  # 0 to 48
        assert curve[0]["valeur"] == 100000
        assert curve[-1]["valeur"] < 100000
        assert curve[-1]["depreciation_pct"] > 0

    def test_esg_eligible(self):
        assert AssetScorer.is_esg_eligible("energie_environnement")
        assert not AssetScorer.is_esg_eligible("vehicule_leger")

    def test_anti_double_fingerprint(self):
        # Fingerprints should be consistent
        coeff1 = AssetScorer.get_recuperability_coefficient("engin_tp", traceur_gps=True)
        coeff2 = AssetScorer.get_recuperability_coefficient("engin_tp", traceur_gps=True)
        assert coeff1 == coeff2


class TestDirectorScorer:
    def test_historique_clean(self):
        score = DirectorScorer.score_historique_judiciaire({
            "nb_mandats_total": 5,
            "nb_societes_liquidees": 0,
            "nb_procedures_collectives": 0,
            "taux_reussite": 1.0,
        })
        assert score >= 15

    def test_historique_1_liquidation(self):
        score = DirectorScorer.score_historique_judiciaire({
            "nb_mandats_total": 4,
            "nb_societes_liquidees": 1,
            "nb_procedures_collectives": 0,
            "taux_reussite": 0.75,
        })
        assert 8 <= score <= 14

    def test_historique_grave(self):
        score = DirectorScorer.score_historique_judiciaire({
            "nb_mandats_total": 3,
            "nb_societes_liquidees": 3,
            "nb_procedures_collectives": 1,
            "taux_reussite": 0.0,
        })
        assert score <= 5

    def test_veto_liquidations(self):
        scorer = DirectorScorer()
        veto = scorer.check_veto(
            {"nb_societes_liquidees": 3},
            {},
            {"nb_liquidations_veto": 2},
        )
        assert veto is not None
        assert "liquidation" in veto.lower()

    def test_veto_bdf_060(self):
        scorer = DirectorScorer()
        veto = scorer.check_veto(
            {},
            {"indicateur_dirigeant_bdf": "060"},
            {},
        )
        assert veto is not None
        assert "060" in veto

    def test_no_veto(self):
        scorer = DirectorScorer()
        veto = scorer.check_veto(
            {"nb_societes_liquidees": 0},
            {"indicateur_dirigeant_bdf": "000"},
            {"nb_liquidations_veto": 2},
        )
        assert veto is None

    def test_anciennete_longue(self):
        score = DirectorScorer.score_anciennete({"jours_depuis_nomination": 4000})
        assert score >= 14

    def test_changement_recent(self):
        score = DirectorScorer.score_changement_recent(
            {"jours_depuis_nomination": 45},
            {"seuil_changement_dirigeant_jours": 180},
        )
        assert score < 10


class TestMacroSectorScorer:
    def test_macro_bon(self):
        score, phase = MacroSectorScorer.score_macro({
            "pib_croissance": 2.5,
            "inflation": 1.5,
            "taux_bce": 2.0,
            "pmi_manufacturier": 56,
            "indice_confiance_entreprises": 115,
        })
        assert phase == "bon"
        assert score >= 14

    def test_macro_mauvais(self):
        score, phase = MacroSectorScorer.score_macro({
            "pib_croissance": -2.0,
            "inflation": 6.0,
            "taux_bce": 6.0,
            "pmi_manufacturier": 42,
            "indice_confiance_entreprises": 80,
        })
        assert phase == "mauvais"
        assert score < 8

    def test_sector_bon(self):
        score, phase = MacroSectorScorer.score_sector({
            "taux_defaillance_sectoriel": 0.005,
            "dso_moyen_sectoriel": 25,
            "tendance_sectoriel": "croissance",
        })
        assert phase == "bon"

    def test_cross_matrix(self):
        from app.scoring.macro_sector import CROSS_MATRIX
        assert CROSS_MATRIX[("bon", "bon")]["label"] == "Excellent"
        assert CROSS_MATRIX[("mauvais", "mauvais")]["label"] == "Risqué"


class TestVerdictEngine:
    def setup_method(self):
        self.engine = VerdictEngine()
        self.settings = {"seuil_go": 14, "seuil_go_conditionnel": 10, "nb_liquidations_veto": 2}

    def test_verdict_go(self):
        result = self.engine.determine(15.0, 12.0, {}, self.settings)
        assert result["verdict"] == "go"

    def test_verdict_conditionnel(self):
        result = self.engine.determine(12.0, 12.0, {}, self.settings)
        assert result["verdict"] == "go_conditionnel"

    def test_verdict_no_go(self):
        result = self.engine.determine(8.0, 8.0, {}, self.settings)
        assert result["verdict"] == "no_go"

    def test_verdict_veto_dirigeant(self):
        result = self.engine.determine(16.0, 3.0, {}, self.settings)
        assert result["verdict"] == "veto"

    def test_verdict_veto_bdf_p(self):
        result = self.engine.determine(16.0, 12.0, {"cotation_bdf_credit": "P"}, self.settings)
        assert result["verdict"] == "veto"

    def test_mention_excellent(self):
        m = VerdictEngine.get_mention(18.0)
        assert m["mention"] == "Excellent"

    def test_mention_critique(self):
        m = VerdictEngine.get_mention(2.0)
        assert m["mention"] == "Critique"


class TestSimulator:
    def test_scenario_bilan_positif(self):
        deal = {
            "loyer_mensuel_client": 2100,
            "loyer_mensuel_banque": 1680,
            "frais_dossier_banque": 350,
            "penalites_remboursement_anticipe": 1500,
            "depot_garantie": 2100,
            "prix_achat_ht": 92000,
            "montant_finance": 85000,
            "taux_depreciation_annuel": 0.10,
            "coefficient_recuperabilite": 0.82,
            "duree_mois": 48,
        }
        result = IncidentSimulator.compute_scenario(deal, mois_defaut=36, delai_recuperation=2)
        assert result["loyers_encaisses"] > 0
        assert "bilan_net" in result

    def test_scenario_early_default(self):
        deal = {
            "loyer_mensuel_client": 2100,
            "loyer_mensuel_banque": 1680,
            "frais_dossier_banque": 350,
            "penalites_remboursement_anticipe": 1500,
            "depot_garantie": 2100,
            "prix_achat_ht": 92000,
            "montant_finance": 85000,
            "taux_depreciation_annuel": 0.10,
            "coefficient_recuperabilite": 0.82,
            "duree_mois": 48,
        }
        result = IncidentSimulator.compute_scenario(deal, mois_defaut=3, delai_recuperation=6)
        assert result["bilan_net"] < 0  # Early default should be negative


class TestRiskCurve:
    def test_curve_basic(self):
        deal = {
            "montant_finance": 85000,
            "loyer_mensuel_client": 2100,
            "loyer_mensuel_banque": 1680,
            "apport_initial": 8500,
            "depot_garantie": 2100,
            "prix_achat_ht": 92000,
            "taux_depreciation_annuel": 0.10,
            "coefficient_recuperabilite": 0.82,
            "duree_mois": 48,
        }
        result = RiskCurveCalculator.compute_curve(deal)
        assert len(result["curve_data"]) == 49  # 0 to 48
        assert result["curve_data"][0]["mois"] == 0
        assert result["curve_data"][-1]["mois"] == 48
        assert "mois_couverture_totale" in result
        assert "exposition_max" in result

    def test_curve_last_point_covered(self):
        deal = {
            "montant_finance": 50000,
            "loyer_mensuel_client": 2000,
            "loyer_mensuel_banque": 1500,
            "apport_initial": 10000,
            "depot_garantie": 4000,
            "prix_achat_ht": 60000,
            "taux_depreciation_annuel": 0.08,
            "coefficient_recuperabilite": 0.90,
            "duree_mois": 36,
        }
        result = RiskCurveCalculator.compute_curve(deal)
        last = result["curve_data"][-1]
        assert last["couvert"]  # Should be covered at end
