# ScoreFlow — APIs utilisées

## APIs entreprises (gratuites, officielles)

### API Recherche Entreprises (INSEE + INPI)
- **URL** : `https://recherche-entreprises.api.gouv.fr/search`
- **Usage** : Enrichissement automatique dès saisie SIREN
- **Données** : Raison sociale, NAF, dirigeants, adresse, statut
- **Auth** : Aucune
- **Rate limit** : 200 req/min

### API SIRENE (INSEE)
- **URL** : `https://api.insee.fr/entreprises/sirene/V3/`
- **Usage** : Données de base, mises à jour quotidiennes
- **Auth** : Clé API (inscription portail-api.insee.fr)

### API INPI / RNE — Documents et comptes
- **URL** : `https://data.inpi.fr/api/`
- **Usage** : Liasses fiscales déposées, comptes annuels
- **Auth** : Compte gratuit (data.inpi.fr)

### API BODACC
- **URL** : `https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/`
- **Usage** : Procédures collectives, créations, radiations
- **Auth** : Aucune

### API Open Data URSSAF
- **URL** : `https://open.urssaf.fr/`
- **Usage** : Données sectorielles cotisations

## APIs données financières

### API Ratios par SIREN (INPI/BCE)
- **URL** : `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/ratios_inpi_bce/records`
- **Params** : `?where=siren="XXXXXXXXX"`
- **Usage** : Vérification croisée des ratios calculés
- **Auth** : Aucune (open data)

### API Ratios Sectoriels (INPI/BCE)
- **URL** : `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/ratios_inpi_bce_sectors/records`
- **Params** : `?where=naf="XXXX"`
- **Usage** : Percentiles Q10/Q25/Q50/Q75/Q90 par secteur
- **Auth** : Aucune (open data)

## APIs macro

### API INSEE Melodi
- **URL** : `https://api.insee.fr/melodi/data/`
- **Usage** : PIB, inflation, indices de production
- **Auth** : Clé API INSEE

### Banque de France stats
- **URL** : `https://webstat.banque-france.fr/api/`
- **Usage** : Taux directeur, conditions de crédit
- **Auth** : Aucune (open data)

### Eurostat
- **URL** : `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/`
- **Usage** : PMI zone euro, indicateurs macro
- **Auth** : Aucune

## APIs scoring / IA

### Claude API (Anthropic)
- **Modèle** : claude-sonnet-4-20250514
- **Usage** : Extraction devis, analyse relevés bancaires, enrichissement
- **Auth** : Clé API Anthropic

### Mistral OCR
- **Usage** : OCR documents français (liasses, relevés)
- **Auth** : Clé API Mistral

## Référence méthodologique

### Projet Signaux Faibles
- **URL** : `https://github.com/signaux-faibles/`
- **Usage** : Modèle prédictif défaillance 18 mois (référence)
- **Variables** : URSSAF, activité partielle, BDF, financier

## Notes légales

- Ne JAMAIS accéder à FIBEN directement (art. L144-1 CMF)
- Cotation BDF : saisie manuelle, Infonet, ou fournie par prospect
- Les données ratios_inpi_bce sont OPEN DATA légales (distinct de FIBEN)
