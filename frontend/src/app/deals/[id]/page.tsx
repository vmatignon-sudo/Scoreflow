'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import RecapBlock from '@/components/scores/RecapBlock';
import HypothesesColumn from '@/components/deal/HypothesesColumn';
import MacroSectorTab from '@/components/deal/tabs/MacroSectorTab';
import FinancialTab from '@/components/deal/FinancialTab';
import AssetTab from '@/components/deal/tabs/AssetTab';
import DirectorTab from '@/components/deal/tabs/DirectorTab';
import SimulatorPanel from '@/components/simulator/SimulatorPanel';
import { Globe, BarChart3, Truck, User, Zap, Trash2, FileDown, Lightbulb, RefreshCw, ArrowLeft } from 'lucide-react';
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

    // Écouter les changements sur le deal (statut, hypothèses)
    const channel = supabase
      .channel(`deal-${dealId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'deals', filter: `id=eq.${dealId}` },
        (payload: { new: Deal }) => { setDeal(payload.new); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dealId, supabase]);

  if (!deal) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
        <Sidebar />
        <MobileNav />
        <main className="sm:ml-[56px] p-4 pb-[80px] sm:pb-4">
          <Link href="/deals" className="inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour aux dossiers
          </Link>
          <div className="animate-pulse space-y-3 max-w-2xl">
            <div className="h-6 rounded-[8px] w-1/3" style={{ background: '#E2E8F0' }} />
            <div className="h-48 rounded-[8px]" style={{ background: '#E2E8F0' }} />
          </div>
        </main>
      </div>
    );
  }

  const verdict = deal?.status === 'completed' ? score?.verdict : undefined;

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <Sidebar />
      <MobileNav />

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

      <div className="sm:ml-[56px] min-h-screen flex flex-col pb-[72px] sm:pb-0">

        {/* HEADER — white tile above both columns */}
        <div className="m-3 mb-0 tile" style={{ padding: '16px 20px' }}>
          <Link href="/deals" className="inline-flex items-center gap-1.5 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            Retour aux dossiers
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {deal.raison_sociale}
                {asset?.marque && <span className="font-normal text-[#6e6e73]">{' — '}{[asset.marque, asset.modele].filter(Boolean).join(' ')}</span>}
              </h1>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                {deal.code_naf} {deal.secteur_label}
                {' · '}{deal.type_financement?.replace('_', ' ')}
                {deal.montant_finance && <>{' · '}{(deal.montant_finance / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k€</>}
                {deal.duree_mois && <>{' · '}{deal.duree_mois} mois</>}
              </p>
              <p className="text-[11px] mt-1 flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: 'var(--text-tertiary, #a1a1a6)' }}>
                <span>SIREN <span style={{ fontVariantNumeric: 'tabular-nums' }}>{deal.siren}</span></span>
                {deal.dirigeant_nom && <span>Dirigeant {deal.dirigeant_prenom} {deal.dirigeant_nom}</span>}
                {asset?.annee_fabrication && <span>{asset.marque} {asset.modele} {asset.annee_fabrication}</span>}
                {asset?.etat && <span>{asset.etat.replace(/_/g, ' ')}</span>}
                {deal.depot_garantie ? <span>Dépôt {(deal.depot_garantie / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k€</span> : null}
                {deal.apport_initial ? <span>Apport {(deal.apport_initial / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k€</span> : null}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Bloc statut — largeur fixe */}
              <div className="flex flex-col items-center" style={{ width: '180px' }}>
                {deal.status === 'completed' ? (
                  <>
                    <span className="inline-flex items-center justify-center font-medium w-full"
                      style={{
                        gap: '6px', fontSize: '12px', background: '#f0fdf4', border: '1px solid #059669',
                        borderRadius: '8px', padding: '8px 16px', color: '#059669',
                      }}>
                      Analysé
                    </span>
                    {score && (
                      <div className="flex items-center justify-center mt-2" style={{ gap: '8px' }}>
                        <span className="font-mono font-bold" style={{ fontSize: '18px', color: (score.score_deal_total ?? 0) >= 14 ? '#059669' : (score.score_deal_total ?? 0) >= 10 ? '#B45309' : '#DC2626' }}>
                          {(score.score_deal_total ?? 0).toFixed(1)}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/20</span>
                        {score.verdict && (
                          <span className="font-medium" style={{
                            fontSize: '9px', borderRadius: '6px', padding: '2px 8px', whiteSpace: 'nowrap',
                            background: score.verdict === 'go' ? '#f0fdf4' : score.verdict === 'go_conditionnel' ? '#FFF7E6' : '#FEF2F2',
                            color: score.verdict === 'go' ? '#059669' : score.verdict === 'go_conditionnel' ? '#B45309' : '#DC2626',
                            border: `0.5px solid ${score.verdict === 'go' ? '#059669' : score.verdict === 'go_conditionnel' ? '#F59E0B' : '#DC2626'}`,
                          }}>
                            {score.verdict === 'go' ? 'GO' : score.verdict === 'go_conditionnel' ? 'GO COND.' : score.verdict === 'no_go' ? 'NO GO' : 'VETO'}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={async () => {
                        // UI feedback immédiat
                        setDeal({ ...deal, status: 'analyzing' });
                        // Tenter le backend, sinon fallback Supabase direct
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/deals/${dealId}/analyze`, { method: 'POST' });
                          if (!res.ok) throw new Error('backend unavailable');
                        } catch {
                          // Fallback : remettre completed directement (test UI)
                          await supabase.from('deals').update({ status: 'completed' }).eq('id', dealId);
                        }
                        // Recharger deal + score
                        const { data: d } = await supabase.from('deals').select('*').eq('id', dealId).maybeSingle();
                        if (d) setDeal(d);
                        const { data: s } = await supabase.from('deal_scores').select('*').eq('deal_id', dealId).order('computed_at', { ascending: false }).limit(1).maybeSingle();
                        if (s) setScore(s);
                      }}
                      className="inline-flex items-center justify-center font-medium w-full"
                      style={{
                        gap: '6px', fontSize: '12px', background: '#2a5082', border: 'none',
                        borderRadius: '8px', padding: '8px 16px', color: 'white', cursor: 'pointer',
                      }}>
                      <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
                      Relancer l&apos;analyse
                    </button>
                    <span className="mt-2" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>—</span>
                  </>
                )}
              </div>
              <button onClick={() => setShowDelete(true)} className="p-1.5 rounded-[4px]" style={{ color: 'var(--text-muted)' }}>
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* SHARED TITLE ROW */}
        <div className="hidden lg:flex m-3 mt-0 mb-0 pt-4 pb-3" style={{ gap: '24px' }}>
          <div className="w-[280px] xl:w-[280px] shrink-0">
            <p className="font-medium pl-2" style={{ fontSize: '20px', color: '#2d6a4f' }}>Hypothèses</p>
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <p className="font-medium pl-1" style={{ fontSize: '20px', color: '#2a5082' }}>Résultats</p>
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
        </div>

        {/* TWO COLUMNS */}
        <div className="flex flex-1 overflow-hidden m-3 mt-0" style={{ gap: '24px' }}>

          {/* LEFT — Hypothèses */}
          <div className="hidden lg:flex flex-col w-[280px] xl:w-[280px] shrink-0 overflow-y-auto">
            <HypothesesColumn deal={deal} asset={asset} dealId={dealId} supabase={supabase} onChanged={async () => {
              const { data: d } = await supabase.from('deals').select('*').eq('id', dealId).maybeSingle();
              if (d) setDeal(d);
              const { data: a } = await supabase.from('deal_assets').select('*').eq('deal_id', dealId).maybeSingle();
              if (a) setAsset(a);
            }} />
          </div>

          {/* RIGHT — Résultats */}
          <div className="flex-1 min-w-0 flex flex-col" style={{ height: 'calc(100vh - 76px - 52px)', overflow: 'hidden' }}>

            {/* Synthèse block — NEVER scrolls */}
            <div className="shrink-0">
              <RecapBlock score={score} analyzed={deal.status === 'completed'} />
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
                        background: active ? '#2a5082' : 'transparent',
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
