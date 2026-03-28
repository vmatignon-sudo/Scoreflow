-- Seed multi-year financial data for Terrassement SARL (SIREN 123456789)
-- Run this in Supabase SQL Editor

-- Get the deal ID
DO $$
DECLARE
  v_deal_id uuid;
BEGIN
  SELECT id INTO v_deal_id FROM deals WHERE siren = '123456789' LIMIT 1;

  IF v_deal_id IS NULL THEN
    RAISE NOTICE 'Deal not found for SIREN 123456789';
    RETURN;
  END IF;

  RAISE NOTICE 'Deal ID: %', v_deal_id;

  -- Insert year N-2 (2022) — année difficile post-COVID, CA en baisse
  INSERT INTO deal_financial_ratios (
    deal_id, annee,
    ca, ebitda, ebit, resultat_net, caf,
    actif_total, actif_circulant, stocks, creances_clients,
    passif_total, passif_circulant, dettes_financieres, fonds_propres,
    capitaux_permanents, tresorerie, charges_personnel, valeur_ajoutee, frais_financiers,
    ratios,
    score_altman_z, altman_zone, score_conan_holder, conan_zone
  ) VALUES (
    v_deal_id, 2022,
    1850000, 148000, 92500, 37000, 74000,
    1200000, 520000, 85000, 210000,
    1200000, 480000, 380000, 320000,
    720000, 45000, 680000, 740000, 28500,
    '{
      "liquidite_generale": 1.08,
      "liquidite_reduite": 0.91,
      "liquidite_immediate": 0.09,
      "bfr": 185000,
      "frng": 240000,
      "tresorerie_nette": 45000,
      "jours_tresorerie": 9,
      "caf": 74000,
      "dette_sur_caf": 5.14,
      "dscr": 0.95,
      "couverture_ff": 3.24,
      "autonomie_financiere": 0.27,
      "endettement": 1.19,
      "gearing": 1.19,
      "levier": 2.75,
      "marge_ebitda": 0.080,
      "marge_ebit": 0.050,
      "marge_nette": 0.020,
      "roe": 0.116,
      "roa": 0.031,
      "roce": 0.077,
      "dso": 72,
      "dpo": 58,
      "ccc": 31,
      "rotation_actif": 1.54
    }'::jsonb,
    1.85, 'gris', 0.052, 'attention'
  );

  -- Insert year N-1 (2023) — reprise, CA en hausse, ratios qui s'améliorent
  INSERT INTO deal_financial_ratios (
    deal_id, annee,
    ca, ebitda, ebit, resultat_net, caf,
    actif_total, actif_circulant, stocks, creances_clients,
    passif_total, passif_circulant, dettes_financieres, fonds_propres,
    capitaux_permanents, tresorerie, charges_personnel, valeur_ajoutee, frais_financiers,
    ratios,
    score_altman_z, altman_zone, score_conan_holder, conan_zone
  ) VALUES (
    v_deal_id, 2023,
    2150000, 204250, 139750, 75250, 118250,
    1350000, 580000, 78000, 230000,
    1350000, 460000, 340000, 420000,
    890000, 82000, 740000, 860000, 25600,
    '{
      "liquidite_generale": 1.26,
      "liquidite_reduite": 1.09,
      "liquidite_immediate": 0.18,
      "bfr": 158000,
      "frng": 430000,
      "tresorerie_nette": 82000,
      "jours_tresorerie": 14,
      "caf": 118250,
      "dette_sur_caf": 2.87,
      "dscr": 1.18,
      "couverture_ff": 5.47,
      "autonomie_financiere": 0.31,
      "endettement": 0.81,
      "gearing": 0.81,
      "levier": 2.21,
      "marge_ebitda": 0.095,
      "marge_ebit": 0.065,
      "marge_nette": 0.035,
      "roe": 0.179,
      "roa": 0.056,
      "roce": 0.105,
      "dso": 65,
      "dpo": 55,
      "ccc": 23,
      "rotation_actif": 1.59
    }'::jsonb,
    2.42, 'gris', 0.078, 'attention'
  );

  RAISE NOTICE 'Inserted 2 additional years (2022, 2023) for deal %', v_deal_id;
END $$;
