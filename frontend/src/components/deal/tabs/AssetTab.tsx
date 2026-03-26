'use client';

import ScoreExplainer from '@/components/ui/ScoreExplainer';
import RiskCurveChart from '@/components/charts/RiskCurveChart';
import type { Deal, DealAsset } from '@/types/database';

type Props = { deal: Deal; asset: DealAsset | null };

const RECUP_LABELS: Record<string, string> = {
  vehicule_leger: 'Véhicule léger', vehicule_utilitaire: 'Véhicule utilitaire',
  vehicule_luxe_collection: 'Luxe / Collection', engin_tp: 'Engin TP',
  machine_industrielle: 'Machine industrielle', materiel_agricole: 'Matériel agricole',
  vehicule_pl_transport: 'PL / Transport', levage_manutention: 'Levage / Manutention',
  echafaudage_coffrage: 'Échafaudage', materiel_medical: 'Matériel médical',
  informatique_bureautique: 'Informatique', materiel_restauration: 'Restauration',
  energie_environnement: 'Énergie / Environnement', autre: 'Autre',
};

export default function AssetTab({ deal, asset }: Props) {
  const signals = [];

  if (asset) {
    // Coefficient récupérabilité
    const coeff = asset.coefficient_recuperabilite;
    if (coeff !== null) {
      if (coeff >= 0.80)
        signals.push({ text: `Coefficient de récupérabilité élevé (${(coeff * 100).toFixed(0)}%)`, type: 'positive' as const });
      else if (coeff >= 0.60)
        signals.push({ text: `Coefficient de récupérabilité correct (${(coeff * 100).toFixed(0)}%)`, type: 'warning' as const });
      else
        signals.push({ text: `Coefficient de récupérabilité faible (${(coeff * 100).toFixed(0)}%)`, type: 'negative' as const });
    }

    // GPS
    if (asset.traceur_gps)
      signals.push({ text: 'Traceur GPS installé — améliore la récupérabilité (+15%)', type: 'positive' as const });
    else
      signals.push({ text: 'Pas de traceur GPS — récupérabilité réduite', type: 'warning' as const });

    // Contrat récupérateur
    if (asset.contrat_recuperation)
      signals.push({ text: 'Contrat récupérateur actif (+5%)', type: 'positive' as const });

    // Dépréciation
    const depre = asset.taux_depreciation_annuel;
    if (depre !== null) {
      if (depre <= 0.08)
        signals.push({ text: `Dépréciation faible (${(depre * 100).toFixed(0)}%/an) — valeur bien conservée`, type: 'positive' as const });
      else if (depre >= 0.25)
        signals.push({ text: `Dépréciation rapide (${(depre * 100).toFixed(0)}%/an) — perte de valeur importante`, type: 'negative' as const });
    }

    // LTV
    if (deal.montant_finance && asset.prix_achat_ht) {
      const ltv = deal.montant_finance / asset.prix_achat_ht;
      if (ltv > 1)
        signals.push({ text: `LTV > 100% (${(ltv * 100).toFixed(0)}%) — financement supérieur à la valeur du bien`, type: 'negative' as const });
      else if (ltv <= 0.7)
        signals.push({ text: `LTV favorable (${(ltv * 100).toFixed(0)}%) — bonne couverture`, type: 'positive' as const });
    }

    // ESG
    if (asset.asset_class === 'energie_environnement')
      signals.push({ text: 'Deal Vert — bonus ESG applicable', type: 'positive' as const });
  } else {
    signals.push({ text: 'Aucun bien financé renseigné', type: 'warning' as const });
  }

  return (
    <div className="space-y-6">
      <ScoreExplainer score={null} label="Évaluation du bien financé" signals={signals} />

      {/* Asset details */}
      {asset && (
        <div className="bg-white rounded-[20px] shadow p-6">
          <h3 className="text-[15px] font-semibold text-[#2d2d2d] mb-4">Détails du bien</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Metric label="Catégorie" value={RECUP_LABELS[asset.asset_class] || asset.asset_class} />
            <Metric label="Marque / Modèle" value={`${asset.marque || ''} ${asset.modele || ''}`.trim() || '—'} />
            <Metric label="Année" value={asset.annee_fabrication?.toString() || '—'} />
            <Metric label="État" value={asset.etat?.replace(/_/g, ' ') || '—'} />
            <Metric label="Km / Heures" value={asset.kilometrage ? `${asset.kilometrage.toLocaleString('fr-FR')} km` : asset.heures_moteur ? `${asset.heures_moteur.toLocaleString('fr-FR')} h` : '—'} />
            <Metric label="Prix HT" value={asset.prix_achat_ht ? `${asset.prix_achat_ht.toLocaleString('fr-FR')} EUR` : '—'} />
            <Metric label="Traceur GPS" value={asset.traceur_gps ? 'Oui' : 'Non'} />
            <Metric label="Contrat récupération" value={asset.contrat_recuperation ? 'Oui' : 'Non'} />
            <Metric label="Coeff. récupérabilité" value={asset.coefficient_recuperabilite ? `${(asset.coefficient_recuperabilite * 100).toFixed(0)}%` : '—'} />
          </div>
        </div>
      )}

      {/* Risk curve */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h3 className="text-[15px] font-semibold text-[#2d2d2d] mb-4">Courbe de Risque Résiduel Net</h3>
        <RiskCurveChart deal={deal} asset={asset} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f5f5f7] rounded-[14px] p-4">
      <p className="text-[11px] text-[#86868b] mb-1">{label}</p>
      <p className="text-[14px] font-medium text-[#2d2d2d]">{value}</p>
    </div>
  );
}
