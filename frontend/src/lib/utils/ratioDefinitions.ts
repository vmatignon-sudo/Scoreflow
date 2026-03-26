export type RatioInfo = {
  label: string;
  definition: string;
  formula?: string;
  source?: string;
};

export const RATIO_DEFINITIONS: Record<string, RatioInfo> = {
  // Liquidité
  liquidite_generale: {
    label: 'Liquidité générale',
    definition: 'Capacité de l\'entreprise à couvrir ses dettes à court terme avec ses actifs courants. Un ratio > 1.5 est considéré sain.',
    formula: 'Actif circulant / Passif circulant',
    source: 'Calculé depuis la liasse fiscale (bilan actif/passif)',
  },
  liquidite_reduite: {
    label: 'Liquidité réduite',
    definition: 'Mesure la capacité à rembourser les dettes court terme sans compter les stocks (moins liquides).',
    formula: '(Actif circulant − Stocks) / Passif circulant',
    source: 'Calculé depuis la liasse fiscale (bilan)',
  },
  liquidite_immediate: {
    label: 'Liquidité immédiate',
    definition: 'Mesure la capacité à rembourser immédiatement les dettes court terme avec la trésorerie disponible.',
    formula: 'Trésorerie / Passif circulant',
    source: 'Calculé depuis la liasse fiscale (bilan)',
  },
  bfr: {
    label: 'BFR',
    definition: 'Besoin en Fonds de Roulement : montant que l\'entreprise doit financer pour couvrir le décalage entre encaissements et décaissements.',
    formula: 'Actif circulant − Stocks − Passif circulant',
    source: 'Calculé depuis la liasse fiscale (bilan)',
  },
  frng: {
    label: 'FRNG',
    definition: 'Fonds de Roulement Net Global : excédent des ressources stables sur les emplois stables. Doit être positif pour financer le BFR.',
    formula: 'Capitaux permanents − Actif immobilisé',
    source: 'Calculé depuis la liasse fiscale (bilan)',
  },
  tresorerie_nette: {
    label: 'Trésorerie nette',
    definition: 'Différence entre le FRNG et le BFR. Indique si l\'entreprise dispose d\'un excédent ou d\'un déficit de trésorerie.',
    formula: 'FRNG − BFR',
    source: 'Calculé depuis la liasse fiscale (bilan)',
  },
  jours_tresorerie: {
    label: 'Jours de trésorerie',
    definition: 'Nombre de jours de chiffre d\'affaires que l\'entreprise peut financer avec sa trésorerie disponible.',
    formula: '(Trésorerie × 365) / Chiffre d\'affaires',
    source: 'Calculé depuis la liasse fiscale',
  },

  // Capacité
  caf: {
    label: 'CAF',
    definition: 'Capacité d\'Autofinancement : flux de trésorerie potentiel généré par l\'activité, avant investissements et remboursements.',
    formula: 'Résultat net + Dotations aux amortissements − Reprises',
    source: 'Calculé depuis la liasse fiscale (compte de résultat)',
  },
  dette_sur_caf: {
    label: 'Dette / CAF',
    definition: 'Nombre d\'années nécessaires pour rembourser l\'endettement financier avec la CAF. < 3 ans est sain, > 6 ans est préoccupant.',
    formula: 'Dettes financières / CAF',
    source: 'Calculé depuis la liasse fiscale',
  },
  dscr: {
    label: 'DSCR',
    definition: 'Debt Service Coverage Ratio : capacité à assurer le service de la dette. > 1.2 signifie que l\'entreprise génère plus qu\'elle ne doit rembourser.',
    formula: 'CAF / Dettes financières',
    source: 'Calculé depuis la liasse fiscale',
  },
  couverture_ff: {
    label: 'Couverture frais financiers',
    definition: 'Nombre de fois que le résultat d\'exploitation couvre les charges d\'intérêt. Plus c\'est élevé, moins le poids de la dette pèse.',
    formula: 'EBITDA / Frais financiers',
    source: 'Calculé depuis la liasse fiscale (compte de résultat)',
  },

  // Structure
  autonomie_financiere: {
    label: 'Autonomie financière',
    definition: 'Part des fonds propres dans le financement total. Plus c\'est élevé, moins l\'entreprise dépend des créanciers. > 30% est considéré sain.',
    formula: 'Fonds propres / Passif total',
    source: 'Calculé depuis la liasse fiscale (bilan passif)',
  },
  endettement: {
    label: 'Endettement',
    definition: 'Rapport entre la dette financière et les fonds propres. Un ratio > 2 indique une forte dépendance aux financements externes.',
    formula: 'Dettes financières / Fonds propres',
    source: 'Calculé depuis la liasse fiscale (bilan passif)',
  },
  gearing: {
    label: 'Gearing',
    definition: 'Endettement net rapporté aux fonds propres. Tient compte de la trésorerie disponible pour relativiser la dette.',
    formula: '(Dettes financières − Trésorerie) / Fonds propres',
    source: 'Calculé depuis la liasse fiscale (bilan)',
  },
  levier: {
    label: 'Levier financier',
    definition: 'Rapport entre le total du bilan et les fonds propres. Mesure l\'effet de levier de la structure financière.',
    formula: 'Passif total / Fonds propres',
    source: 'Calculé depuis la liasse fiscale (bilan)',
  },

  // Rentabilité
  marge_ebitda: {
    label: 'Marge EBITDA',
    definition: 'Part du chiffre d\'affaires conservée après les charges d\'exploitation (hors amortissements et charges financières). Indicateur clé de la rentabilité opérationnelle.',
    formula: 'EBITDA / Chiffre d\'affaires × 100',
    source: 'Calculé depuis la liasse fiscale (compte de résultat)',
  },
  marge_ebit: {
    label: 'Marge EBIT',
    definition: 'Marge opérationnelle après amortissements. Reflète la rentabilité de l\'activité principale.',
    formula: 'EBIT / Chiffre d\'affaires × 100',
    source: 'Calculé depuis la liasse fiscale (compte de résultat)',
  },
  marge_nette: {
    label: 'Marge nette',
    definition: 'Part du chiffre d\'affaires conservée en bénéfice net après toutes les charges. Indicateur de rentabilité globale.',
    formula: 'Résultat net / Chiffre d\'affaires × 100',
    source: 'Calculé depuis la liasse fiscale (compte de résultat)',
  },
  roe: {
    label: 'ROE',
    definition: 'Return on Equity : rendement des capitaux investis par les actionnaires. Mesure l\'efficacité de l\'utilisation des fonds propres.',
    formula: 'Résultat net / Fonds propres × 100',
    source: 'Calculé depuis la liasse fiscale',
  },
  roa: {
    label: 'ROA',
    definition: 'Return on Assets : rendement de l\'ensemble des actifs. Mesure l\'efficacité globale de l\'entreprise à générer du profit.',
    formula: 'Résultat net / Actif total × 100',
    source: 'Calculé depuis la liasse fiscale',
  },
  roce: {
    label: 'ROCE',
    definition: 'Return on Capital Employed : rentabilité des capitaux engagés (propres + dettes long terme). Indicateur stratégique pour les investisseurs.',
    formula: 'EBIT / Capitaux permanents × 100',
    source: 'Calculé depuis la liasse fiscale',
  },

  // Activité
  dso: {
    label: 'DSO (jours)',
    definition: 'Days Sales Outstanding : délai moyen de paiement des clients en jours. < 45j est bon, > 90j est préoccupant.',
    formula: '(Créances clients × 365) / Chiffre d\'affaires',
    source: 'Calculé depuis la liasse fiscale (bilan + compte de résultat)',
  },
  dpo: {
    label: 'DPO (jours)',
    definition: 'Days Payable Outstanding : délai moyen de règlement aux fournisseurs en jours.',
    formula: '(Passif circulant × 365) / Chiffre d\'affaires',
    source: 'Calculé depuis la liasse fiscale',
  },
  ccc: {
    label: 'CCC (jours)',
    definition: 'Cash Conversion Cycle : durée entre le paiement des fournisseurs et l\'encaissement des clients. Plus c\'est court, mieux c\'est.',
    formula: 'DSO + DIO − DPO',
    source: 'Calculé depuis la liasse fiscale',
  },
  rotation_actif: {
    label: 'Rotation de l\'actif',
    definition: 'Efficacité de l\'utilisation des actifs pour générer du chiffre d\'affaires. > 1 signifie que chaque euro d\'actif génère plus d\'1€ de CA.',
    formula: 'Chiffre d\'affaires / Actif total',
    source: 'Calculé depuis la liasse fiscale',
  },

  // Scores académiques
  altman_z: {
    label: 'Altman Z\'',
    definition: 'Score de prédiction de faillite développé par Edward Altman, adapté aux PME non cotées. Combine 5 ratios financiers.',
    formula: '0.717(FR/AT) + 0.847(RR/AT) + 3.107(EBIT/AT) + 0.420(FP/DF) + 0.998(CA/AT)',
    source: 'Modèle académique — calculé depuis la liasse fiscale',
  },
  conan_holder: {
    label: 'Conan & Holder',
    definition: 'Score de détection des difficultés calibré sur 190 PME françaises. Plus adapté au tissu économique français que le Z\' d\'Altman.',
    formula: '0.24(EBE/dettes) + 0.22(CP/AT) + 0.16(dispo/AT) − 0.87(FF/CA) − 0.10(pers/VA)',
    source: 'Modèle académique français — calculé depuis la liasse fiscale',
  },

  // Predictive
  probability_18m: {
    label: 'Probabilité de défaillance',
    definition: 'Probabilité estimée que l\'entreprise fasse défaut dans les 18 prochains mois. Modèle inspiré du projet Signaux Faibles.',
    formula: 'Régression logistique sur 13 variables (ratios, inscriptions, secteur)',
    source: 'Modèle ScoreFlow inspiré Signaux Faibles — données liasse + BODACC + INSEE',
  },
};
