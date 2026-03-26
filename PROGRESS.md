# ScoreFlow — Progression du développement

## Phase 1 : Architecture + Schéma BDD ✅
- [x] Structure répertoires (Next.js 14 + FastAPI)
- [x] ARCHITECTURE.md
- [x] Schéma SQL complet (14 tables + RLS + triggers)
- [x] Backend FastAPI (routes API + moteur scoring)
- [x] Types TypeScript + client Supabase
- [x] .env.example + Dockerfiles + railway.toml

## Phase 2 : Auth + Multi-tenant + Onboarding ✅
- [x] Login (email/password + magic link) + register + callback
- [x] Middleware protection routes
- [x] Onboarding wizard 3 étapes
- [x] Sidebar collapsible (64px→220px, style Gmail)

## Phase 3 : Workflow création dossier ✅
- [x] Wizard 4 étapes (prospect, deal, documents, lancement)
- [x] API Recherche Entreprises (enrichissement SIREN)
- [x] Upload devis + détection type auto
- [x] Lancement analyse → appel backend scoring

## Phase 4 : Parsing liasse + ratios financiers ✅
- [x] Parsing Python pur (pdfplumber + regex CERFA 2050-2053)
- [x] Parsing XML DGFiP natif
- [x] 30+ ratios calculés (liquidité, capacité, structure, rentabilité, activité)
- [x] Altman Z' + Conan & Holder
- [x] Vérification croisée API ratios_inpi_bce
- [x] 0 appel Claude pour les liasses (économie ~95%)

## Phase 5 : Simulateur d'incident + courbe RRN ✅
- [x] Sliders interactifs (mois défaut + délai récupération)
- [x] 4 scénarios rapides
- [x] Graphique AreaChart 4 courbes (Recharts)
- [x] Courbe RRN avec Points A et B

## Phase 6 : Scoring 5 dimensions ✅
- [x] MacroSectorScorer (matrice croisement)
- [x] FinancialScorer (ratios + scores académiques)
- [x] AssetScorer (14 classes, récupérabilité, dépréciation)
- [x] DirectorScorer (historique, inscriptions, VETO)
- [x] VerdictEngine (GO/GO COND/NO GO/VETO)

## Phase 7 : Module prédictif Signaux Faibles ✅
- [x] PredictiveScorer (régression logistique, 13 variables)
- [x] Probabilité défaillance 6/12/18/24 mois
- [x] Facteurs contributifs + confiance
- [x] SignauxFaiblesService (API data.economie.gouv.fr)
- [x] Cache 24h (macro + sectoriel)

## Phase 8 : Design system + UI ✅
- [x] CSS variables design system (background/text/border tokens)
- [x] Sidebar Gmail collapsible (64px→220px)
- [x] Layout deal : Hypothèses (248px) | Résultats (flex)
- [x] ScoreBlock avec toggle Rosace/Barres
- [x] 4 tuiles hypothèses éditables
- [x] 5 onglets résultats (Macro, Financier, Matériel, Dirigeant, Simulateur)
- [x] Tooltips sur tous les ratios (définition + formule + source)
- [x] ScoreExplainer avec signaux colorés (vert/rouge/orange)
- [x] Responsive mobile
- [x] Icônes Lucide partout

## Phase 9 : Fonctionnalités avancées ✅
- [x] API REST (GET/POST /api/v1/deals, GET /api/v1/deals/:id/score)
- [x] Upload documents dans onglet Financier + relancer analyse
- [x] Suppression dossier avec confirmation
- [x] Portfolio (scatter plot + tableau + agrégats)
- [x] Seed démo (Terrassement Dupont, ~13/20 GO COND)
- [x] Tests unitaires (46 tests pytest)

## Déploiement ✅
- [x] Backend Railway (FastAPI + Dockerfile)
- [x] Frontend Railway (Next.js standalone + Dockerfile)
- [x] Repo GitHub (vmatignon-sudo/Scoreflow)

## Reste à faire
- [ ] Export PDF (Puppeteer)
- [ ] Partage sécurisé banque (JWT 7j)
- [ ] Alertes surveillance post-deal (BODACC hebdo)
- [ ] Mode établissement financier (profils scoring)
- [ ] Comparaison multi-deals
- [ ] Tests E2E (Playwright)
