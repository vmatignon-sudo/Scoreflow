'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type PortfolioDeal = {
  id: string;
  raison_sociale: string;
  montant_finance: number;
  duree_mois: number;
  loyer_mensuel_client: number;
  loyer_mensuel_banque: number;
  status: string;
  created_at: string;
  score_deal_total: number | null;
  verdict: string | null;
  mois_restants: number;
  rrn: number;
};

export default function PortfolioPage() {
  const [deals, setDeals] = useState<PortfolioDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPortfolio() {
      const { data: dealData } = await supabase
        .from('deals')
        .select(`
          id, raison_sociale, montant_finance, duree_mois,
          loyer_mensuel_client, loyer_mensuel_banque,
          status, created_at
        `)
        .in('status', ['completed', 'analyzing'])
        .order('created_at', { ascending: false });

      if (dealData) {
        const enriched = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dealData.map(async (deal: Record<string, any>) => {
            const { data: score } = await supabase
              .from('deal_scores')
              .select('score_deal_total, verdict')
              .eq('deal_id', deal.id)
              .order('computed_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const moisEcoules = Math.floor(
              (Date.now() - new Date(deal.created_at).getTime()) / (30 * 86400000)
            );
            const moisRestants = Math.max(0, (deal.duree_mois || 0) - moisEcoules);
            const crd = (deal.montant_finance || 0) * (moisRestants / (deal.duree_mois || 1));
            const loyersNets = moisEcoules * ((deal.loyer_mensuel_client || 0) - (deal.loyer_mensuel_banque || 0));
            const rrn = crd - loyersNets;

            return {
              ...deal,
              score_deal_total: score?.score_deal_total || null,
              verdict: score?.verdict || null,
              mois_restants: moisRestants,
              rrn: Math.round(rrn),
            };
          })
        );
        setDeals(enriched);
      }
      setLoading(false);
    }
    fetchPortfolio();
  }, [supabase]);

  const expositionTotale = deals.reduce((acc, d) => acc + Math.max(0, d.rrn), 0);
  const dealsZoneRouge = deals.filter((d) => d.rrn > 0).length;
  const couvertureMoyenne = deals.length > 0
    ? deals.reduce((acc, d) => acc + (d.rrn < 0 ? 1 : 0), 0) / deals.length * 100
    : 0;

  const scatterData = deals.map((d) => ({
    x: d.mois_restants,
    y: d.rrn,
    name: d.raison_sociale,
    z: d.montant_finance,
  }));

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Sidebar />
      <MobileNav />
      <main className="sm:ml-[56px] p-5 sm:p-8 pb-[80px] sm:pb-8">
        <h1 className="text-2xl font-bold text-[#1d1d1f] mb-8">Portefeuille</h1>

        {/* Aggregates */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <AggCard label="Exposition totale" value={`${expositionTotale.toLocaleString('fr-FR')} EUR`} color="#DC2626" />
          <AggCard label="Deals en zone rouge" value={`${dealsZoneRouge} / ${deals.length}`} color="#F59E0B" />
          <AggCard label="Deals actifs" value={deals.length.toString()} color="#1B4FD8" />
          <AggCard label="Couverture" value={`${couvertureMoyenne.toFixed(0)}%`} color="#059669" />
        </div>

        {/* Scatter plot */}
        <div className="bg-white rounded-[20px] shadow p-6 mb-8">
          <h2 className="font-semibold text-[#2d2d2d] mb-4">Cartographie des deals</h2>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" />
              <XAxis dataKey="x" name="Mois restants" tick={{ fill: '#8A95A3', fontSize: 11 }} />
              <YAxis dataKey="y" name="RRN" tick={{ fill: '#8A95A3', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString('fr-FR')} EUR`} />
              <Scatter data={scatterData} fill="#1B4FD8">
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.y > 0 ? '#DC2626' : '#059669'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Deal table */}
        <div className="bg-white rounded-[20px] shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f5f5f7] border-b border-black/[0.04]">
              <tr>
                <th className="text-left text-xs font-medium text-[#6e6e73] px-5 py-3">Client</th>
                <th className="text-right text-xs font-medium text-[#6e6e73] px-5 py-3">Montant</th>
                <th className="text-right text-xs font-medium text-[#6e6e73] px-5 py-3">Mois restants</th>
                <th className="text-right text-xs font-medium text-[#6e6e73] px-5 py-3">RRN</th>
                <th className="text-right text-xs font-medium text-[#6e6e73] px-5 py-3">Score</th>
                <th className="text-right text-xs font-medium text-[#6e6e73] px-5 py-3">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="border-b border-black/[0.04] hover:bg-[#f5f5f7]">
                  <td className="px-5 py-3 text-sm font-medium text-[#424245]">{deal.raison_sociale}</td>
                  <td className="px-5 py-3 text-sm font-mono text-right text-[#1d1d1f]">
                    {deal.montant_finance?.toLocaleString('fr-FR')} EUR
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-right text-[#6e6e73]">
                    {deal.mois_restants}
                  </td>
                  <td className={`px-5 py-3 text-sm font-mono text-right font-medium ${
                    deal.rrn > 0 ? 'text-[#DC2626]' : 'text-[#059669]'
                  }`}>
                    {deal.rrn.toLocaleString('fr-FR')} EUR
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-right text-[#1d1d1f]">
                    {deal.score_deal_total?.toFixed(1) || '—'}/20
                  </td>
                  <td className="px-5 py-3 text-right">
                    {deal.verdict && (
                      <VerdictBadge verdict={deal.verdict} />
                    )}
                  </td>
                </tr>
              ))}
              {deals.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#a1a1a6] text-sm">
                    Aucun deal actif dans le portefeuille
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function AggCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-[20px] shadow p-5">
      <p className="text-sm text-[#6e6e73] mb-1">{label}</p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>{value}</p>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const styles: Record<string, string> = {
    go: 'bg-[#F0FDF4] text-[#059669]',
    go_conditionnel: 'bg-[#FFFBEB] text-[#B45309]',
    no_go: 'bg-[#FEF2F2] text-[#991B1B]',
    veto: 'bg-[#FEF2F2] text-[#991B1B]',
  };
  const labels: Record<string, string> = {
    go: 'GO',
    go_conditionnel: 'GO COND.',
    no_go: 'NO GO',
    veto: 'VETO',
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[verdict] || ''}`}>
      {labels[verdict] || verdict}
    </span>
  );
}
