'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import type { Deal, DealAsset, DealScore } from '@/types/database';

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  draft: { label: 'Brouillon', style: 'bg-[#f5f5f7] text-[#6e6e73]' },
  analyzing: { label: 'En analyse', style: 'bg-blue-50 text-blue-600' },
  completed: { label: 'Terminé', style: 'bg-green-50 text-green-600' },
  archived: { label: 'Archivé', style: 'bg-[#f5f5f7] text-[#a1a1a6]' },
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [assets, setAssets] = useState<Record<string, DealAsset>>({});
  const [scores, setScores] = useState<Record<string, DealScore>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDeals() {
      const { data } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });
      setDeals(data || []);

      if (data && data.length > 0) {
        const ids = data.map((d: { id: string }) => d.id);
        const { data: assetData } = await supabase
          .from('deal_assets')
          .select('*')
          .in('deal_id', ids);
        const map: Record<string, DealAsset> = {};
        assetData?.forEach((a: DealAsset) => { map[a.deal_id] = a; });
        setAssets(map);

        const { data: scoreData } = await supabase
          .from('deal_scores')
          .select('*')
          .in('deal_id', ids)
          .order('computed_at', { ascending: false });
        const smap: Record<string, DealScore> = {};
        scoreData?.forEach((s: DealScore) => { if (!smap[s.deal_id]) smap[s.deal_id] = s; });
        setScores(smap);
      }

      setLoading(false);
    }
    fetchDeals();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Sidebar />
      <main className="ml-[56px] p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1d1d1f]">Dossiers</h1>
            <p className="text-[#6e6e73] mt-1">{deals.length} dossier(s)</p>
          </div>
          <Link
            href="/deals/new"
            className="flex items-center gap-2 bg-[#1e40af] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#1e3a8a] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau dossier
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[20px] shadow p-5 animate-pulse">
                <div className="h-5 bg-[#f5f5f7] rounded w-1/3 mb-2" />
                <div className="h-4 bg-[#f5f5f7] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-[#f5f5f7] rounded-[20px] p-12 text-center">
            <p className="text-[#a1a1a6]">Aucun dossier</p>
            <Link href="/deals/new" className="text-[#1d1d1f] font-medium text-sm mt-2 inline-block">
              Créer votre premier dossier
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="block tile hover:bg-[#fafafa] transition-colors"
                style={{ padding: '16px 20px' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[18px] font-semibold" style={{ color: 'var(--text-primary, #1d1d1f)' }}>
                      {deal.raison_sociale || 'Sans nom'}
                      {assets[deal.id]?.marque && (
                        <span className="font-normal text-[#6e6e73]">{' — '}{[assets[deal.id].marque, assets[deal.id].modele].filter(Boolean).join(' ')}</span>
                      )}
                    </h3>
                    <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary, #6e6e73)' }}>
                      {deal.code_naf} {deal.secteur_label}
                      {' · '}{deal.type_financement?.replace('_', ' ')}
                      {deal.montant_finance && <>{' · '}{(deal.montant_finance / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k€</>}
                      {deal.duree_mois && <>{' · '}{deal.duree_mois} mois</>}
                    </p>
                    <p className="text-[11px] mt-1 flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: '#a1a1a6' }}>
                      <span>SIREN <span style={{ fontVariantNumeric: 'tabular-nums' }}>{deal.siren}</span></span>
                      {deal.dirigeant_nom && <span>Dirigeant {deal.dirigeant_prenom} {deal.dirigeant_nom}</span>}
                      {assets[deal.id]?.annee_fabrication && <span>{assets[deal.id].marque} {assets[deal.id].modele} {assets[deal.id].annee_fabrication}</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0" style={{ width: '140px' }}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_LABELS[deal.status]?.style}`}>
                        {STATUS_LABELS[deal.status]?.label}
                      </span>
                      <span className="text-xs text-[#a1a1a6]">
                        {new Date(deal.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {deal.status === 'completed' && scores[deal.id] ? (
                      <div className="flex items-center mt-1.5" style={{ gap: '6px' }}>
                        <span className="font-mono font-bold" style={{
                          fontSize: '16px',
                          color: scores[deal.id].score_deal_total >= 14 ? '#059669' : scores[deal.id].score_deal_total >= 10 ? '#B45309' : '#DC2626',
                        }}>
                          {scores[deal.id].score_deal_total.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '9px', color: '#a1a1a6' }}>/20</span>
                        {scores[deal.id].verdict && (
                          <span className="font-medium" style={{
                            fontSize: '9px', borderRadius: '6px', padding: '2px 8px', whiteSpace: 'nowrap',
                            background: scores[deal.id].verdict === 'go' ? '#f0fdf4' : scores[deal.id].verdict === 'go_conditionnel' ? '#FFF7E6' : '#FEF2F2',
                            color: scores[deal.id].verdict === 'go' ? '#059669' : scores[deal.id].verdict === 'go_conditionnel' ? '#B45309' : '#DC2626',
                            border: `0.5px solid ${scores[deal.id].verdict === 'go' ? '#059669' : scores[deal.id].verdict === 'go_conditionnel' ? '#F59E0B' : '#DC2626'}`,
                          }}>
                            {scores[deal.id].verdict === 'go' ? 'GO' : scores[deal.id].verdict === 'go_conditionnel' ? 'GO COND.' : scores[deal.id].verdict === 'no_go' ? 'NO GO' : 'VETO'}
                          </span>
                        )}
                      </div>
                    ) : deal.status !== 'completed' ? (
                      <span className="mt-1.5" style={{ fontSize: '12px', color: '#a1a1a6' }}>—</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
