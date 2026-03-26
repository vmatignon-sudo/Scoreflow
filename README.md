# ScoreFlow

Scoring de deals de financement — analyse composite sur 5 dimensions.

ScoreFlow note le **deal**, pas le client. Un client fragile + matériel qui s'apprécie = deal acceptable. Un excellent client + matériel qui s'effondre = deal risqué.

## Stack

- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts
- **Auth + BDD** : Supabase (PostgreSQL + RLS)
- **Moteur scoring** : FastAPI (Python)
- **IA** : Claude API (claude-sonnet-4-20250514)
- **OCR** : Mistral OCR

## Installation locale

### Prérequis

- Node.js 18+
- Python 3.11+
- Compte Supabase (gratuit)

### Frontend

```bash
cd frontend
cp ../.env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
# Remplir les variables
uvicorn app.main:app --reload
```

### Base de données

1. Créer un projet Supabase
2. Exécuter `supabase/migrations/001_initial_schema.sql` dans l'éditeur SQL
3. (Optionnel) Charger les données de démo : `supabase/seed/demo_data.sql`

### Tests

```bash
cd backend
pytest tests/ -v
```

## Architecture

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour les choix techniques détaillés.

## APIs publiques utilisées

Voir [docs/APIs.md](docs/APIs.md) pour la liste complète.

## Documentation ratios

Voir [docs/RATIOS.md](docs/RATIOS.md) pour les formules et seuils.

## API sortante

```
GET  /api/v1/deals          — Liste des deals
POST /api/v1/deals          — Créer un deal
GET  /api/v1/deals/:id/score — Score d'un deal
```

## Scoring : 5 dimensions /20

| Dimension | Poids par défaut | Sources |
|-----------|-----------------|---------|
| Macro + Sectoriel | 20% | INSEE, BDF, Eurostat, BODACC |
| Financier | 30% | Liasses fiscales, Altman Z', Conan & Holder |
| Matériel | 30% | 14 classes d'actifs, dépréciation, récupérabilité |
| Dirigeant | 20% | INPI, BODACC, sûretés mobilières |

### Verdicts

- **GO** : Score >= 14/20
- **GO CONDITIONNEL** : 10-13/20
- **NO GO** : < 10/20
- **VETO** : Conditions bloquantes (indépendant du score)

## Licence

Propriétaire.
