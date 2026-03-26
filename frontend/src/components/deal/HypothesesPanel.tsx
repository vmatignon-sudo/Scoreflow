'use client';

import NegotiationSliders from '@/components/deal/NegotiationSliders';
import type { Deal, DealAsset, DealScore } from '@/types/database';

type Props = { deal: Deal; asset: DealAsset | null; score: DealScore | null };

export default function HypothesesPanel({ deal, asset, score }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deal params */}
        <div className="bg-white rounded-[20px] shadow p-5">
          <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-4">Conditions du deal</h3>
          <div className="space-y-2.5 text-[13px]">
            <Row label="Montant financé" value={fmtEur(deal.montant_finance)} />
            <Row label="Apport initial" value={fmtEur(deal.apport_initial)} />
            <Row label="Durée" value={`${deal.duree_mois || '—'} mois`} />
            <Row label="Dépôt de garantie" value={fmtEur(deal.depot_garantie)} />
            <Row label="Loyer client" value={deal.loyer_mensuel_client ? `${fmtEur(deal.loyer_mensuel_client)}/mois` : '—'} />
            <Row label="Type" value={deal.type_financement?.replace('_', ' ') || '—'} />
          </div>
        </div>

        {/* Asset params */}
        <div className="bg-white rounded-[20px] shadow p-5">
          <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-4">Bien financé</h3>
          <div className="space-y-2.5 text-[13px]">
            <Row label="Catégorie" value={asset?.asset_class?.replace(/_/g, ' ') || '—'} />
            <Row label="Marque / Modèle" value={`${asset?.marque || ''} ${asset?.modele || ''}`.trim() || '—'} />
            <Row label="Année / État" value={`${asset?.annee_fabrication || '—'} / ${asset?.etat?.replace(/_/g, ' ') || '—'}`} />
            <Row label="Prix HT" value={asset?.prix_achat_ht ? fmtEur(asset.prix_achat_ht) : '—'} />
            <Row label="Traceur GPS" value={asset?.traceur_gps ? 'Oui' : 'Non'} />
            <Row label="Contrat récupération" value={asset?.contrat_recuperation ? 'Oui' : 'Non'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Refinancement */}
        <div className="bg-white rounded-[20px] shadow p-5">
          <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-4">Refinancement</h3>
          <div className="space-y-2.5 text-[13px]">
            <Row label="Taux refinancement" value={deal.taux_refinancement_banque ? `${deal.taux_refinancement_banque}%` : '—'} />
            <Row label="Loyer banque" value={deal.loyer_mensuel_banque ? `${fmtEur(deal.loyer_mensuel_banque)}/mois` : '—'} />
            <Row label="Frais dossier" value={fmtEur(deal.frais_dossier_banque)} />
          </div>
        </div>

        {/* Cotation BDF */}
        <div className="bg-white rounded-[20px] shadow p-5">
          <h3 className="text-[14px] font-semibold text-[#2d2d2d] mb-4">Cotation BDF & Dirigeant</h3>
          <div className="space-y-2.5 text-[13px]">
            <Row label="Cote activité" value={deal.cotation_bdf_activite || '—'} />
            <Row label="Cote crédit" value={deal.cotation_bdf_credit || '—'} />
            <Row label="Source" value={deal.cotation_bdf_source?.replace('_', ' ') || '—'} />
            <Row label="Indicateur dirigeant" value={deal.indicateur_dirigeant_bdf || '—'} />
            <Row label="Dirigeant" value={`${deal.dirigeant_prenom || ''} ${deal.dirigeant_nom || ''}`.trim() || '—'} />
          </div>
        </div>
      </div>

      {/* Negotiation sliders */}
      <NegotiationSliders deal={deal} score={score} />
    </div>
  );
}

function fmtEur(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} EUR`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#86868b]">{label}</span>
      <span className="font-medium text-[#2d2d2d] font-mono text-[12px]">{value}</span>
    </div>
  );
}
