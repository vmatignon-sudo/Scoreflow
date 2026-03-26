'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import VerdictBanner from '@/components/scores/VerdictBanner';
import ScorePanel from '@/components/scores/ScorePanel';
import RadarChart from '@/components/charts/RadarChart';
import SimulatorPanel from '@/components/simulator/SimulatorPanel';
import RiskCurveChart from '@/components/charts/RiskCurveChart';
import NegotiationSliders from '@/components/deal/NegotiationSliders';
import type { Deal, DealAsset, DealScore } from '@/types/database';

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [asset, setAsset] = useState<DealAsset | null>(null);
  const [score, setScore] = useState<DealScore | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'simulator' | 'risk' | 'director'>('overview');
  const supabase = createClient();

  useEffect(() => {
    async function fetchDeal() {
      const { data: dealData } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();
      if (dealData) setDeal(dealData);

      const { data: assetData } = await supabase
        .from('deal_assets')
        .select('*')
        .eq('deal_id', dealId)
        .single();
      if (assetData) setAsset(assetData);

      const { data: scoreData } = await supabase
        .from('deal_scores')
        .select('*')
        .eq('deal_id', dealId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .single();
      if (scoreData) setScore(scoreData);
    }
    fetchDeal();
  }, [dealId, supabase]);

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <Sidebar />
        <main className="ml-[240px] p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#EEF0F5] rounded w-1/3" />
            <div className="h-4 bg-[#EEF0F5] rounded w-1/4" />
            <div className="h-64 bg-[#EEF0F5] rounded" />
          </div>
        </main>
      </div>
    );
  }

  const TABS = [
    { id: 'overview' as const, label: 'Vue d\'ensemble' },
    { id: 'financial' as const, label: 'Financier' },
    { id: 'simulator' as const, label: 'Simulateur' },
    { id: 'risk' as const, label: 'Risque & Couverture' },
    { id: 'director' as const, label: 'Dirigeant' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      <main className="ml-[240px] mr-[320px] min-h-screen">
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0F1923]">{deal.raison_sociale}</h1>
            <p className="text-[#4A5568] mt-1">
              {deal.siren} - {deal.secteur_label} - {deal.type_financement?.replace('_', ' ')}
            </p>
          </div>

          {/* Verdict banner */}
          <VerdictBanner score={score} />

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-[#E2E8F0]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#1B4FD8] text-[#1B4FD8]'
                    : 'border-transparent text-[#4A5568] hover:text-[#0F1923]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score radar */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                <h3 className="font-semibold text-[#0F1923] mb-4">Score par dimension</h3>
                <RadarChart score={score} />
              </div>

              {/* Deal summary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                  <h3 className="font-semibold text-[#0F1923] mb-4">Conditions du deal</h3>
                  <div className="space-y-3 text-sm">
                    <Row label="Montant financé" value={`${deal.montant_finance?.toLocaleString('fr-FR')} EUR`} />
                    <Row label="Apport initial" value={`${deal.apport_initial.toLocaleString('fr-FR')} EUR`} />
                    <Row label="Durée" value={`${deal.duree_mois} mois`} />
                    <Row label="Loyer client" value={deal.loyer_mensuel_client ? `${deal.loyer_mensuel_client.toLocaleString('fr-FR')} EUR/mois` : '—'} />
                    <Row label="Dépôt de garantie" value={`${deal.depot_garantie.toLocaleString('fr-FR')} EUR`} />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                  <h3 className="font-semibold text-[#0F1923] mb-4">Bien financé</h3>
                  <div className="space-y-3 text-sm">
                    <Row label="Catégorie" value={asset?.asset_class?.replace(/_/g, ' ') || '—'} />
                    <Row label="Marque / Modèle" value={`${asset?.marque || ''} ${asset?.modele || ''}`.trim() || '—'} />
                    <Row label="Année" value={asset?.annee_fabrication?.toString() || '—'} />
                    <Row label="État" value={asset?.etat?.replace(/_/g, ' ') || '—'} />
                    <Row label="Prix HT" value={asset?.prix_achat_ht ? `${asset.prix_achat_ht.toLocaleString('fr-FR')} EUR` : '—'} />
                    <Row label="Traceur GPS" value={asset?.traceur_gps ? 'Oui' : 'Non'} />
                  </div>
                </div>
              </div>

              {/* Negotiation sliders */}
              <NegotiationSliders deal={deal} score={score} />
            </div>
          )}

          {activeTab === 'simulator' && (
            <SimulatorPanel deal={deal} asset={asset} />
          )}

          {activeTab === 'risk' && (
            <RiskCurveChart deal={deal} asset={asset} />
          )}

          {activeTab === 'financial' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <h3 className="font-semibold text-[#0F1923] mb-4">Analyse financière</h3>
              <p className="text-[#4A5568] text-sm">
                Les ratios financiers seront disponibles après le parsing des liasses fiscales.
              </p>
            </div>
          )}

          {activeTab === 'director' && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
              <h3 className="font-semibold text-[#0F1923] mb-4">Analyse dirigeant</h3>
              <div className="space-y-3 text-sm">
                <Row label="Dirigeant" value={`${deal.dirigeant_prenom} ${deal.dirigeant_nom}`} />
                <Row label="Nommé depuis" value={deal.jours_depuis_nomination ? `${deal.jours_depuis_nomination} jours` : '—'} />
                <Row label="Changement récent" value={deal.changement_dirigeant_recent ? 'Oui' : 'Non'} />
                {deal.cotation_bdf_credit && (
                  <Row label="Cotation BDF" value={`${deal.cotation_bdf_activite}${deal.cotation_bdf_credit} (${deal.cotation_bdf_source})`} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right panel — Score Deal sticky */}
      <ScorePanel deal={deal} score={score} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#8A95A3]">{label}</span>
      <span className="font-medium text-[#0F1923]">{value}</span>
    </div>
  );
}
