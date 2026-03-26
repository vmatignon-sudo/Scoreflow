'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import ScoreBlock from '@/components/scores/ScoreBlock';
import HypothesesColumn from '@/components/deal/HypothesesColumn';
import MacroSectorTab from '@/components/deal/tabs/MacroSectorTab';
import FinancialTab from '@/components/deal/FinancialTab';
import AssetTab from '@/components/deal/tabs/AssetTab';
import DirectorTab from '@/components/deal/tabs/DirectorTab';
import SimulatorPanel from '@/components/simulator/SimulatorPanel';
import { Globe, BarChart3, Truck, User, Zap, Trash2 } from 'lucide-react';
import type { Deal, DealAsset, DealScore } from '@/types/database';

type TabId = 'macro' | 'financial' | 'asset' | 'director' | 'simulator';

const TABS: { id: TabId; label: string; icon: typeof Globe }[] = [
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
      <div className="min-h-screen" style={{ background: 'var(--color-background-tertiary)' }}>
        <Sidebar />
        <main className="sm:ml-[64px] p-8">
          <div className="animate-pulse space-y-4 max-w-2xl">
            <div className="h-7 rounded-[8px] w-1/3" style={{ background: 'var(--color-background-secondary)' }} />
            <div className="h-60 rounded-[8px]" style={{ background: 'var(--color-background-secondary)' }} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-tertiary)' }}>
      {/* Sidebar — full height, independent */}
      <Sidebar />

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="rounded-[8px] p-6 max-w-sm w-full shadow-xl animate-scale-in" style={{ background: 'var(--color-background-primary)' }}>
            <h3 className="text-[15px] font-medium" style={{ color: 'var(--color-text-primary)' }}>Supprimer ce dossier ?</h3>
            <p className="text-[12px] mt-1 mb-5" style={{ color: 'var(--color-text-secondary)' }}><strong>{deal.raison_sociale}</strong> — irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 py-2 rounded-[8px] text-[12px] font-medium transition-all"
                style={{ background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }}>Annuler</button>
              <button disabled={deleting} onClick={async () => {
                setDeleting(true);
                const { error } = await supabase.from('deals').delete().eq('id', dealId);
                if (!error) router.push('/deals'); else { setDeleting(false); setShowDelete(false); }
              }} className="flex-1 py-2 bg-[#c4342d] text-white rounded-[8px] text-[12px] font-medium hover:bg-[#a52a24] transition-all disabled:opacity-50">
                {deleting ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right of sidebar */}
      <div className="sm:ml-[64px] min-h-screen flex flex-col">

        {/* HEADER — white, spans hypotheses + results */}
        <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-4 flex items-start justify-between"
          style={{ background: 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <div>
            <h1 className="text-[18px] sm:text-[22px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
              {deal.raison_sociale}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="font-mono">{deal.siren}</span>
              <span style={{ color: 'var(--color-border-primary)' }}>|</span>
              <span>{deal.code_naf} — {deal.secteur_label}</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{
                background: deal.status === 'completed' ? '#2d9d3f10' : deal.status === 'analyzing' ? '#1e40af10' : 'var(--color-background-secondary)',
                color: deal.status === 'completed' ? '#2d9d3f' : deal.status === 'analyzing' ? '#1e40af' : 'var(--color-text-secondary)',
              }}>
                {deal.status === 'completed' ? 'Analysé' : deal.status === 'analyzing' ? 'En cours' : 'Brouillon'}
              </span>
            </div>
          </div>
          <button onClick={() => setShowDelete(true)}
            className="p-2 rounded-[6px] transition-all" style={{ color: 'var(--color-text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#c4342d'; e.currentTarget.style.background = '#c4342d0A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}>
            <Trash2 className="w-4 h-4" strokeWidth={1.6} />
          </button>
        </div>

        {/* TWO COLUMNS */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Hypothèses (248px) */}
          <div className="hidden lg:flex flex-col w-[248px] shrink-0 overflow-y-auto"
            style={{ background: 'var(--color-background-tertiary)', borderRight: '1px solid var(--color-border-secondary)' }}>
            <div className="p-4">
              <p className="text-[12px] font-normal mb-2" style={{ color: 'var(--color-text-secondary)' }}>Hypothèses</p>
              <HypothesesColumn deal={deal} asset={asset} dealId={dealId} supabase={supabase} />
            </div>
          </div>

          {/* RIGHT — Résultats (flex) */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden"
            style={{ background: 'var(--color-background-tertiary)' }}>

            {/* Title floating on gray bg */}
            <div className="px-5 sm:px-6 pt-4 pb-2">
              <p className="text-[12px] font-normal" style={{ color: 'var(--color-text-secondary)' }}>Résultats</p>
            </div>

            {/* Score block — sticky */}
            <div className="px-5 sm:px-6 pb-3 sticky top-0 z-10" style={{ background: 'var(--color-background-tertiary)' }}>
              <ScoreBlock score={score} />
            </div>

            {/* Tab bar — card */}
            <div className="px-5 sm:px-6 pb-3">
              <div className="flex gap-0 rounded-[8px] overflow-hidden" style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap flex-1 justify-center"
                      style={{
                        color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                      }}>
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content — card, scrollable */}
            <div className="px-5 sm:px-6 pb-6 flex-1 overflow-y-auto">
              <div className="rounded-[8px] p-5 sm:p-6" style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                {activeTab === 'macro' && <MacroSectorTab dealId={dealId} score={score} />}
                {activeTab === 'financial' && <FinancialTab dealId={dealId} organizationId={deal.organization_id} />}
                {activeTab === 'asset' && <AssetTab deal={deal} asset={asset} />}
                {activeTab === 'director' && <DirectorTab deal={deal} dealId={dealId} />}
                {activeTab === 'simulator' && <SimulatorPanel deal={deal} asset={asset} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
