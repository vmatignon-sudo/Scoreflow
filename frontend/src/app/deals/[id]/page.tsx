'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import ScorePanel from '@/components/scores/ScorePanel';
import OverviewTab from '@/components/deal/tabs/OverviewTab';
import MacroSectorTab from '@/components/deal/tabs/MacroSectorTab';
import FinancialTab from '@/components/deal/FinancialTab';
import AssetTab from '@/components/deal/tabs/AssetTab';
import DirectorTab from '@/components/deal/tabs/DirectorTab';
import SimulatorPanel from '@/components/simulator/SimulatorPanel';
import {
  LayoutGrid, Globe, BarChart3, Truck, User, Zap, Trash2,
} from 'lucide-react';
import type { Deal, DealAsset, DealScore } from '@/types/database';

type TabId = 'overview' | 'macro' | 'financial' | 'asset' | 'director' | 'simulator';

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutGrid },
  { id: 'macro', label: 'Macro & Sectoriel', icon: Globe },
  { id: 'financial', label: 'Financier', icon: BarChart3 },
  { id: 'asset', label: 'Matériel', icon: Truck },
  { id: 'director', label: 'Dirigeant', icon: User },
  { id: 'simulator', label: 'Simulateur', icon: Zap },
];

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [asset, setAsset] = useState<DealAsset | null>(null);
  const [score, setScore] = useState<DealScore | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchDeal() {
      const { data: d } = await supabase.from('deals').select('*').eq('id', dealId).maybeSingle();
      if (d) setDeal(d);
      const { data: a } = await supabase.from('deal_assets').select('*').eq('deal_id', dealId).maybeSingle();
      if (a) setAsset(a);
      const { data: s } = await supabase.from('deal_scores').select('*').eq('deal_id', dealId).order('computed_at', { ascending: false }).limit(1).maybeSingle();
      if (s) setScore(s);
    }
    fetchDeal();
  }, [dealId, supabase]);

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <Sidebar />
        <main className="sm:ml-[240px] p-8">
          <div className="animate-pulse space-y-4 max-w-3xl">
            <div className="h-8 bg-white/60 rounded-[12px] w-1/3" />
            <div className="h-4 bg-white/60 rounded-[12px] w-1/2" />
            <div className="h-64 bg-white/60 rounded-[20px]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Sidebar />
      <main className="sm:ml-[240px] lg:mr-[300px] min-h-screen">
        <div className="p-5 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#1d1d1f] tracking-tight">{deal.raison_sociale}</h1>
              <p className="text-[13px] text-[#6e6e73] mt-0.5">
                {deal.siren} — {deal.secteur_label} — {deal.type_financement?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-[#86868b] hover:text-[#c4342d] hover:bg-[#c4342d]/[0.06] rounded-[10px] transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          </div>

          {/* Delete modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-[20px] p-6 max-w-sm w-full shadow-xl animate-scale-in">
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Supprimer ce dossier ?</h3>
                <p className="text-[13px] text-[#6e6e73] mb-5">
                  <strong>{deal.raison_sociale}</strong> — cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                    className="flex-1 py-2 bg-[#f5f5f7] text-[#424245] rounded-[12px] text-[13px] font-medium hover:bg-[#ededf0] transition-all">
                    Annuler
                  </button>
                  <button disabled={deleting} onClick={async () => {
                    setDeleting(true);
                    const { error } = await supabase.from('deals').delete().eq('id', dealId);
                    if (!error) router.push('/deals');
                    else { setDeleting(false); setShowDeleteConfirm(false); }
                  }}
                    className="flex-1 py-2 bg-[#c4342d] text-white rounded-[12px] text-[13px] font-medium hover:bg-[#a52a24] transition-all disabled:opacity-50">
                    {deleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex gap-1 mb-6 bg-white rounded-[14px] shadow-sm p-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-[10px] text-[12px] sm:text-[13px] font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#1e40af] text-white shadow-sm'
                      : 'text-[#6e6e73] hover:text-[#2d2d2d] hover:bg-black/[0.03]'
                  }`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {activeTab === 'overview' && <OverviewTab deal={deal} asset={asset} score={score} />}
          {activeTab === 'macro' && <MacroSectorTab dealId={dealId} score={score} />}
          {activeTab === 'financial' && <FinancialTab dealId={dealId} organizationId={deal.organization_id} />}
          {activeTab === 'asset' && <AssetTab deal={deal} asset={asset} />}
          {activeTab === 'director' && <DirectorTab deal={deal} dealId={dealId} />}
          {activeTab === 'simulator' && <SimulatorPanel deal={deal} asset={asset} />}
        </div>
      </main>

      <ScorePanel score={score} />
    </div>
  );
}
