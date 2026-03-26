'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import VerdictBanner from '@/components/scores/VerdictBanner';
import ScorePanel from '@/components/scores/ScorePanel';
import RadarChart from '@/components/charts/RadarChart';
import SimulatorPanel from '@/components/simulator/SimulatorPanel';
import RiskCurveChart from '@/components/charts/RiskCurveChart';
import NegotiationSliders from '@/components/deal/NegotiationSliders';
import FinancialTab from '@/components/deal/FinancialTab';
import { LayoutGrid, BarChart3, Zap, ShieldAlert, User, Trash2 } from 'lucide-react';
import type { Deal, DealAsset, DealScore } from '@/types/database';

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [asset, setAsset] = useState<DealAsset | null>(null);
  const [score, setScore] = useState<DealScore | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'simulator' | 'risk' | 'director'>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchDeal() {
      const { data: dealData } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .maybeSingle();
      if (dealData) setDeal(dealData);

      const { data: assetData } = await supabase
        .from('deal_assets')
        .select('*')
        .eq('deal_id', dealId)
        .maybeSingle();
      if (assetData) setAsset(assetData);

      const { data: scoreData } = await supabase
        .from('deal_scores')
        .select('*')
        .eq('deal_id', dealId)
        .order('computed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (scoreData) setScore(scoreData);
    }
    fetchDeal();
  }, [dealId, supabase]);

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <Sidebar />
        <main className="ml-[240px] p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#f5f5f7] rounded w-1/3" />
            <div className="h-4 bg-[#f5f5f7] rounded w-1/4" />
            <div className="h-64 bg-[#f5f5f7] rounded" />
          </div>
        </main>
      </div>
    );
  }

  const TABS = [
    { id: 'overview' as const, label: 'Vue d\'ensemble', icon: LayoutGrid },
    { id: 'financial' as const, label: 'Financier', icon: BarChart3 },
    { id: 'simulator' as const, label: 'Simulateur', icon: Zap },
    { id: 'risk' as const, label: 'Risque', icon: ShieldAlert },
    { id: 'director' as const, label: 'Dirigeant', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Sidebar />
      <main className="ml-0 sm:ml-[260px] lg:mr-[300px] min-h-screen">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1d1d1f]">{deal.raison_sociale}</h1>
              <p className="text-[#6e6e73] mt-1">
                {deal.siren} - {deal.secteur_label} - {deal.type_financement?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] text-[#86868b] hover:text-[#c4342d] hover:bg-[#c4342d]/[0.06] rounded-[10px] transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
              Supprimer
            </button>
          </div>

          {/* Delete confirmation modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-[#2d2d2d] mb-2">
                  Supprimer ce dossier ?
                </h3>
                <p className="text-sm text-[#6e6e73] mb-1">
                  <strong>{deal.raison_sociale}</strong> ({deal.siren})
                </p>
                <p className="text-sm text-[#a1a1a6] mb-6">
                  Cette action est irréversible. Toutes les données associées (scores, documents, simulations) seront supprimées.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 py-2.5 border border-black/[0.04] text-[#6e6e73] rounded-lg font-medium hover:bg-[#f5f5f7] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      setDeleting(true);
                      const { error } = await supabase
                        .from('deals')
                        .delete()
                        .eq('id', dealId);
                      if (!error) {
                        router.push('/deals');
                      } else {
                        console.error('Delete error:', error);
                        setDeleting(false);
                        setShowDeleteConfirm(false);
                      }
                    }}
                    disabled={deleting}
                    className="flex-1 py-2.5 bg-[#DC2626] text-white rounded-lg font-medium hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Suppression...' : 'Supprimer définitivement'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Verdict banner */}
          <VerdictBanner score={score} />

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white rounded-[14px] shadow-sm p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#1d1d1f] text-white shadow-sm'
                      : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.03]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score radar */}
              <div className="bg-white rounded-[20px] shadow p-6">
                <h3 className="font-semibold text-[#2d2d2d] mb-4">Score par dimension</h3>
                <RadarChart score={score} />
              </div>

              {/* Deal summary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-[20px] shadow p-6">
                  <h3 className="font-semibold text-[#2d2d2d] mb-4">Conditions du deal</h3>
                  <div className="space-y-3 text-sm">
                    <Row label="Montant financé" value={`${deal.montant_finance?.toLocaleString('fr-FR')} EUR`} />
                    <Row label="Apport initial" value={`${deal.apport_initial.toLocaleString('fr-FR')} EUR`} />
                    <Row label="Durée" value={`${deal.duree_mois} mois`} />
                    <Row label="Loyer client" value={deal.loyer_mensuel_client ? `${deal.loyer_mensuel_client.toLocaleString('fr-FR')} EUR/mois` : '—'} />
                    <Row label="Dépôt de garantie" value={`${deal.depot_garantie.toLocaleString('fr-FR')} EUR`} />
                  </div>
                </div>
                <div className="bg-white rounded-[20px] shadow p-6">
                  <h3 className="font-semibold text-[#2d2d2d] mb-4">Bien financé</h3>
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
            <FinancialTab dealId={dealId} organizationId={deal.organization_id} />
          )}

          {activeTab === 'director' && (
            <div className="bg-white rounded-[20px] shadow p-6">
              <h3 className="font-semibold text-[#2d2d2d] mb-4">Analyse dirigeant</h3>
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
      <ScorePanel score={score} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#a1a1a6]">{label}</span>
      <span className="font-medium text-[#424245]">{value}</span>
    </div>
  );
}
