'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import BottomBar from '@/components/scores/BottomBar';
import HypothesesSidebar from '@/components/deal/HypothesesSidebar';
import MacroSectorTab from '@/components/deal/tabs/MacroSectorTab';
import FinancialTab from '@/components/deal/FinancialTab';
import AssetTab from '@/components/deal/tabs/AssetTab';
import DirectorTab from '@/components/deal/tabs/DirectorTab';
import SimulatorPanel from '@/components/simulator/SimulatorPanel';
import { Globe, BarChart3, Truck, User, Zap, Trash2 } from 'lucide-react';
import type { Deal, DealAsset, DealScore } from '@/types/database';

type TabId = 'financial' | 'asset' | 'director' | 'macro' | 'simulator';

const TABS: { id: TabId; label: string; icon: typeof Globe }[] = [
  { id: 'financial', label: 'Financier', icon: BarChart3 },
  { id: 'asset', label: 'Matériel', icon: Truck },
  { id: 'director', label: 'Dirigeant', icon: User },
  { id: 'macro', label: 'Macro / Secteur', icon: Globe },
  { id: 'simulator', label: 'Simulateur', icon: Zap },
];

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [asset, setAsset] = useState<DealAsset | null>(null);
  const [score, setScore] = useState<DealScore | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('financial');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: d } = await supabase.from('deals').select('*').eq('id', dealId).maybeSingle();
      if (d) setDeal(d);
      const { data: a } = await supabase.from('deal_assets').select('*').eq('deal_id', dealId).maybeSingle();
      if (a) setAsset(a);
      const { data: s } = await supabase.from('deal_scores').select('*').eq('deal_id', dealId).order('computed_at', { ascending: false }).limit(1).maybeSingle();
      if (s) setScore(s);
    }
    load();
  }, [dealId, supabase]);

  if (!deal) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <Sidebar />
        <main className="sm:ml-[64px] p-8">
          <div className="animate-pulse space-y-4 max-w-2xl">
            <div className="h-7 bg-white/60 rounded-[10px] w-1/3" />
            <div className="h-4 bg-white/60 rounded-[10px] w-1/2" />
            <div className="h-60 bg-white/60 rounded-[20px]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-[88px]">
      <Sidebar />

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] p-6 max-w-sm w-full shadow-xl animate-scale-in">
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-1">Supprimer ce dossier ?</h3>
            <p className="text-[13px] text-[#6e6e73] mb-5"><strong>{deal.raison_sociale}</strong> — irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 py-2 bg-[#f5f5f7] text-[#424245] rounded-[12px] text-[13px] font-medium hover:bg-[#ededf0] transition-all">Annuler</button>
              <button disabled={deleting} onClick={async () => {
                setDeleting(true);
                const { error } = await supabase.from('deals').delete().eq('id', dealId);
                if (!error) router.push('/deals'); else { setDeleting(false); setShowDelete(false); }
              }} className="flex-1 py-2 bg-[#c4342d] text-white rounded-[12px] text-[13px] font-medium hover:bg-[#a52a24] transition-all disabled:opacity-50">
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout: sidebar icons (64) + hypotheses (280) + content + bottom bar */}
      <div className="sm:ml-[64px] flex min-h-screen">

        {/* LEFT — Hypotheses panel (fixed 280px, scrollable) */}
        <HypothesesSidebar deal={deal} asset={asset} dealId={dealId} />

        {/* RIGHT — Content area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="px-5 sm:px-8 pt-5 sm:pt-8 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[20px] sm:text-[24px] font-semibold text-[#1d1d1f] tracking-tight leading-tight">
                  {deal.raison_sociale}
                </h1>
                <p className="text-[12px] text-[#6e6e73] mt-0.5 flex items-center gap-2">
                  <span className="font-mono">{deal.siren}</span>
                  <span>—</span>
                  <span>{deal.secteur_label}</span>
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    deal.status === 'completed' ? 'bg-[#2d9d3f]/10 text-[#2d9d3f]' :
                    deal.status === 'analyzing' ? 'bg-[#1e40af]/10 text-[#1e40af]' :
                    'bg-[#f5f5f7] text-[#6e6e73]'
                  }`}>{deal.status === 'completed' ? 'Analysé' : deal.status === 'analyzing' ? 'En cours' : 'Brouillon'}</span>
                </p>
              </div>
              <button onClick={() => setShowDelete(true)}
                className="p-2 text-[#a1a1a6] hover:text-[#c4342d] hover:bg-[#c4342d]/[0.06] rounded-[10px] transition-all">
                <Trash2 className="w-4 h-4" strokeWidth={1.6} />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="px-5 sm:px-8 mb-5">
            <div className="flex gap-1 bg-white rounded-[12px] shadow-sm p-1 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-[8px] text-[12px] sm:text-[13px] font-medium transition-all whitespace-nowrap ${
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
          </div>

          {/* Tab content */}
          <div className="px-5 sm:px-8 pb-8">
            {activeTab === 'financial' && <FinancialTab dealId={dealId} organizationId={deal.organization_id} />}
            {activeTab === 'asset' && <AssetTab deal={deal} asset={asset} />}
            {activeTab === 'director' && <DirectorTab deal={deal} dealId={dealId} />}
            {activeTab === 'macro' && <MacroSectorTab dealId={dealId} score={score} />}
            {activeTab === 'simulator' && <SimulatorPanel deal={deal} asset={asset} />}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR — single source of truth for verdict + score */}
      <BottomBar score={score} />
    </div>
  );
}
