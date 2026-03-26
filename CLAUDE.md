# SCOREFLOW — Cahier des charges complet

## DESIGN SYSTEM — STYLE APPLE MODERNE

### Philosophie
- Minimaliste, épuré, beaucoup d'espace blanc
- Ombres subtiles au lieu de bordures lourdes
- Coins arrondis généreux (16px cards, 12px buttons, 8px inputs)
- Micro-interactions : active:scale-[0.98], transitions 0.2s ease
- Glassmorphism sur sidebar et nav (backdrop-filter blur)
- Typographie serrée (tracking-tight), tailles précises en pixels

### Palette
- Background pages : #f5f5f7 (gris clair, app) / blanc (landing sections)
- Cards de contenu : #ffffff avec shadow (flottent au-dessus du fond)
- Inner elements : #f5f5f7 (inputs, sous-containers, badges)
- Texte h1/h2 : #1d1d1f
- Texte h3 (titres cards) : #2d2d2d
- Texte courant : #424245 (body default)
- Texte secondaire : #6e6e73
- Texte muted : #86868b / #a1a1a6
- Boutons action/CTA : #1e40af (bleu soutenu), hover #1e3a8a
- Liens : #06c (bleu Apple)
- Icônes actives/accent : #1e40af sur fond #1e40af/8%
- Success : #2d9d3f, Warning : #bf5a00, Danger : #c4342d
- Borders : rgba(0,0,0,0.04)

### Composants
- Boutons primaires : bg-[#1e40af] text-white rounded-[12px] ou rounded-full
- Boutons secondaires : bg-[#f5f5f7] text-[#424245] rounded-[12px]
- Inputs : bg-[#f5f5f7] rounded-[12px], pas de border, focus:ring-black/10
- Tuiles features : bg-[#f5f5f7] rounded-[20px], hover:bg-[#ededf0]
- Cards : bg-white rounded-[20px] shadow-sm
- Sidebar : bg-[#fbfbfd]/80 glass, w-[240px]
- Score gauge : arcs SVG fins (strokeWidth 6), animations ease-out

### Responsive
- Mobile first : tout doit être lisible sur iPhone
- Sidebar : hidden sur mobile (sm:flex), visible à partir de 640px
- Score panel droit : hidden sur mobile (lg:block)
- Grids : grid-cols-1 sur mobile, sm:grid-cols-2, lg:grid-cols-3+
- Padding : p-5 mobile, sm:p-8 desktop
- Textes hero : text-[32px] mobile, sm:text-[52px] desktop
- Boutons : flex-col sur mobile, sm:flex-row

### Interdit
- Bordures épaisses ou colorées
- Couleurs saturées en background (#EBF0FF, #F0FDF4, etc.)
- Ombres lourdes
- Emojis dans les labels (OK dans les catégories d'actifs)
- Largeurs fixes sans breakpoints responsive

## RÈGLES GIT
- Après chaque phase terminée, faire un git add . + git commit + git push
- Si le repo GitHub n'existe pas encore, le créer avec :
  gh repo create vincentmatignon/scoreflow --public
- Format des commits : "Phase X terminée : [description courte]"
- En cas d'erreur bloquante, commit et push ce qui est fait avant de s'arrêter

## RÈGLES DE QUALITÉ DU CODE
Après chaque fichier ou composant créé, tu dois obligatoirement :

1. RELIRE le code que tu viens d'écrire
2. VÉRIFIER :
   - Pas d'erreurs de syntaxe
   - Les imports sont corrects et les dépendances existent
   - Les variables d'environnement utilisées sont dans .env.example
   - Les types TypeScript sont cohérents
   - Les appels API correspondent aux endpoints définis
   - La logique métier respecte le cahier des charges
3. CORRIGER immédiatement si tu trouves un problème
4. TESTER si possible : lancer le build ou les tests unitaires
   avant de passer à la phase suivante
5. Ne jamais passer à la phase suivante si la phase courante
   ne compile pas ou a des erreurs évidentes
```

**Cmd+S** pour sauvegarder, puis dans Claude Code :
```
Relis CLAUDE.md, intègre les nouvelles règles et continue.


## INSTRUCTIONS DE DÉVELOPPEMENT
Développe l'application complète de manière autonome et séquentielle.
Ne demande pas de validation entre les phases.
Si un choix technique est ambigu, tranche toi-même en faveur
de la solution la plus robuste et maintenable.
Ne t'arrête que sur une erreur technique bloquante.
Crée tous les fichiers, installe tous les packages nécessaires.
À chaque fin de phase, note dans PROGRESS.md ce qui est fait
et ce qui reste à faire.

## ORDRE DE DÉVELOPPEMENT — 9 PHASES SÉQUENTIELLES
Phase 1 : Architecture + schéma BDD Supabase complet
Phase 2 : Auth + infrastructure multi-tenant + onboarding
Phase 3 : Workflow création dossier 4 étapes + extraction devis
Phase 4 : Parsing liasse fiscale + calcul ratios financiers
Phase 5 : Simulateur d'incident + courbe risque résiduel net
Phase 6 : Niveaux macro/sectoriel/matériel/dirigeant/inscriptions
Phase 7 : Score Deal + verdict + Deal Optimizer automatique
Phase 8 : Design complet + micro-interactions
Phase 9 : Fonctionnalités avancées + PDF + API + portefeuille

---

## PHILOSOPHIE CENTRALE
ScoreFlow note un DEAL, pas un client. Un client fragile + matériel
qui s'apprécie = deal acceptable. Un excellent client + matériel qui
s'effondre = deal risqué. Le Score Deal composite intègre une logique
de compensation entre les 5 dimensions.
Différenciateur vs CreditSafe/Altares/Coface : ils notent l'entreprise.
ScoreFlow note le deal dans sa globalité incluant le bien financé
et sa valeur résiduelle dans le temps.

---

## STACK TECHNIQUE
- Frontend : Next.js 14 App Router + TypeScript
- Auth + BDD : Supabase (PostgreSQL + Row Level Security)
- Moteur scoring : FastAPI Python (microservice séparé)
- IA / analyse : Claude API (claude-sonnet-4-20250514)
- OCR / parsing : Mistral OCR ou AWS Textract
- PDF export : Puppeteer
- Cache / queues : Redis + Bull
- Hébergement : Vercel (frontend) + Railway (API Python)
Créer ARCHITECTURE.md avec justification des choix.

---

## APIs PUBLIQUES FRANÇAISES À INTÉGRER

### APIs entreprises (gratuites, officielles)
API Recherche Entreprises (INSEE + INPI) :
  https://recherche-entreprises.api.gouv.fr/
  → Enrichissement automatique dès saisie SIREN
  → Raison sociale, NAF, dirigeants, adresse, statut

API SIRENE (INSEE) :
  https://portail-api.insee.fr/
  → Données de base, mises à jour quotidiennes

API INPI / RNE — Documents et comptes :
  https://data.inpi.fr/
  → Accès direct aux liasses fiscales déposées
  → Compte gratuit, pas de validation requise
  → Source primaire pour les états financiers

API BODACC :
  https://bodacc.fr/pages/donnees-ouvertes-et-api/
  → Procédures collectives, créations, radiations, cessions

API Open Data URSSAF :
  https://open.urssaf.fr/
  → Données sectorielles sur cotisations et comportements

### APIs données financières de référence
API Ratios Financiers par SIREN (INPI/BCE) :
  https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/ratios_inpi_bce/records?where=siren%3D%22XXXXXXXXX%22
  → Ratios calculés par le Ministère de l'Économie par SIREN
  → Source de vérification croisée des ratios calculés depuis la liasse

API Ratios Sectoriels (INPI/BCE) :
  https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/ratios_inpi_bce_sectors/records?where=naf%3D%22XXXX%22
  → Percentiles Q10/Q25/Q50/Q75/Q90 par secteur NAF
  → Benchmark sectoriel automatique pour comparer le prospect

### APIs macro (niveau 1)
API INSEE Melodi (séries statistiques) :
  https://portail-api.insee.fr/ → API Melodi et API BDM
  → PIB, inflation, indices de production industrielle

API Banque de France stats (open data légal, distinct de FIBEN) :
  https://webstat.banque-france.fr/
  → Taux directeur, conditions de crédit, indicateurs de confiance

API Eurostat :
  https://ec.europa.eu/eurostat/web/json-and-unicode-web-services/
  → PMI zone euro, indicateurs macroéconomiques

### Référence méthodologique prédictive
Projet Signaux Faibles (code open source + méthodologie) :
  https://github.com/signaux-faibles/
  → Modèle de détection défaillance à 18 mois
  → Variables explicatives : URSSAF, activité partielle, BDF, financier
  → Feuille de route pour le module prédictif niveau 7

---

## BASE DE DONNÉES SUPABASE — TABLES COMPLÈTES

Row Level Security activé sur toutes les tables.
Toutes les requêtes filtrées par organization_id.

### organizations
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
name text NOT NULL,
slug text UNIQUE NOT NULL,
plan text DEFAULT 'free' CHECK (plan IN ('free','pro','enterprise')),
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
```

### users
```sql
id uuid PRIMARY KEY REFERENCES auth.users,
organization_id uuid REFERENCES organizations,
email text NOT NULL,
role text DEFAULT 'analyst'
  CHECK (role IN ('admin','analyst','viewer')),
created_at timestamptz DEFAULT now()
```

### deals
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id uuid REFERENCES organizations NOT NULL,
created_by uuid REFERENCES users,
siren varchar(9),
raison_sociale text,
forme_juridique text,
code_naf varchar(6),
secteur_label text,
adresse text,
date_creation_entreprise date,
dirigeant_nom text,
dirigeant_prenom text,
dirigeant_date_nomination date,
jours_depuis_nomination integer,
changement_dirigeant_recent boolean DEFAULT false,
type_financement text CHECK (type_financement IN
  ('loa','credit_bail','pret','affacturage','autre')),
montant_finance decimal(12,2),
apport_initial decimal(12,2) DEFAULT 0,
duree_mois integer,
loyer_mensuel_client decimal(10,2),
depot_garantie decimal(10,2) DEFAULT 0,
taux_refinancement_banque decimal(5,3),
loyer_mensuel_banque decimal(10,2),
frais_dossier_banque decimal(10,2) DEFAULT 0,
penalites_remboursement_anticipe decimal(10,2) DEFAULT 0,
cotation_bdf_activite varchar(2),
cotation_bdf_credit varchar(3),
cotation_bdf_source text CHECK (cotation_bdf_source IN
  ('fiben_direct','estimation_infonet',
   'fournie_prospect','non_disponible')),
indicateur_dirigeant_bdf varchar(3),
status text DEFAULT 'draft' CHECK (status IN
  ('draft','analyzing','completed','archived')),
profil_scoring_applique text,
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now(),
completed_at timestamptz
```

### deal_assets (bien financé — 100% structuré)
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
asset_class text NOT NULL CHECK (asset_class IN (
  'vehicule_leger','vehicule_utilitaire','vehicule_luxe_collection',
  'engin_tp','machine_industrielle','materiel_agricole',
  'vehicule_pl_transport','levage_manutention',
  'echafaudage_coffrage','materiel_medical',
  'informatique_bureautique','materiel_restauration',
  'energie_environnement','autre')),
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
  'neuf','occasion_tres_bon','occasion_bon',
  'occasion_correct','reconditionne')),
kilometrage integer,
heures_moteur integer,
date_mise_en_service date,
derniere_revision date,
prix_achat_ht decimal(12,2),
valeur_marche_estimee decimal(12,2),
source_valorisation text CHECK (source_valorisation IN (
  'api_cotation','scraping_marche','devis_fournisseur',
  'estimation_manuelle','estimation_ia')),
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
  md5(coalesce(vin,'') || coalesce(numero_serie,'') ||
  coalesce(marque_normalized,'') ||
  coalesce(modele_normalized,''))
) STORED,
age_mois_au_financement integer,
ratio_km_age decimal(8,2),
ratio_heures_age decimal(8,2),
created_at timestamptz DEFAULT now()
```

### deal_scores
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
score_macro decimal(4,2),
score_sectoriel decimal(4,2),
score_macro_sectoriel_combine decimal(4,2),
score_financier decimal(4,2),
score_materiel decimal(4,2),
score_dirigeant decimal(4,2),
score_deal_total decimal(4,2),
verdict text CHECK (verdict IN
  ('go','go_conditionnel','no_go','veto')),
veto_raison text,
recommandation text,
deal_optimizer_suggestions jsonb,
ponderation_used jsonb,
computed_at timestamptz DEFAULT now()
```

### deal_documents
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
type text CHECK (type IN (
  'liasse_fiscale','releve_bancaire',
  'devis_fournisseur','autre')),
filename text,
storage_path text,
annee_exercice integer,
parsed_data jsonb,
parse_status text DEFAULT 'pending' CHECK (parse_status IN (
  'pending','processing','done','error')),
error_message text,
uploaded_at timestamptz DEFAULT now()
```

### deal_financial_ratios
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
annee integer,
ca decimal(14,2), ebitda decimal(14,2), ebit decimal(14,2),
resultat_net decimal(14,2), caf decimal(14,2),
actif_total decimal(14,2), actif_circulant decimal(14,2),
stocks decimal(14,2), creances_clients decimal(14,2),
passif_total decimal(14,2), passif_circulant decimal(14,2),
dettes_financieres decimal(14,2), fonds_propres decimal(14,2),
capitaux_permanents decimal(14,2), tresorerie decimal(14,2),
charges_personnel decimal(14,2), valeur_ajoutee decimal(14,2),
frais_financiers decimal(14,2),
ratios jsonb,
ratios_sectoriels_ref jsonb,
score_altman_z decimal(6,3),
score_conan_holder decimal(6,3),
altman_zone text CHECK (altman_zone IN ('sain','gris','danger')),
conan_zone text CHECK (conan_zone IN
  ('sain','attention','difficultes'))
```

### deal_simulation_scenarios
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
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
```

### deal_risk_curve
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
curve_data jsonb NOT NULL,
-- Structure curve_data :
-- [{mois: 1, crd_banque: X, valeur_bien: Y,
--   valeur_recuperable_nette: Z,
--   loyers_nets_cumules: W, rrn: V, couvert: bool}, ...]
mois_couverture_materiel integer,
mois_couverture_totale integer,
exposition_max decimal(12,2),
computed_at timestamptz DEFAULT now()
```

### deal_director_analysis
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
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
```

### deal_macro_sector_data
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
pib_croissance decimal(5,3),
inflation decimal(5,3),
taux_bce decimal(5,3),
indice_confiance_entreprises decimal(6,2),
pmi_manufacturier decimal(5,2),
phase_cycle text CHECK (phase_cycle IN (
  'expansion','plateau','ralentissement','recession')),
score_macro_brut decimal(4,2),
code_naf varchar(6),
tendance_sectoriel text,
taux_defaillance_sectoriel decimal(5,3),
dso_moyen_sectoriel decimal(6,1),
chocs_recents jsonb DEFAULT '[]',
signaux_alerte jsonb DEFAULT '[]',
score_sectoriel_brut decimal(4,2),
bonus_malus_croisement decimal(4,2) DEFAULT 0,
matrice_croisement text,
data_source jsonb,
fetched_at timestamptz DEFAULT now()
```

### deal_negotiation_history
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
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
```

### asset_performance_history
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals,
organization_id uuid REFERENCES organizations,
asset_class text, asset_subclass text,
marque_normalized text, modele_normalized text,
annee_fabrication integer, etat_initial text,
km_heures_initial integer,
taux_depreciation_theorique decimal(5,3),
taux_depreciation_observe decimal(5,3),
coefficient_recuperabilite_theorique decimal(4,3),
valeur_recuperation_reelle decimal(12,2),
taux_couverture_reel decimal(5,3),
deal_outcome text CHECK (deal_outcome IN (
  'rembourse_normalement','rembourse_anticipe',
  'incident_leger','incident_grave','perte_totale')),
mois_premier_incident integer,
code_naf_client varchar(6),
region_client text,
montant_finance decimal(12,2),
duree_contrat_mois integer,
recorded_at timestamptz DEFAULT now()
```

### payment_behaviors
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
deal_id uuid REFERENCES deals NOT NULL,
mois_numero integer NOT NULL,
statut text CHECK (statut IN (
  'a_temps','retard_leger','retard_important','impaye')),
jours_retard integer DEFAULT 0,
montant_du decimal(10,2),
montant_paye decimal(10,2),
recorded_at timestamptz DEFAULT now()
```

### audit_logs
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id uuid REFERENCES organizations,
user_id uuid REFERENCES users,
deal_id uuid REFERENCES deals,
action text NOT NULL,
details jsonb,
ip_address inet,
created_at timestamptz DEFAULT now()
```

### brands_models (normalisation marques)
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
brand_name_normalized text UNIQUE NOT NULL,
brand_aliases text[],
asset_class text,
typical_depreciation_rate decimal(5,3),
created_at timestamptz DEFAULT now()
```

---

## MODULE 0 — INFRASTRUCTURE SAAS

Auth Supabase : email/password + magic link
Invitation membres par email avec rôle assigné
Rôles : admin / analyst / viewer
RLS sur toutes les tables via organization_id

Plans :
- Free : 3 dossiers/mois, pas d'export PDF, pas d'API
- Pro : illimité, export PDF, alertes, API
- Enterprise : marque blanche, webhook, profils scoring multiples

Onboarding wizard 3 étapes (première connexion) :
1. Nom de l'organisation
2. Type d'activité principale
3. Paramètres par défaut (taux refinancement, délai récupération)
Créer un dossier de démonstration pré-chargé automatiquement.

---

## CRÉATION D'UN DOSSIER — 4 ÉTAPES MAX 5 MINUTES

### Règle absolue
Ne jamais demander ce que le système peut trouver seul.

### Étape 1 — Prospect (30 secondes)
Champ unique : SIREN ou raison sociale
Dès 9 caractères → appel API Recherche Entreprises automatique :
  Récupérer : raison sociale, forme juridique, adresse,
  dirigeant(s) + date de nomination, code NAF + libellé,
  date de création, procédures collectives actives
Calculer immédiatement jours_depuis_nomination
Si < seuil configuré → badge orange "Dirigeant récent"
Preview "Voilà ce que nous avons trouvé" + validation 1 clic

Vérification anti-doublon FIBEN :
  Interroger API INPI pour voir si liasses disponibles
  → Proposer de les importer directement sans upload manuel

### Étape 2 — Le deal
Zone upload devis en haut :
"📄 Déposez le devis fournisseur pour remplissage automatique"
→ OCR + Claude API pour extraire : marque, modèle, référence,
  année, numéro de série, VIN, km/heures, prix HT,
  options, fournisseur, date du devis
→ Preview "Voici ce que nous avons extrait" + correction possible

Sélecteur visuel type financement (icônes) :
[LOA] [Crédit-bail] [Prêt] [Affacturage] [Autre]

6 champs deal :
- Montant financé (€) → loyer estimé temps réel
- Durée (mois) → slider 12/24/36/48/60/72/84
- Valeur du bien (€) → pré-remplie depuis devis
- Dépôt de garantie (€)
- Catégorie du bien (sélecteur icônes 14 catégories)
- Sous-catégorie (liste fermée selon catégorie)

Champs structurés bien (pré-remplis depuis devis) :
  Marque | Modèle normalisé | Année | État | Km/heures
  N° série | VIN | Immatriculation

Section récupérabilité :
  ☐ Traqueur GPS → coefficient +0.15
  ☐ Contrat récupérateur → coefficient +0.05
  Coefficient calculé et affiché automatiquement

Section refinancement (repliée) :
  Taux refinancement | Loyer banque | Frais | Pénalités

Section cotation BDF (repliée) :
  Cote activité (A→X) | Cote crédit (1+→P)
  Source | Indicateur dirigeant (000/050/060)
  Bouton "Demander la cotation au prospect" → email type

Affichage temps réel :
"Loyer estimé : 1 240€/mois | Marge brute : 290€/mois (23%)"

### Étape 3 — Documents
Zone de drop unique :
  Liasse(s) fiscale(s) PDF ou XML DGFiP
  Relevés bancaires PDF
  (devis déjà uploadé à l'étape 2)
Détection automatique du type à l'upload.

Avant d'uploader, vérifier si liasses disponibles via API INPI :
  → Si oui : proposer import automatique
  → Si non : upload manuel

Analyse en arrière-plan (queue Redis).
Vérification croisée : comparer ratios calculés depuis la liasse
avec ratios API ratios_inpi_bce pour le même SIREN/année.

### Étape 4 — Lancement
Bouton "Analyser ce deal →"
Écran de progression avec les 5 niveaux séquentiels

---

## NIVEAU 1+2 — MACRO × SECTORIELLE (Score combiné /20)

### Sources niveau 1 (Macro)
API INSEE Melodi : PIB, indice production industrielle
API Banque de France stats open data : taux, confiance
API Eurostat : PMI zone euro
Cache 24h, mise à jour automatique chaque matin

Indicateurs : PIB, inflation, taux BCE, PMI,
indice confiance, phase du cycle

### Sources niveau 2 (Sectoriel)
API ratios_inpi_bce_sectors (data.economie.gouv.fr) :
  → Ratios médians sectoriels Q10/Q25/Q50/Q75/Q90 par NAF
  → Taux de défaillance sectoriel implicite
  → DSO moyen sectoriel
BODACC API : procédures collectives par NAF (30j + 6 mois)
Serper API : actualité sectorielle récente

### Matrice de croisement (affichée visuellement)
              MACRO BON | MACRO NEUTRE | MACRO MAUVAIS
SECTEUR BON   Excellent | Bon          | Bon
SECTEUR NEUTRE Bon      | Passable     | Vigilance
SECTEUR MAUVAIS Vigilance| Risqué      | Risqué

Bonus : secteur porteur malgré macro défavorable → +1 pt
Malus : secteur en crise malgré macro favorable → -2 pts

Score = (score_macro × 40%) + (score_sectoriel × 60%)
        + bonus/malus croisement, ramené sur /20

---

## NIVEAU 3 — ANALYSE FINANCIÈRE (Score /20)

### Parsing et vérification croisée
1. Tenter import automatique via API INPI (data.inpi.fr)
2. Si non disponible : parser la liasse uploadée
3. Vérification croisée avec API ratios_inpi_bce
   → Afficher écarts si différence > 5% sur un ratio clé
4. Relevés bancaires : OCR pour incidents, flux, dépenses somptuaires

### Détection dépenses somptuaires sur relevés
Mots-clés dans libellés débit :
Ferrari, Lamborghini, Porsche Finance, Aston Martin, Bentley,
Rolls Royce, Maserati, Bugatti, Cartier, Rolex, Hermès,
Louis Vuitton, Chanel, Van Cleef, Private Jet, First Class,
Yacht, Casino (>500€), Golf Club (abonnement)
+ tout prélèvement récurrent > seuil_depense_somptuaire
Signal fort si marge nette <5% ET dépense somptuaire

### Scores académiques
Altman Z' (PME non cotées) :
Z' = 0.717(FR/AT) + 0.847(RR/AT) + 3.107(EBIT/AT)
   + 0.420(FP/DF) + 0.998(CA/AT)
Zones : >2.9 sain | 1.23-2.9 gris | <1.23 danger

Conan & Holder (PME françaises, calibré sur 190 PME) :
Z = 0.24(EBE/dettes) + 0.22(CP/AT) + 0.16(dispo/AT)
  - 0.87(FF/CA) - 0.10(charges_pers/VA)
Zones : >0.09 sain | 0.04-0.09 attention | <0.04 difficultés

### Ratios à calculer
LIQUIDITÉ : générale, réduite, immédiate, BFR, FRNG,
trésorerie nette, jours de trésorerie
CAPACITÉ : CAF, dette/CAF, DSCR, couverture,
DSCR résiduel post-deal, EL = PD×EAD×LGD
STRUCTURE : autonomie financière, endettement, gearing, levier
RENTABILITÉ : EBITDA, EBIT, marge nette, ROE, ROA, ROCE
ACTIVITÉ : DSO, DPO, CCC, rotation actif
RELEVÉS : score incidents, taux découvert, régularité flux

### Benchmark sectoriel automatique
Pour chaque ratio calculé, interroger API ratios_inpi_bce_sectors
→ Afficher position du prospect : Q10/Q25/Q50/Q75/Q90 du secteur
→ Code couleur : rouge si <Q25, orange si Q25-Q50,
  vert si >Q50, bleu si >Q75

### Cotation BDF
P → VETO | 7-8 → -3/-4 pts | 5-/6 → -1/-2 pts
3+ à 4+ → neutre | 1+ à 3 → +0.5/+1 pt
Modes : saisie FIBEN | estimation Infonet | fournie prospect
Toujours afficher la source

### Pondération dynamique selon durée
≤24 mois → DSCR, liquidité immédiate, CCC
25-48 mois → CAF/dette, autonomie, DSCR résiduel
>48 mois → structure financière, ROCE, tendance pluriannuelle

---

## NIVEAU 4 — BIEN FINANCÉ (Score /20)

### Coefficients de récupérabilité
vehicule_leger sans GPS : 0.75 | avec GPS : 0.90
vehicule_utilitaire sans GPS : 0.70 | avec GPS : 0.85
vehicule_luxe_collection sans GPS : 0.80 | avec GPS : 0.95
engin_tp sans GPS : 0.55 | avec GPS : 0.70
machine_industrielle standard : 0.70 | spécifique : 0.45
materiel_agricole sans GPS : 0.50 | avec GPS : 0.65
vehicule_pl_transport sans GPS : 0.65 | avec GPS : 0.80
levage_manutention : 0.65
echafaudage_coffrage : 0.45
materiel_medical : 0.60
informatique_bureautique : 0.40
materiel_restauration : 0.65
energie_panneaux_solaires : 0.85
energie_bornes_recharge : 0.55
Bonus contrat récupérateur : +0.05

### Dépréciation annuelle par catégorie
vehicule_leger : -15 à -20% an 1-3, -8% ensuite
vehicule_luxe certains modèles : stable ou croissant
engin_tp : -8 à -12% (accéléré si >8000h)
materiel_agricole : -8 à -12%
vehicule_pl : -12 à -18%
levage : -10 à -15%
echafaudage : -5 à -8%
materiel_medical : -15 à -25%
informatique : -25 à -35%
imprimantes industrielles : -15 à -20%
restauration : -12 à -18%
machine_industrielle standard : -10 à -15%
machine_industrielle specifique : -20 à -30%
panneaux_solaires : -3 à -5%
bornes_recharge : -10 à -15%

### Sources de valorisation
Véhicules : La Centrale API, Argus Pro, AutoScout24
Engins TP : scraping Machineryzone.fr, Mascus.fr
Agricole : scraping Agriaffaires.com
PL : Truckscout24.fr
Levage : Mascus.fr, Surplex.com
Médical : Bimedis
Industrie : Surplex.com, Bidspotter
Tous : Serper API "[marque] [modèle] [année] occasion prix"

### Score ESG bonus
Panneaux solaires, borne recharge VE, véhicule électrique
→ +1 à +2 pts + badge "Deal Vert"

### Anti-double financement
Calculer asset_fingerprint = md5(vin + serie + marque + modele)
Si doublon dans même organisation → alerte rouge bloquante

---

## SIMULATEUR D'INCIDENT

### Sliders
Slider 1 : mois du premier impayé (1 → durée totale)
  Label dynamique : "Impayé au mois 8 — 8 loyers encaissés"
Slider 2 : délai de récupération (1 → 6 mois)
  Boutons rapides : [1m] [2m] [3m] [6m]
Scénarios : [Défaut M6] [Mi-parcours] [Tardif] [Pire cas M3/6m]

### Calculs temps réel
revenus = mois_defaut × loyer_client
couts_bancaires = (mois_defaut + delai) × loyer_banque
                  + frais_dossier
loyers_perdus = delai × loyer_client
crd_banque = tableau_amortissement[mois_defaut + delai]
valeur_bien = valeur_initiale × (1-taux_depre)^((mois+delai)/12)
valeur_bien_nette = valeur_bien × coeff_recuperabilite
                    - valeur_bien × taux_frais_recuperation
penalites = selon paramètre
bilan_net = revenus + valeur_bien_nette + depot_garantie
            - couts_bancaires - crd_banque - penalites
seuil_rentabilite = premier mois où bilan_net > 0
depot_suggere = max(abs(bilan_net_negatif)) sur tous scénarios

### Graphique Recharts AreaChart 4 courbes
CRD banque (rouge), valeur récupérable (bleu),
loyers client cumulés (vert), coûts banque cumulés (orange)
Point rouge draggable = mois de défaut
Ligne pointillée = mois de récupération
Zone colorée = marge cumulée (verte/rouge selon signe)

---

## COURBE DE RISQUE RÉSIDUEL NET (RRN)

### Formule par mois M
crd_banque_M = tableau_amortissement_banque[M]
valeur_recuperable_M = valeur_initiale
                       × (1-taux_depre)^(M/12)
                       × coeff_recuperabilite
                       - frais_recuperation_fixes
loyers_nets_cumules_M = M × (loyer_client - loyer_banque)
                        + apport_initial + depot_garantie
rrn_M = crd_banque_M - valeur_recuperable_M
        - loyers_nets_cumules_M

Si RRN > 0 → exposé | RRN = 0 → équilibre | RRN < 0 → couvert

### Points clés
Point A "Couverture matériel" : valeur_recuperable > crd_banque
Point B "Couverture totale" : RRN < 0
→ "À partir du mois B, vous ne pouvez plus perdre d'argent"

### Graphique dédié (onglet "Risque & Couverture")
4 courbes : CRD banque, valeur récupérable, loyers nets cumulés, RRN
Zone rouge M0→Point B = fenêtre de risque
Zone verte après Point B = couverture
Stocker dans deal_risk_curve.curve_data (JSON mois par mois)

---

## VUE PORTEFEUILLE EN TEMPS RÉEL

Tableau des deals actifs :
  Client | Bien | Mois en cours/Total | CRD banque |
  Valeur récupérable | Loyers nets cumulés | RRN | Statut

Agrégats :
  EXPOSITION TOTALE = Σ RRN positifs
  DEALS EN ZONE ROUGE : X / Y actifs
  VALEUR RÉCUPÉRABLE TOTALE
  COUVERTURE MOYENNE = valeur_récup_totale / CRD_totale

Scatter plot : X = mois restants, Y = RRN
Courbe "Évolution exposition 12 prochains mois"
Export PDF/Excel

---

## NIVEAU 5 — DIRIGEANT ET INSCRIPTIONS (Score /20)

### Sources
API Recherche Entreprises / INPI : mandats actifs/passés
BODACC API : procédures liées au dirigeant
INPI/RNE : radiations, interdictions de gérer
suretesmobilieres.fr (scraping) : privilèges Trésor, URSSAF,
  nantissements, crédit-bail en cours, protêts
Serper API : recherche web sur le dirigeant

### Signaux

A — Inscriptions privilèges
Trésor : dettes fiscales → -3 à -5 pts
URSSAF : cotisations sociales → -3 à -4 pts
  (obligatoire si >15k€ pour <50 salariés)
Nantissement matériel : croiser avec niveau 4
  (le bien financé est-il déjà nanti ?)
Crédit-bail en cours : calculer charge mensuelle totale
  → intégrer dans DSCR résiduel niveau 3
Protêts : -2 pts par incident

B — Changement récent dirigeant
Si jours_depuis_nomination < seuil_changement_dirigeant_jours
→ badge orange + -2 pts
"⚠️ Dirigeant nommé il y a 45 jours — Historique limité"

C — Historique complet
TOUTES les sociétés passées via API INPI/Pappers
Calculer : nb mandats, nb saines, nb liquidées,
nb procédures, taux réussite, durée moyenne mandats
Timeline visuelle avec statut de chaque société

D — Dépenses somptuaires
Depuis parsing relevés bancaires (niveau 3)
Si marge <5% ET dépense somptuaire → signal fort

E — Financements récents détectés
Inscriptions crédit-bail <12 mois sur suretesmobilieres.fr
Recalculer DSCR avec charge mensuelle supplémentaire
Afficher : "3 inscriptions crédit-bail dont 2 depuis <6 mois"

F — Indicateur dirigeant BDF
050 → malus | 060 → VETO automatique

### Pondération interne
Historique judiciaire 35% | Inscriptions privilèges 25%
Ancienneté sectorielle 20% | Changement récent 10%
Dépenses somptuaires 10%

### Paramètres configurables
seuil_changement_dirigeant_jours (défaut 180)
seuil_privilege_tresor_euros (défaut 1)
seuil_privilege_urssaf_euros (défaut 1)
nb_liquidations_veto (défaut 2)
activer_detection_somptuaire (défaut true)
seuil_depense_somptuaire (défaut 500)
whitelist_libelles_bancaires ([])

---

## NIVEAU 6 — SCORE DEAL ET VERDICT

### Score Deal /20
= somme pondérée des sous-scores
Pondération par défaut :
  Macro+Sectoriel 20% | Financier 30%
  Matériel 30% | Dirigeant 20%
Configurable via 5 sliders contrainte somme = 100%

### Grille /20 (toujours afficher mention littérale)
17-20 Excellent #059669 | 13-16 Bon #10B981
10-12 Passable #F59E0B | 7-9 Insuffisant #EF6C00
4-6 Mauvais #DC2626 | 0-3 Critique #991B1B
Toujours afficher : "14,2/20 — Bon"

### VERDICT — ÉLÉMENT N°1, AU-DESSUS DE TOUT

✅ GO (score ≥ 14/20)
   Fond #F0FDF4 | Texte #059669 | Bordure #059669
   "L'analyse globale est favorable."

⚠️ GO CONDITIONNEL (10-13/20)
   Fond #FFFBEB | Texte #B45309 | Bordure #F59E0B
   "Points de vigilance — financement possible sous conditions."

🚫 NO GO (<10/20)
   Fond #FEF2F2 | Texte #991B1B | Bordure #DC2626
   "Risque trop élevé. Financement déconseillé."

⛔ VETO (indépendant du score)
   score_dirigeant <4/20 | interdiction gérer |
   liquidation judiciaire <3 ans | cotation BDF = P |
   indicateur_bdf = 060 | nb_liquidations > seuil

### Deal Optimizer automatique
Si GO CONDITIONNEL ou NO GO :
Algorithme recherche combinaison minimale pour atteindre 14/20
Priorité : dépôt → apport → durée → valeur résiduelle
Proposer 3 scénarios triés par effort minimal prospect
Si impossible → afficher raisons bloquantes clairement

### Curseurs de négociation interactifs
5 curseurs avec Score Deal mis à jour en temps réel :
1. Apport initial (0% à 40%, pas 1%)
2. Dépôt de garantie (0 à 3 loyers, pas 0.5)
3. Durée (12 à 84 mois) + loyer recalculé
4. Valeur résiduelle (-30% à +20%) + motif obligatoire si >10%
5. Caution personnelle (toggle)

IMPORTANT : curseurs ne touchent JAMAIS aux pondérations du modèle.
Afficher : "Le modèle est fixe. Seules les conditions du deal varient."

Stocker toute modification dans deal_negotiation_history.

### Panel droit sticky
Verdict (grand, coloré, en premier)
Score Deal X/20 — mention littérale
Radar chart pentagon 5 dimensions
Liste 5 sous-scores avec mention
[Exporter PDF] [Partager avec la banque]

---

## RAPPORT PDF (Puppeteer)
P1 : Verdict + Score Deal + jauge + date
P2 : Synthèse exécutive
P3-4 : Détail financier (ratios + benchmarks sectoriels + graphiques)
P5 : Détail matériel (LTV curve + dépréciation + RRN)
P6 : Scénarios simulation sauvegardés
P7 : Dirigeant + inscriptions privilèges
P8 : Historique ajustements (deal_negotiation_history)
P9 : Mentions légales + sources + RGPD

---

## FONCTIONNALITÉS AVANCÉES

### Mode établissement financier
Profils de scoring nommés et configurables
Seuils de délégation : accord auto / junior / comité
Workflow approbation interne avec commentaires
Dashboard analytique portefeuille avancé

### Comparaison multi-deals
2-3 deals côte à côte : radars + scores + verdicts

### Partage sécurisé partenaire bancaire
Lien JWT 7 jours, lecture seule, log consultation

### Alertes surveillance post-deal
Hebdomadaire : BODACC, changement dirigeant,
nouveaux comptes → proposition recalcul

### API sortante + Webhook
GET /api/v1/deals | GET /api/v1/deals/:id/score
POST /api/v1/deals | Webhook configurable

### Module prédictif (infrastructure Signaux Faibles)
Suivi mensuel : à temps / retard / impayé
Calcul Paydex interne
Dashboard apprentissage (objectif 200 dossiers)
Variables inspirées du projet Signaux Faibles :
  retards paiement, évolution CA, cotisation URSSAF,
  activité, ratios financiers tendance
Endpoint /api/v1/predictive prêt pour ML

---

## DESIGN — FINTECH FRANÇAISE MODERNE

### Palette
--bg-primary: #FFFFFF | --bg-secondary: #F7F8FA
--bg-tertiary: #EEF0F5 | --text-primary: #0F1923
--text-secondary: #4A5568 | --text-muted: #8A95A3
--accent-blue: #1B4FD8 | --accent-blue-light: #EBF0FF
--score-excellent: #059669 | --score-good: #10B981
--score-average: #F59E0B | --score-poor: #EF6C00
--score-bad: #DC2626 | --border: #E2E8F0

### Typographie
Scores/chiffres : Geist Mono (chiffres tabulaires)
Titres : Plus Jakarta Sans
Corps : DM Sans

### Layout
Sidebar gauche fixe 240px
Contenu central scrollable
Panel Score Deal droit 320px sticky

### Composants clés
Verdict : grand, coloré, premier élément visible
Jauge semi-circulaire 180° animée pour Score Deal
Radar chart pentagon 5 dimensions
Sliders : track 6px dégradé rouge→vert, thumb 22px
Graphiques Recharts : interactifs, animés 500ms ease-out
Micro-interactions : comptage animé, stagger 80ms, pulse

### Thème clair par défaut, sombre en option

---

## SÉCURITÉ ET CONFORMITÉ
AES-256 au repos, TLS 1.3 en transit
RLS sur toutes les tables
Rate limiting : 100 req/min par IP
Audit logs complets
RGPD : conservation 5 ans, droit effacement
Mention RGPD sur analyse dirigeant :
"Données traitées dans le cadre de la prévention
 du risque de crédit (art. 6.1.f RGPD)"

### Contraintes légales impératives
Ne JAMAIS accéder à FIBEN directement (art. L144-1 CMF)
Cotation BDF : saisie manuelle, Infonet, ou prospect uniquement
Afficher toujours la source de la cotation BDF
Les données API ratios_inpi_bce sont OPEN DATA légales
  → distinct de FIBEN, utilisation libre

---

## SEED DE DÉMONSTRATION
Organisation : "ScoreFlow Demo"
Dossier : "Terrassement Dupont SARL"
  SIREN fictif | NAF 4312A | BTP
  Pelle Caterpillar 308 CR 2020 4200h
  Crédit-bail 48 mois | 85 000€ | apport 10%
  Taux refinancement 4.2% | loyer banque 1 680€/mois
  1 privilège URSSAF 6 200€ inscrit il y a 8 mois
  Dirigeant : 12 ans ancienneté, 4 mandats, 1 liquidation >5 ans
  Cotation BDF fictive D4 (saisie manuelle)
  Traceur GPS : oui → coefficient 0.82
  Score Deal visé : ~13/20 — GO CONDITIONNEL
  2 scénarios simulation sauvegardés : M8 et M24
  Benchmark sectoriel NAF 4312A affiché sur tous les ratios

---

## LIVRABLES À CRÉER
1. Application fonctionnelle complète
2. ARCHITECTURE.md — choix techniques justifiés
3. PROGRESS.md — mis à jour après chaque phase
4. .env.example — toutes les variables API requises
5. README.md — installation locale + déploiement
6. RATIOS.md — documentation ratios (formules, seuils, sources)
7. APIs.md — liste complète des APIs utilisées avec endpoints
8. Tests unitaires moteur scoring (Pytest)
9. Tests E2E workflow création dossier (Playwright)