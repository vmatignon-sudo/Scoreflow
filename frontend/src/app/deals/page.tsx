'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import type { Deal, DealAsset } from '@/types/database';

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  draft: { label: 'Brouillon', style: 'bg-[#f5f5f7] text-[#6e6e73]' },
  analyzing: { label: 'En analyse', style: 'bg-blue-50 text-blue-600' },
  completed: { label: 'Terminé', style: 'bg-green-50 text-green-600' },
  archived: { label: 'Archivé', style: 'bg-[#f5f5f7] text-[#a1a1a6]' },
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [assets, setAssets] = useState<Record<string, DealAsset>>({});
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
        const ids = data.map(d => d.id);
        const { data: assetData } = await supabase
          .from('deal_assets')
          .select('*')
          .in('deal_id', ids);
        const map: Record<string, DealAsset> = {};
        assetData?.forEach(a => { map[a.deal_id] = a; });
        setAssets(map);
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
                className="block bg-white rounded-[20px] shadow p-5 hover:bg-[#ededf0] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#2d2d2d]">{deal.raison_sociale || 'Sans nom'}</h3>
                    <p className="text-sm text-[#6e6e73] mt-1">
                      {deal.siren} - {deal.secteur_label} - {deal.montant_finance?.toLocaleString('fr-FR')} EUR
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_LABELS[deal.status]?.style}`}>
                      {STATUS_LABELS[deal.status]?.label}
                    </span>
                    <span className="text-xs text-[#a1a1a6]">
                      {new Date(deal.created_at).toLocaleDateString('fr-FR')}
                    </span>
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
