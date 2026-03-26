# ScoreFlow — Progression du développement

## Phase 1 : Architecture + Schéma BDD ✅
- [x] Structure des répertoires (frontend Next.js 14 + backend FastAPI)
- [x] ARCHITECTURE.md avec justification des choix
- [x] Schéma SQL complet Supabase (14 tables + RLS + triggers)
- [x] Backend FastAPI : routes API (scoring, deals, macro, documents, health)
- [x] Moteur de scoring Python (5 modules : financial, asset, director, macro_sector, verdicts)
- [x] Simulateur d'incident + courbe RRN
- [x] Services (macro, sector, enterprise, document_parser)
- [x] Types TypeScript complets (database.ts)
- [x] Client Supabase (browser + server + middleware)
- [x] .env.example avec toutes les variables
- [x] requirements.txt + Dockerfile backend

## Phase 2 : Auth + Multi-tenant + Onboarding ✅
- [x] Page login (email/password + magic link)
- [x] Page register
- [x] Auth callback route
- [x] Middleware de protection des routes
- [x] Onboarding wizard 3 étapes (org name, activité, paramètres)
- [x] Layout principal avec sidebar 240px
- [x] Dashboard page avec stats cards
- [x] Page paramètres (pondérations + seuils)

## Phase 3 : Workflow création dossier ✅
- [x] Page /deals/new avec wizard 4 étapes
- [x] Étape 1 Prospect : recherche SIREN via API Recherche Entreprises
- [x] Enrichissement auto + preview + badge dirigeant récent
- [x] Étape 2 Deal : type financement, montant, durée, asset class (14 catégories)
- [x] Zone upload devis + détails bien structurés
- [x] Sections repliables refinancement + cotation BDF
- [x] Loyer estimé temps réel + marge brute
- [x] Récupérabilité (GPS + contrat récupérateur)
- [x] Étape 3 Documents : drop zone + détection type auto + vérification INPI
- [x] Étape 4 Lancement : récapitulatif + progression séquentielle 5 niveaux
- [x] Insertion deal + asset dans Supabase

## Phase 4 : Parsing liasse + ratios financiers ✅
- [x] FinancialScorer : Altman Z', Conan & Holder
- [x] 30+ ratios calculés (liquidité, capacité, structure, rentabilité, activité)
- [x] Pondération dynamique selon durée (court/moyen/long terme)
- [x] Cotation BDF avec ajustements (VETO si P)
- [x] Service sector_service avec API ratios_inpi_bce_sectors
- [x] Vérification croisée ratios calculés vs API
- [x] DocumentParser : structure pour liasse XML/PDF + relevés bancaires
- [x] Détection dépenses somptuaires (mots-clés)

## Phase 5 : Simulateur d'incident + courbe RRN ✅
- [x] SimulatorPanel frontend avec sliders interactifs
- [x] Slider mois de défaut + délai de récupération (1/2/3/6m)
- [x] 4 scénarios rapides (Défaut M6, Mi-parcours, Tardif, Pire cas)
- [x] Calcul bilan net temps réel
- [x] Graphique AreaChart 4 courbes (Recharts)
- [x] RiskCurveChart : courbe RRN avec Points A et B
- [x] Métriques : couverture matériel, couverture totale, exposition max
- [x] Backend : IncidentSimulator + RiskCurveCalculator

## Phase 6 : Niveaux macro/sectoriel/matériel/dirigeant ✅
- [x] MacroSectorScorer : score macro + sectoriel + matrice de croisement
- [x] AssetScorer : 14 classes, coefficients récupérabilité, dépréciation
- [x] DirectorScorer : historique judiciaire, inscriptions, ancienneté
- [x] Détection VETO automatique (liquidations, BDF, indicateur dirigeant)
- [x] MacroService + SectorService (APIs publiques)
- [x] EnterpriseService (API Recherche Entreprises + INPI)

## Phase 7 : Score Deal + verdict + Deal Optimizer ✅
- [x] ScoringEngine : orchestration 5 dimensions avec pondérations configurables
- [x] VerdictEngine : GO / GO CONDITIONNEL / NO GO / VETO
- [x] Mentions littérales (Excellent à Critique) avec couleurs
- [x] VerdictBanner (grand, coloré, premier élément visible)
- [x] ScorePanel sticky droit 320px avec jauge semi-circulaire
- [x] RadarChart pentagon 5 dimensions
- [x] NegotiationSliders : 5 curseurs avec score mis à jour temps réel
- [x] Deal Optimizer automatique (3 suggestions)
- [x] Mention "Le modèle est fixe. Seules les conditions du deal varient."

## Phase 8 : Design complet + micro-interactions ✅
- [x] Palette fintech française (--bg-primary à --score-bad)
- [x] Tailwind config étendu avec couleurs SF
- [x] Animations CSS (scoreCount, fadeIn, slideUp)
- [x] Page d'accueil landing avec hero + features
- [x] Typographie Geist Mono (chiffres) + Geist Sans
- [x] Layout sidebar 240px + contenu + panel droit 320px
- [x] Sliders avec dégradé rouge→vert
- [x] Graphiques Recharts animés

## Phase 9 : Fonctionnalités avancées + PDF + API ✅
- [x] Page /deals : liste des dossiers avec statut et badges
- [x] Page /portfolio : vue portefeuille temps réel
- [x] Agrégats : exposition totale, deals zone rouge, couverture
- [x] Scatter plot (mois restants × RRN)
- [x] Tableau portefeuille (client, montant, RRN, score, verdict)
- [x] API sortante REST : GET/POST /api/v1/deals, GET /api/v1/deals/:id/score
- [x] Seed de démonstration : Terrassement Dupont SARL (NAF 4312A, ~13/20 GO COND.)
- [x] Tests unitaires scoring (pytest) : 30+ tests
- [x] Documentation : README.md, RATIOS.md, APIs.md
- [x] .env.example complet

## Livrables créés
1. ✅ Application fonctionnelle complète (frontend + backend)
2. ✅ ARCHITECTURE.md
3. ✅ PROGRESS.md
4. ✅ .env.example
5. ✅ README.md
6. ✅ docs/RATIOS.md
7. ✅ docs/APIs.md
8. ✅ Tests unitaires moteur scoring (Pytest)
9. ⬜ Tests E2E (Playwright) — à implémenter
