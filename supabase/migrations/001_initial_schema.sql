-- ScoreFlow — Schema initial complet
-- Migration 001 : Toutes les tables avec RLS

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche fuzzy

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings jsonb DEFAULT '{
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
    "profils_scoring": []
  }'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  role text DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- DEALS
-- ============================================================
CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations NOT NULL,
  created_by uuid REFERENCES users,
  -- Entreprise
  siren varchar(9),
  raison_sociale text,
  forme_juridique text,
  code_naf varchar(6),
  secteur_label text,
  adresse text,
  date_creation_entreprise date,
  -- Dirigeant
  dirigeant_nom text,
  dirigeant_prenom text,
  dirigeant_date_nomination date,
  jours_depuis_nomination integer,
  changement_dirigeant_recent boolean DEFAULT false,
  -- Financement
  type_financement text CHECK (type_financement IN (
    'loa', 'credit_bail', 'pret', 'affacturage', 'autre')),
  montant_finance decimal(12,2),
  apport_initial decimal(12,2) DEFAULT 0,
  duree_mois integer,
  loyer_mensuel_client decimal(10,2),
  depot_garantie decimal(10,2) DEFAULT 0,
  -- Refinancement
  taux_refinancement_banque decimal(5,3),
  loyer_mensuel_banque decimal(10,2),
  frais_dossier_banque decimal(10,2) DEFAULT 0,
  penalites_remboursement_anticipe decimal(10,2) DEFAULT 0,
  -- Cotation BDF
  cotation_bdf_activite varchar(2),
  cotation_bdf_credit varchar(3),
  cotation_bdf_source text CHECK (cotation_bdf_source IN (
    'fiben_direct', 'estimation_infonet', 'fournie_prospect', 'non_disponible')),
  indicateur_dirigeant_bdf varchar(3),
  -- Statut
  status text DEFAULT 'draft' CHECK (status IN (
    'draft', 'analyzing', 'completed', 'archived')),
  profil_scoring_applique text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Index pour recherche rapide
CREATE INDEX idx_deals_organization ON deals(organization_id);
CREATE INDEX idx_deals_siren ON deals(siren);
CREATE INDEX idx_deals_status ON deals(organization_id, status);

-- ============================================================
-- DEAL_ASSETS (Bien financé)
-- ============================================================
CREATE TABLE deal_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  asset_class text NOT NULL CHECK (asset_class IN (
    'vehicule_leger', 'vehicule_utilitaire', 'vehicule_luxe_collection',
    'engin_tp', 'machine_industrielle', 'materiel_agricole',
    'vehicule_pl_transport', 'levage_manutention',
    'echafaudage_coffrage', 'materiel_medical',
    'informatique_bureautique', 'materiel_restauration',
    'energie_environnement', 'autre')),
  asset_subclass text,
  marque text,
  marque_normalized text,
  modele text,
  modele_normalized text,
  reference_constructeur text,
  annee_fabrication integer,
  numero_serie text,
  vin varchar(17),
  immatriculation varchar(20),
  etat text CHECK (etat IN (
    'neuf', 'occasion_tres_bon', 'occasion_bon',
    'occasion_correct', 'reconditionne')),
  kilometrage integer,
  heures_moteur integer,
  date_mise_en_service date,
  derniere_revision date,
  prix_achat_ht decimal(12,2),
  valeur_marche_estimee decimal(12,2),
  source_valorisation text CHECK (source_valorisation IN (
    'api_cotation', 'scraping_marche', 'devis_fournisseur',
    'estimation_manuelle', 'estimation_ia')),
  date_valorisation date,
  taux_depreciation_annuel decimal(5,3),
  methode_depreciation text DEFAULT 'lineaire',
  courbe_depreciation jsonb,
  traceur_gps boolean DEFAULT false,
  traceur_marque text,
  contrat_recuperation boolean DEFAULT false,
  prestataire_recuperation text,
  coefficient_recuperabilite decimal(4,3),
  coefficient_recuperabilite_manuel decimal(4,3),
  motif_ajustement_coefficient text,
  bien_fixe boolean DEFAULT false,
  localisation_habituelle text,
  options jsonb DEFAULT '[]',
  equipements_inclus jsonb DEFAULT '[]',
  garantie_constructeur_mois integer,
  garantie_expiration date,
  devis_document_id uuid,
  devis_date date,
  fournisseur_nom text,
  fournisseur_siren varchar(9),
  asset_fingerprint text GENERATED ALWAYS AS (
    md5(coalesce(vin, '') || coalesce(numero_serie, '') ||
    coalesce(marque_normalized, '') || coalesce(modele_normalized, ''))
  ) STORED,
  age_mois_au_financement integer,
  ratio_km_age decimal(8,2),
  ratio_heures_age decimal(8,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deal_assets_deal ON deal_assets(deal_id);
CREATE INDEX idx_deal_assets_fingerprint ON deal_assets(asset_fingerprint);

-- ============================================================
-- DEAL_SCORES
-- ============================================================
CREATE TABLE deal_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  score_macro decimal(4,2),
  score_sectoriel decimal(4,2),
  score_macro_sectoriel_combine decimal(4,2),
  score_financier decimal(4,2),
  score_materiel decimal(4,2),
  score_dirigeant decimal(4,2),
  score_deal_total decimal(4,2),
  verdict text CHECK (verdict IN ('go', 'go_conditionnel', 'no_go', 'veto')),
  veto_raison text,
  recommandation text,
  deal_optimizer_suggestions jsonb,
  ponderation_used jsonb,
  computed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deal_scores_deal ON deal_scores(deal_id);

-- ============================================================
-- DEAL_DOCUMENTS
-- ============================================================
CREATE TABLE deal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  type text CHECK (type IN (
    'liasse_fiscale', 'releve_bancaire', 'devis_fournisseur', 'autre')),
  filename text,
  storage_path text,
  annee_exercice integer,
  parsed_data jsonb,
  parse_status text DEFAULT 'pending' CHECK (parse_status IN (
    'pending', 'processing', 'done', 'error')),
  error_message text,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deal_documents_deal ON deal_documents(deal_id);

-- ============================================================
-- DEAL_FINANCIAL_RATIOS
-- ============================================================
CREATE TABLE deal_financial_ratios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  annee integer,
  -- Compte de résultat
  ca decimal(14,2),
  ebitda decimal(14,2),
  ebit decimal(14,2),
  resultat_net decimal(14,2),
  caf decimal(14,2),
  -- Bilan actif
  actif_total decimal(14,2),
  actif_circulant decimal(14,2),
  stocks decimal(14,2),
  creances_clients decimal(14,2),
  -- Bilan passif
  passif_total decimal(14,2),
  passif_circulant decimal(14,2),
  dettes_financieres decimal(14,2),
  fonds_propres decimal(14,2),
  capitaux_permanents decimal(14,2),
  tresorerie decimal(14,2),
  -- Autres
  charges_personnel decimal(14,2),
  valeur_ajoutee decimal(14,2),
  frais_financiers decimal(14,2),
  -- Ratios calculés
  ratios jsonb,
  ratios_sectoriels_ref jsonb,
  -- Scores académiques
  score_altman_z decimal(6,3),
  score_conan_holder decimal(6,3),
  altman_zone text CHECK (altman_zone IN ('sain', 'gris', 'danger')),
  conan_zone text CHECK (conan_zone IN ('sain', 'attention', 'difficultes'))
);

CREATE INDEX idx_deal_ratios_deal ON deal_financial_ratios(deal_id);

-- ============================================================
-- DEAL_SIMULATION_SCENARIOS
-- ============================================================
CREATE TABLE deal_simulation_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  nom_scenario text,
  mois_defaut integer,
  delai_recuperation_mois integer,
  taux_frais_recuperation decimal(4,3) DEFAULT 0.12,
  loyers_encaisses decimal(12,2),
  loyers_perdus decimal(12,2),
  cout_bancaire_total decimal(12,2),
  crd_au_defaut decimal(12,2),
  valeur_bien_recuperation decimal(12,2),
  cout_recuperation decimal(12,2),
  penalites_remboursement decimal(12,2),
  valeur_nette_bien decimal(12,2),
  bilan_net decimal(12,2),
  taux_recuperation decimal(5,3),
  seuil_rentabilite_mois integer,
  depot_garantie_suggere decimal(12,2),
  saved_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deal_simulations_deal ON deal_simulation_scenarios(deal_id);

-- ============================================================
-- DEAL_RISK_CURVE
-- ============================================================
CREATE TABLE deal_risk_curve (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  curve_data jsonb NOT NULL,
  mois_couverture_materiel integer,
  mois_couverture_totale integer,
  exposition_max decimal(12,2),
  computed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deal_risk_curve_deal ON deal_risk_curve(deal_id);

-- ============================================================
-- DEAL_DIRECTOR_ANALYSIS
-- ============================================================
CREATE TABLE deal_director_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  mandats_actifs jsonb DEFAULT '[]',
  mandats_passes jsonb DEFAULT '[]',
  nb_mandats_total integer DEFAULT 0,
  nb_societes_saines integer DEFAULT 0,
  nb_societes_liquidees integer DEFAULT 0,
  nb_procedures_collectives integer DEFAULT 0,
  taux_reussite decimal(4,3),
  changement_recent boolean DEFAULT false,
  jours_depuis_nomination integer,
  procedures_collectives jsonb DEFAULT '[]',
  inscriptions_privileges jsonb DEFAULT '[]',
  privilege_tresor_montant decimal(12,2),
  privilege_urssaf_montant decimal(12,2),
  credit_baux_en_cours jsonb DEFAULT '[]',
  charge_mensuelle_creditbaux_estimee decimal(10,2),
  signaux_depenses_somptuaires jsonb DEFAULT '[]',
  cotation_bdf_integree boolean DEFAULT false,
  signaux_positifs jsonb DEFAULT '[]',
  signaux_negatifs jsonb DEFAULT '[]',
  score_reputation decimal(4,2),
  sources_consultees jsonb DEFAULT '[]'
);

CREATE INDEX idx_deal_director_deal ON deal_director_analysis(deal_id);

-- ============================================================
-- DEAL_MACRO_SECTOR_DATA
-- ============================================================
CREATE TABLE deal_macro_sector_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  -- Macro
  pib_croissance decimal(5,3),
  inflation decimal(5,3),
  taux_bce decimal(5,3),
  indice_confiance_entreprises decimal(6,2),
  pmi_manufacturier decimal(5,2),
  phase_cycle text CHECK (phase_cycle IN (
    'expansion', 'plateau', 'ralentissement', 'recession')),
  score_macro_brut decimal(4,2),
  -- Sectoriel
  code_naf varchar(6),
  tendance_sectoriel text,
  taux_defaillance_sectoriel decimal(5,3),
  dso_moyen_sectoriel decimal(6,1),
  chocs_recents jsonb DEFAULT '[]',
  signaux_alerte jsonb DEFAULT '[]',
  score_sectoriel_brut decimal(4,2),
  -- Croisement
  bonus_malus_croisement decimal(4,2) DEFAULT 0,
  matrice_croisement text,
  data_source jsonb,
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deal_macro_deal ON deal_macro_sector_data(deal_id);

-- ============================================================
-- DEAL_NEGOTIATION_HISTORY
-- ============================================================
CREATE TABLE deal_negotiation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users,
  params_avant jsonb,
  params_apres jsonb,
  score_avant decimal(4,2),
  score_apres decimal(4,2),
  verdict_avant text,
  verdict_apres text,
  scenario_applique text,
  motif text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_deal_negotiation_deal ON deal_negotiation_history(deal_id);

-- ============================================================
-- ASSET_PERFORMANCE_HISTORY
-- ============================================================
CREATE TABLE asset_performance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations,
  asset_class text,
  asset_subclass text,
  marque_normalized text,
  modele_normalized text,
  annee_fabrication integer,
  etat_initial text,
  km_heures_initial integer,
  taux_depreciation_theorique decimal(5,3),
  taux_depreciation_observe decimal(5,3),
  coefficient_recuperabilite_theorique decimal(4,3),
  valeur_recuperation_reelle decimal(12,2),
  taux_couverture_reel decimal(5,3),
  deal_outcome text CHECK (deal_outcome IN (
    'rembourse_normalement', 'rembourse_anticipe',
    'incident_leger', 'incident_grave', 'perte_totale')),
  mois_premier_incident integer,
  code_naf_client varchar(6),
  region_client text,
  montant_finance decimal(12,2),
  duree_contrat_mois integer,
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX idx_asset_perf_org ON asset_performance_history(organization_id);

-- ============================================================
-- PAYMENT_BEHAVIORS
-- ============================================================
CREATE TABLE payment_behaviors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES deals ON DELETE CASCADE NOT NULL,
  mois_numero integer NOT NULL,
  statut text CHECK (statut IN (
    'a_temps', 'retard_leger', 'retard_important', 'impaye')),
  jours_retard integer DEFAULT 0,
  montant_du decimal(10,2),
  montant_paye decimal(10,2),
  recorded_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payment_deal ON payment_behaviors(deal_id);

-- ============================================================
-- AUDIT_LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations,
  user_id uuid REFERENCES users,
  deal_id uuid REFERENCES deals ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_deal ON audit_logs(deal_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- BRANDS_MODELS (normalisation marques)
-- ============================================================
CREATE TABLE brands_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name_normalized text UNIQUE NOT NULL,
  brand_aliases text[],
  asset_class text,
  typical_depreciation_rate decimal(5,3),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper function to get current user's organization
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Organizations: users can only see their own org
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id = get_user_org_id());
CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (id = get_user_org_id())
  WITH CHECK (id = get_user_org_id());

-- Users: can see users in same org
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON users FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() OR organization_id IS NULL);
CREATE POLICY "users_update" ON users FOR UPDATE
  USING (id = auth.uid());

-- Deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_select" ON deals FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "deals_insert" ON deals FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "deals_update" ON deals FOR UPDATE
  USING (organization_id = get_user_org_id());
CREATE POLICY "deals_delete" ON deals FOR DELETE
  USING (organization_id = get_user_org_id());

-- Macro function for child tables of deals
CREATE OR REPLACE FUNCTION deal_belongs_to_org(p_deal_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM deals
    WHERE id = p_deal_id AND organization_id = get_user_org_id()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Deal Assets
ALTER TABLE deal_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_assets_all" ON deal_assets FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Deal Scores
ALTER TABLE deal_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_scores_all" ON deal_scores FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Deal Documents
ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_documents_all" ON deal_documents FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Deal Financial Ratios
ALTER TABLE deal_financial_ratios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_ratios_all" ON deal_financial_ratios FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Deal Simulation Scenarios
ALTER TABLE deal_simulation_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_simulations_all" ON deal_simulation_scenarios FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Deal Risk Curve
ALTER TABLE deal_risk_curve ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_risk_all" ON deal_risk_curve FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Deal Director Analysis
ALTER TABLE deal_director_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_director_all" ON deal_director_analysis FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Deal Macro Sector Data
ALTER TABLE deal_macro_sector_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_macro_all" ON deal_macro_sector_data FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Deal Negotiation History
ALTER TABLE deal_negotiation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deal_negotiation_all" ON deal_negotiation_history FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Asset Performance History
ALTER TABLE asset_performance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asset_perf_all" ON asset_performance_history FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- Payment Behaviors
ALTER TABLE payment_behaviors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_all" ON payment_behaviors FOR ALL
  USING (deal_belongs_to_org(deal_id))
  WITH CHECK (deal_belongs_to_org(deal_id));

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_select" ON audit_logs FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

-- Brands Models: readable by all authenticated users
ALTER TABLE brands_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_select" ON brands_models FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on deals
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-calculate jours_depuis_nomination
CREATE OR REPLACE FUNCTION calc_jours_nomination()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dirigeant_date_nomination IS NOT NULL THEN
    NEW.jours_depuis_nomination = EXTRACT(DAY FROM now() - NEW.dirigeant_date_nomination)::integer;
    NEW.changement_dirigeant_recent = NEW.jours_depuis_nomination < 180;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_calc_nomination
  BEFORE INSERT OR UPDATE OF dirigeant_date_nomination ON deals
  FOR EACH ROW EXECUTE FUNCTION calc_jours_nomination();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Note: Execute via Supabase Dashboard or API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('deal-documents', 'deal-documents', false);
