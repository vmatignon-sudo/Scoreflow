'use client';

import RadarChart from '@/components/charts/RadarChart';
import NegotiationSliders from '@/components/deal/NegotiationSliders';
import VerdictBanner from '@/components/scores/VerdictBanner';
import type { Deal, DealAsset, DealScore } from '@/types/database';

type Props = { deal: Deal; asset: DealAsset | null; score: DealScore | null };

export default function OverviewTab({ deal, asset, score }: Props) {
  return (
    <div className="space-y-6">
      <VerdictBanner score={score} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        <div className="bg-white rounded-[20px] shadow p-6">
          <h3 className="text-[15px] font-semibold text-[#2d2d2d] mb-4">Score par dimension</h3>
          <RadarChart score={score} />
        </div>

        {/* Deal conditions */}
        <div className="bg-white rounded-[20px] shadow p-6">
          <h3 className="text-[15px] font-semibold text-[#2d2d2d] mb-4">Conditions du deal</h3>
          <div className="space-y-3 text-[13px]">
            <Row label="Montant financé" value={fmt(deal.montant_finance)} />
            <Row label="Apport initial" value={fmt(deal.apport_initial)} />
            <Row label="Durée" value={`${deal.duree_mois} mois`} />
            <Row label="Loyer client" value={deal.loyer_mensuel_client ? `${fmt(deal.loyer_mensuel_client)}/mois` : '—'} />
            <Row label="Dépôt de garantie" value={fmt(deal.depot_garantie)} />
            <div className="border-t border-black/[0.04] pt-3 mt-3" />
            <Row label="Bien" value={`${asset?.marque || ''} ${asset?.modele || ''}`.trim() || '—'} />
            <Row label="Catégorie" value={asset?.asset_class?.replace(/_/g, ' ') || '—'} />
            <Row label="Année / État" value={`${asset?.annee_fabrication || '—'} / ${asset?.etat?.replace(/_/g, ' ') || '—'}`} />
            <Row label="Prix HT" value={asset?.prix_achat_ht ? fmt(asset.prix_achat_ht) : '—'} />
          </div>
        </div>
      </div>

      <NegotiationSliders deal={deal} score={score} />
    </div>
  );
}

function fmt(v: number | null | undefined): string {
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
