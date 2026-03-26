-- ScoreFlow — Données de démonstration
-- Organisation : "ScoreFlow Demo"
-- Dossier : "Terrassement Dupont SARL"

-- Organization
INSERT INTO organizations (id, name, slug, plan, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ScoreFlow Demo',
  'scoreflow-demo',
  'pro',
  '{
    "ponderation_macro_sectoriel": 20,
    "ponderation_financier": 30,
    "ponderation_materiel": 30,
    "ponderation_dirigeant": 20,
    "seuil_go": 14,
    "seuil_go_conditionnel": 10,
    "seuil_changement_dirigeant_jours": 180,
    "seuil_privilege_tresor_euros": 1,
    "seuil_privilege_urssaf_euros": 1,
    "nb_liquidations_veto": 2,
    "activer_detection_somptuaire": true,
    "seuil_depense_somptuaire": 500,
    "whitelist_libelles_bancaires": [],
    "taux_refinancement_defaut": 4.5,
    "delai_recuperation_defaut_mois": 2,
    "profils_scoring": [],
    "activite_principale": "financement_materiel"
  }'::jsonb
);

-- Deal
INSERT INTO deals (
  id, organization_id, siren, raison_sociale, forme_juridique,
  code_naf, secteur_label, adresse, date_creation_entreprise,
  dirigeant_nom, dirigeant_prenom, dirigeant_date_nomination,
  jours_depuis_nomination, changement_dirigeant_recent,
  type_financement, montant_finance, apport_initial, duree_mois,
  loyer_mensuel_client, depot_garantie,
  taux_refinancement_banque, loyer_mensuel_banque,
  frais_dossier_banque, penalites_remboursement_anticipe,
  cotation_bdf_activite, cotation_bdf_credit, cotation_bdf_source,
  indicateur_dirigeant_bdf, status
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  '123456789', 'Terrassement Dupont SARL', 'SARL',
  '4312A', 'Travaux de terrassement courants et travaux préparatoires',
  '15 rue des Chantiers 69001 Lyon',
  '2012-03-15',
  'Dupont', 'Jean', '2012-03-15',
  4394, false,
  'credit_bail', 85000.00, 8500.00, 48,
  2100.00, 2100.00,
  4.2, 1680.00,
  350.00, 1500.00,
  'D', '4', 'fournie_prospect',
  '000', 'completed'
);

-- Deal Asset
INSERT INTO deal_assets (
  id, deal_id, asset_class, marque, marque_normalized,
  modele, modele_normalized, annee_fabrication,
  etat, heures_moteur, prix_achat_ht,
  taux_depreciation_annuel, traceur_gps, traceur_marque,
  contrat_recuperation, coefficient_recuperabilite,
  fournisseur_nom
) VALUES (
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  'engin_tp', 'Caterpillar', 'caterpillar',
  '308 CR', '308cr', 2020,
  'occasion_bon', 4200, 92000.00,
  0.10, true, 'Geotab',
  true, 0.82,
  'Sud-Est TP Matériel'
);

-- Deal Score (~13/20 = GO CONDITIONNEL)
INSERT INTO deal_scores (
  id, deal_id,
  score_macro, score_sectoriel, score_macro_sectoriel_combine,
  score_financier, score_materiel, score_dirigeant,
  score_deal_total, verdict, recommandation,
  deal_optimizer_suggestions, ponderation_used
) VALUES (
  '00000000-0000-0000-0000-000000000030',
  '00000000-0000-0000-0000-000000000010',
  11.5, 12.0, 11.8,
  13.5, 14.2, 11.0,
  12.8, 'go_conditionnel',
  'Le deal est viable sous réserve d''un renforcement du dépôt de garantie et d''une surveillance des inscriptions URSSAF.',
  '[
    {"type": "depot_garantie", "description": "Augmenter le dépôt de garantie à 2 loyers", "impact_estime": 0.8, "effort": "faible"},
    {"type": "apport_initial", "description": "Augmenter l''apport à 15%", "impact_estime": 1.2, "effort": "moyen"},
    {"type": "duree_mois", "description": "Réduire la durée à 36 mois", "impact_estime": 0.5, "effort": "moyen"}
  ]'::jsonb,
  '{"macro_sectoriel": 0.20, "financier": 0.30, "materiel": 0.30, "dirigeant": 0.20}'::jsonb
);

-- Financial Ratios (BTP typical)
INSERT INTO deal_financial_ratios (
  id, deal_id, annee,
  ca, ebitda, ebit, resultat_net, caf,
  actif_total, actif_circulant, stocks, creances_clients,
  passif_total, passif_circulant, dettes_financieres,
  fonds_propres, capitaux_permanents, tresorerie,
  charges_personnel, valeur_ajoutee, frais_financiers,
  ratios,
  score_altman_z, altman_zone,
  score_conan_holder, conan_zone
) VALUES (
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  2024,
  1850000, 185000, 120000, 72000, 145000,
  1200000, 680000, 95000, 320000,
  1200000, 420000, 280000,
  380000, 780000, 85000,
  720000, 850000, 32000,
  '{
    "liquidite_generale": 1.62,
    "liquidite_reduite": 1.39,
    "liquidite_immediate": 0.20,
    "bfr": 165000,
    "frng": 100000,
    "marge_ebitda": 0.10,
    "marge_nette": 0.039,
    "roe": 0.189,
    "roa": 0.060,
    "autonomie_financiere": 0.317,
    "endettement": 0.737,
    "dette_sur_caf": 1.93,
    "dso": 63.1,
    "rotation_actif": 1.542
  }'::jsonb,
  2.45, 'gris',
  0.068, 'attention'
);

-- Director Analysis
INSERT INTO deal_director_analysis (
  id, deal_id,
  nb_mandats_total, nb_societes_saines, nb_societes_liquidees,
  nb_procedures_collectives, taux_reussite,
  changement_recent, jours_depuis_nomination,
  inscriptions_privileges, privilege_tresor_montant,
  privilege_urssaf_montant, credit_baux_en_cours,
  charge_mensuelle_creditbaux_estimee,
  signaux_positifs, signaux_negatifs, score_reputation
) VALUES (
  '00000000-0000-0000-0000-000000000050',
  '00000000-0000-0000-0000-000000000010',
  4, 3, 1, 0, 0.75,
  false, 4394,
  '[{"type": "urssaf", "montant": 6200, "date_inscription": "2024-07-15", "description": "Cotisations sociales impayées"}]'::jsonb,
  0, 6200,
  '[{"organisme": "Locam", "montant_restant": 12500, "echeance_mensuelle": 520, "date_fin": "2025-11-01"}]'::jsonb,
  520,
  '["12 ans d''ancienneté dans le BTP", "3 sociétés saines sur 4", "Dirigeant stable"]'::jsonb,
  '["1 privilège URSSAF de 6 200 EUR (8 mois)", "1 liquidation ancienne (>5 ans)"]'::jsonb,
  11.0
);

-- Macro Sector Data
INSERT INTO deal_macro_sector_data (
  id, deal_id,
  pib_croissance, inflation, taux_bce,
  indice_confiance_entreprises, pmi_manufacturier,
  phase_cycle, score_macro_brut,
  code_naf, tendance_sectoriel,
  taux_defaillance_sectoriel, dso_moyen_sectoriel,
  score_sectoriel_brut, bonus_malus_croisement,
  matrice_croisement
) VALUES (
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000010',
  0.8, 2.8, 3.75,
  97, 47.5,
  'ralentissement', 11.5,
  '4312A', 'stable',
  0.035, 68.5,
  12.0, 0,
  'Passable'
);

-- Simulation Scenarios
INSERT INTO deal_simulation_scenarios (deal_id, nom_scenario, mois_defaut, delai_recuperation_mois,
  loyers_encaisses, loyers_perdus, cout_bancaire_total, crd_au_defaut,
  valeur_bien_recuperation, cout_recuperation, valeur_nette_bien,
  bilan_net, taux_recuperation, seuil_rentabilite_mois, depot_garantie_suggere)
VALUES
  ('00000000-0000-0000-0000-000000000010', 'Défaut M8', 8, 2,
   16800, 4200, 17150, 67200,
   78500, 9420, 55950,
   -8500, 0.89, 12, 8500),
  ('00000000-0000-0000-0000-000000000010', 'Défaut M24', 24, 2,
   50400, 4200, 44030, 33600,
   68200, 8184, 47740,
   18210, 1.28, null, 0);

-- Risk Curve
INSERT INTO deal_risk_curve (deal_id, mois_couverture_materiel, mois_couverture_totale, exposition_max, curve_data)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  6, 18, 32500,
  '[]'::jsonb
);
