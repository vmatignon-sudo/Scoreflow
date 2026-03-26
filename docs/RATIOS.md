# ScoreFlow — Documentation des ratios financiers

## Scores académiques

### Altman Z' (PME non cotées)
```
Z' = 0.717(FR/AT) + 0.847(RR/AT) + 3.107(EBIT/AT) + 0.420(FP/DF) + 0.998(CA/AT)
```
| Zone | Seuil | Interprétation |
|------|-------|----------------|
| Sain | Z' > 2.9 | Entreprise financièrement saine |
| Gris | 1.23 < Z' < 2.9 | Zone d'incertitude |
| Danger | Z' < 1.23 | Risque de défaillance élevé |

### Conan & Holder (PME françaises)
Calibré sur 190 PME françaises.
```
Z = 0.24(EBE/dettes) + 0.22(CP/AT) + 0.16(dispo/AT) - 0.87(FF/CA) - 0.10(charges_pers/VA)
```
| Zone | Seuil | Interprétation |
|------|-------|----------------|
| Sain | Z > 0.09 | Situation favorable |
| Attention | 0.04 < Z < 0.09 | Vigilance requise |
| Difficultés | Z < 0.04 | Difficultés probables |

## Ratios calculés

### Liquidité
| Ratio | Formule | Seuil bon | Seuil alerte |
|-------|---------|-----------|--------------|
| Générale | Actif circulant / Passif circulant | > 1.5 | < 1.0 |
| Réduite | (AC - Stocks) / PC | > 1.0 | < 0.7 |
| Immédiate | Trésorerie / PC | > 0.2 | < 0.05 |
| BFR | AC - Stocks - PC | Positif | Négatif important |
| FRNG | Capitaux permanents - Immobilisations | Positif | Négatif |
| Jours trésorerie | Trésorerie × 365 / CA | > 30j | < 10j |

### Capacité de remboursement
| Ratio | Formule | Seuil bon | Seuil alerte |
|-------|---------|-----------|--------------|
| CAF | Cash flow from operations | Positif | Négatif |
| Dette/CAF | Dettes financières / CAF | < 3 | > 6 |
| DSCR | CAF / Service de la dette | > 1.5 | < 1.0 |
| Couverture FF | EBITDA / Frais financiers | > 5 | < 2 |

### Structure financière
| Ratio | Formule | Seuil bon | Seuil alerte |
|-------|---------|-----------|--------------|
| Autonomie | Fonds propres / Passif total | > 0.30 | < 0.15 |
| Endettement | Dettes financières / FP | < 1.0 | > 2.0 |
| Gearing | (DF - Tréso) / FP | < 0.5 | > 1.5 |
| Levier | Passif total / FP | < 3 | > 5 |

### Rentabilité
| Ratio | Formule | Seuil bon | Seuil alerte |
|-------|---------|-----------|--------------|
| Marge EBITDA | EBITDA / CA | > 10% | < 3% |
| Marge nette | Résultat net / CA | > 5% | < 0% |
| ROE | RN / FP | > 10% | < 3% |
| ROA | RN / AT | > 5% | < 1% |
| ROCE | EBIT / Capitaux permanents | > 8% | < 3% |

### Activité
| Ratio | Formule | Seuil bon | Seuil alerte |
|-------|---------|-----------|--------------|
| DSO | Créances × 365 / CA | < 45j | > 90j |
| Rotation actif | CA / AT | > 1.0 | < 0.5 |

## Pondération dynamique selon durée

| Durée | Liquidité | Capacité | Structure | Rentabilité | Activité |
|-------|-----------|----------|-----------|-------------|----------|
| ≤ 24 mois | 30% | 30% | 15% | 15% | 10% |
| 25-48 mois | 15% | 25% | 25% | 20% | 15% |
| > 48 mois | 10% | 20% | 30% | 25% | 15% |

## Benchmark sectoriel

Chaque ratio est comparé aux percentiles du secteur NAF :
- **Q10** : 10% les plus faibles
- **Q25** : quartile inférieur
- **Q50** : médiane
- **Q75** : quartile supérieur
- **Q90** : 10% les meilleurs

Code couleur :
- 🔴 < Q25
- 🟠 Q25-Q50
- 🟢 > Q50
- 🔵 > Q75

Source : API ratios_inpi_bce_sectors (data.economie.gouv.fr)
