'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import RecapBlock from '@/components/scores/RecapBlock';
import HypothesesColumn from '@/components/deal/HypothesesColumn';
import MacroSectorTab from '@/components/deal/tabs/MacroSectorTab';
import FinancialTab from '@/components/deal/FinancialTab';
import AssetTab from '@/components/deal/tabs/AssetTab';
import DirectorTab from '@/components/deal/tabs/DirectorTab';
import SimulatorPanel from '@/components/simulator/SimulatorPanel';
import { Globe, BarChart3, Truck, User, Zap, Trash2, FileDown, Lightbulb } from 'lucide-react';
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
      <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
        <Sidebar />
        <main className="sm:ml-[56px] p-4">
          <div className="animate-pulse space-y-3 max-w-2xl">
            <div className="h-6 rounded-[8px] w-1/3" style={{ background: '#E2E8F0' }} />
            <div className="h-48 rounded-[8px]" style={{ background: '#E2E8F0' }} />
          </div>
        </main>
      </div>
    );
  }

  const verdict = score?.verdict;

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <Sidebar />

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="tile p-5 max-w-[340px] w-full">
            <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Supprimer ce dossier ?</p>
            <p className="text-[11px] mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}><strong>{deal.raison_sociale}</strong> — irréversible.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 py-[6px] rounded-[4px] text-[10px] font-medium" style={{ background: 'var(--page-bg)', color: 'var(--text-secondary)' }}>Annuler</button>
              <button disabled={deleting} onClick={async () => {
                setDeleting(true);
                const { error } = await supabase.from('deals').delete().eq('id', dealId);
                if (!error) router.push('/deals'); else { setDeleting(false); setShowDelete(false); }
              }} className="flex-1 py-[6px] rounded-[4px] text-[10px] font-medium text-white disabled:opacity-50" style={{ background: '#DC2626' }}>
                {deleting ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sm:ml-[56px] min-h-screen flex flex-col">

        {/* HEADER — white tile above both columns */}
        <div className="m-3 mb-0 tile" style={{ padding: '12px 16px' }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>{deal.raison_sociale}</h1>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-mono">{deal.siren}</span>
                {' · '}{deal.code_naf} {deal.secteur_label}
                {' · '}{deal.type_financement?.replace('_', ' ')}
                {deal.montant_finance && <>{' · '}<span className="font-mono">{deal.montant_finance.toLocaleString('fr-FR')} EUR</span></>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-[10px] py-[3px] rounded-full text-[9px] font-medium" style={{
                background: deal.status === 'completed' ? 'var(--color-success-bg)' : deal.status === 'analyzing' ? '#EBF5FF' : 'var(--page-bg)',
                color: deal.status === 'completed' ? 'var(--color-success-text)' : deal.status === 'analyzing' ? 'var(--accent)' : 'var(--text-muted)',
                border: `0.5px solid ${deal.status === 'completed' ? 'var(--color-success-border)' : deal.status === 'analyzing' ? 'var(--accent)' : '#E2E8F0'}`,
              }}>
                {deal.status === 'completed' ? 'Analysé' : deal.status === 'analyzing' ? 'En cours' : 'Brouillon'}
              </span>
              <button onClick={() => setShowDelete(true)} className="p-1.5 rounded-[4px]" style={{ color: 'var(--text-muted)' }}>
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* TWO COLUMNS */}
        <div className="flex flex-1 overflow-hidden m-3 mt-0" style={{ gap: '24px' }}>

          {/* LEFT — Hypothèses */}
          <div className="hidden lg:flex flex-col w-[280px] xl:w-[280px] shrink-0 overflow-y-auto pt-4">
            <p className="font-medium pl-2 mb-3" style={{ fontSize: '20px', color: '#185FA5' }}>Hypothèses</p>
            <HypothesesColumn deal={deal} asset={asset} dealId={dealId} supabase={supabase} />
          </div>

          {/* RIGHT — Résultats */}
          <div className="flex-1 min-w-0 flex flex-col pt-4" style={{ height: 'calc(100vh - 76px)', overflow: 'hidden' }}>

            {/* Title line: Résultats + buttons */}
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <p className="font-medium pl-1" style={{ fontSize: '20px', color: '#185FA5' }}>Résultats</p>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <button className="inline-flex items-center font-medium" style={{
                  gap: '5px', fontSize: '11px', background: 'white', border: '0.5px solid #E2E8F0',
                  borderRadius: '6px', padding: '5px 12px', color: 'var(--text-secondary)',
                }}>
                  <FileDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Exporter PDF
                </button>
                {verdict && (verdict === 'go_conditionnel' || verdict === 'no_go') && (
                  <button className="inline-flex items-center font-medium" style={{
                    gap: '5px', fontSize: '11px', background: '#185FA5', border: 'none',
                    borderRadius: '6px', padding: '5px 12px', color: 'white',
                  }}>
                    <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Optimiser le deal
                  </button>
                )}
              </div>
            </div>

            {/* Synthèse block — NEVER scrolls */}
            <div className="shrink-0">
              <h4 className="text-[12px] font-medium mb-1.5" style={{ color: '#185FA5' }}>Synthèse</h4>
              <RecapBlock score={score} />
            </div>

            {/* Tab bar — NEVER scrolls */}
            <div className="shrink-0" style={{ marginTop: '20px' }}>
              <div style={{
                display: 'flex', gap: '0', background: 'white', border: '0.5px solid #E2E8F0',
                borderRadius: '8px', padding: '3px', overflowX: 'auto',
              }}>
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="flex items-center justify-center flex-1 whitespace-nowrap"
                      style={{
                        gap: '5px', padding: '7px 0', borderRadius: '6px',
                        fontSize: '10px', fontWeight: 500, border: 'none', cursor: 'pointer',
                        background: active ? '#185FA5' : 'transparent',
                        color: active ? 'white' : '#4A5568',
                        transition: 'all 0.15s ease',
                      }}>
                      <Icon className="w-3 h-3" strokeWidth={1.8} />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable zone: tab content ONLY */}
            <div className="flex-1 min-h-0 overflow-y-auto" style={{
              marginTop: '8px', paddingBottom: '24px',
              scrollbarWidth: 'thin', scrollbarColor: '#E2E8F0 transparent',
            }}>
              <div className="space-y-2">
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
