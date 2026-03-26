# ScoreFlow — Architecture Technique

## Vue d'ensemble

ScoreFlow est une application SaaS multi-tenant de scoring de deals de financement.
Elle se compose de 3 couches principales :

```
┌─────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)           │
│           Vercel — App Router + TypeScript        │
├─────────────────────────────────────────────────┤
│              Supabase (PostgreSQL)                │
│     Auth + BDD + RLS + Realtime + Storage        │
├─────────────────────────────────────────────────┤
│           Backend Scoring (FastAPI)              │
│       Railway — Python 3.11 + Redis/Bull         │
└─────────────────────────────────────────────────┘
         │              │              │
    Claude API     OCR (Mistral)   APIs publiques FR
```

## Choix techniques justifiés

### Frontend : Next.js 14 App Router + TypeScript
- **Pourquoi** : SSR/SSG pour le SEO, Server Components pour réduire le JS client,
  App Router pour les layouts imbriqués (sidebar + panel droit sticky).
- **Styling** : Tailwind CSS — cohérent avec la palette fintech définie, utilitaire.
- **Charts** : Recharts — composable, animable, compatible SSR.
- **State** : Zustand pour l'état client (sliders, simulation), React Query pour le cache serveur.

### Auth + BDD : Supabase
- **Pourquoi** : PostgreSQL managé avec RLS natif = multi-tenant sans middleware custom.
  Auth intégrée (email/password + magic link). Storage pour les documents.
  Realtime pour les mises à jour de score en temps réel.
- **RLS** : Chaque table filtrée par `organization_id` via `auth.jwt() -> 'user_metadata' -> 'organization_id'`.

### Moteur Scoring : FastAPI (Python)
- **Pourquoi** : Python est le standard pour le calcul financier (numpy, pandas).
  FastAPI offre validation Pydantic, async natif, docs OpenAPI auto.
- **Séparation** : Le scoring est un microservice indépendant pour :
  - Scalabilité indépendante (scoring CPU-intensif)
  - Testabilité isolée (pytest sur les formules)
  - Futur module ML/prédictif sans toucher au frontend

### IA : Claude API (claude-sonnet-4-20250514)
- **Usage** : Extraction intelligente des devis (OCR + structuration),
  analyse des relevés bancaires, enrichissement dirigeant.
- **Pourquoi Claude** : Meilleur ratio qualité/coût pour l'extraction structurée
  de documents financiers français.

### OCR : Mistral OCR (première intention) / AWS Textract (fallback)
- **Pourquoi Mistral** : OCR français natif, bon sur les liasses fiscales DGFiP.
- **Fallback Textract** : Pour les PDFs complexes (scans de mauvaise qualité).

### Cache / Queues : Redis + Bull
- **Redis** : Cache des données macro (24h), des ratios sectoriels, des résultats API.
- **Bull** : Queue pour le parsing asynchrone des documents (liasses, relevés).

### PDF : Puppeteer
- **Pourquoi** : Rendu fidèle du rapport (9 pages) avec graphiques Recharts
  rendus côté serveur. Alternative à des libs PDF limitées en styling.

## Hébergement

| Composant | Service | Justification |
|-----------|---------|---------------|
| Frontend | Vercel | Intégration Next.js native, CDN, preview deploys |
| Backend | Railway | Container Docker, scaling auto, variables env |
| BDD | Supabase Cloud | PostgreSQL managé, RLS, Auth, Storage |
| Redis | Railway (addon) ou Upstash | Serverless Redis compatible |

## Sécurité

- AES-256 au repos (Supabase managed encryption)
- TLS 1.3 en transit (Vercel + Railway)
- RLS PostgreSQL sur toutes les tables
- Rate limiting : 100 req/min par IP (middleware Next.js + FastAPI)
- Audit logs complets
- JWT Supabase pour l'auth, JWT custom pour les liens de partage

## Structure des répertoires

```
scoreflow/
├── frontend/                 # Next.js 14 App Router
│   └── src/
│       ├── app/             # Pages (App Router)
│       ├── components/      # UI, layout, deal, scores, charts
│       ├── lib/             # Supabase client, API, utils, hooks
│       └── types/           # TypeScript types
├── backend/                  # FastAPI Python
│   └── app/
│       ├── api/             # Routes API
│       ├── core/            # Config, security
│       ├── models/          # Pydantic models
│       ├── services/        # Business logic
│       └── scoring/         # Moteur de scoring
├── supabase/                 # Schema + migrations
│   ├── migrations/          # SQL migrations
│   └── seed/                # Données de démonstration
└── docs/                     # Documentation
```
