export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  settings: OrganizationSettings;
  created_at: string;
};

export type OrganizationSettings = {
  ponderation_macro_sectoriel: number;
  ponderation_financier: number;
  ponderation_materiel: number;
  ponderation_dirigeant: number;
  seuil_go: number;
  seuil_go_conditionnel: number;
  seuil_changement_dirigeant_jours: number;
  seuil_privilege_tresor_euros: number;
  seuil_privilege_urssaf_euros: number;
  nb_liquidations_veto: number;
  activer_detection_somptuaire: boolean;
  seuil_depense_somptuaire: number;
  whitelist_libelles_bancaires: string[];
  taux_refinancement_defaut: number;
  delai_recuperation_defaut_mois: number;
  profils_scoring: ScoringProfile[];
};

export type ScoringProfile = {
  name: string;
  weights: {
    macro_sectoriel: number;
    financier: number;
    materiel: number;
    dirigeant: number;
  };
};

export type User = {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  role: 'admin' | 'analyst' | 'viewer';
  onboarding_completed: boolean;
  created_at: string;
};

export type Deal = {
  id: string;
  organization_id: string;
  created_by: string | null;
  siren: string | null;
  raison_sociale: string | null;
  forme_juridique: string | null;
  code_naf: string | null;
  secteur_label: string | null;
  adresse: string | null;
  date_creation_entreprise: string | null;
  dirigeant_nom: string | null;
  dirigeant_prenom: string | null;
  dirigeant_date_nomination: string | null;
  jours_depuis_nomination: number | null;
  changement_dirigeant_recent: boolean;
  type_financement: 'loa' | 'credit_bail' | 'pret' | 'affacturage' | 'autre' | null;
  montant_finance: number | null;
  apport_initial: number;
  duree_mois: number | null;
  loyer_mensuel_client: number | null;
  depot_garantie: number;
  taux_refinancement_banque: number | null;
  loyer_mensuel_banque: number | null;
  frais_dossier_banque: number;
  penalites_remboursement_anticipe: number;
  cotation_bdf_activite: string | null;
  cotation_bdf_credit: string | null;
  cotation_bdf_source: string | null;
  indicateur_dirigeant_bdf: string | null;
  status: 'draft' | 'analyzing' | 'completed' | 'archived';
  profil_scoring_applique: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type AssetClass =
  | 'vehicule_leger'
  | 'vehicule_utilitaire'
  | 'vehicule_luxe_collection'
  | 'engin_tp'
  | 'machine_industrielle'
  | 'materiel_agricole'
  | 'vehicule_pl_transport'
  | 'levage_manutention'
  | 'echafaudage_coffrage'
  | 'materiel_medical'
  | 'informatique_bureautique'
  | 'materiel_restauration'
  | 'energie_environnement'
  | 'autre';

export type DealAsset = {
  id: string;
  deal_id: string;
  asset_class: AssetClass;
  asset_subclass: string | null;
  marque: string | null;
  marque_normalized: string | null;
  modele: string | null;
  modele_normalized: string | null;
  reference_constructeur: string | null;
  annee_fabrication: number | null;
  numero_serie: string | null;
  vin: string | null;
  immatriculation: string | null;
  etat: 'neuf' | 'occasion_tres_bon' | 'occasion_bon' | 'occasion_correct' | 'reconditionne' | null;
  kilometrage: number | null;
  heures_moteur: number | null;
  prix_achat_ht: number | null;
  valeur_marche_estimee: number | null;
  taux_depreciation_annuel: number | null;
  traceur_gps: boolean;
  contrat_recuperation: boolean;
  coefficient_recuperabilite: number | null;
  fournisseur_nom: string | null;
  fournisseur_siren: string | null;
  created_at: string;
};

export type DealScore = {
  id: string;
  deal_id: string;
  score_macro: number | null;
  score_sectoriel: number | null;
  score_macro_sectoriel_combine: number | null;
  score_financier: number | null;
  score_materiel: number | null;
  score_dirigeant: number | null;
  score_deal_total: number | null;
  verdict: 'go' | 'go_conditionnel' | 'no_go' | 'veto' | null;
  veto_raison: string | null;
  recommandation: string | null;
  deal_optimizer_suggestions: OptimizerSuggestion[] | null;
  ponderation_used: Record<string, number> | null;
  computed_at: string;
};

export type OptimizerSuggestion = {
  type: string;
  description: string;
  impact_estime: number;
  effort: 'faible' | 'moyen' | 'fort';
};

export type Verdict = 'go' | 'go_conditionnel' | 'no_go' | 'veto';

export type VerdictStyle = {
  bg: string;
  text: string;
  border: string;
};

export type ScoreMention = {
  mention: string;
  color: string;
  score: number;
};

export type RiskCurvePoint = {
  mois: number;
  crd_banque: number;
  valeur_bien: number;
  valeur_recuperable_nette: number;
  loyers_nets_cumules: number;
  rrn: number;
  couvert: boolean;
};

export type SimulationScenario = {
  id: string;
  deal_id: string;
  nom_scenario: string | null;
  mois_defaut: number;
  delai_recuperation_mois: number;
  loyers_encaisses: number;
  loyers_perdus: number;
  cout_bancaire_total: number;
  crd_au_defaut: number;
  valeur_bien_recuperation: number;
  cout_recuperation: number;
  valeur_nette_bien: number;
  bilan_net: number;
  taux_recuperation: number;
  seuil_rentabilite_mois: number | null;
  depot_garantie_suggere: number;
};
