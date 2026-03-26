'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/layout/Sidebar';
import type { Deal } from '@/types/database';

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  draft: { label: 'Brouillon', style: 'bg-[#EEF0F5] text-[#4A5568]' },
  analyzing: { label: 'En analyse', style: 'bg-blue-50 text-blue-600' },
  completed: { label: 'Terminé', style: 'bg-green-50 text-green-600' },
  archived: { label: 'Archivé', style: 'bg-[#F7F8FA] text-[#8A95A3]' },
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDeals() {
      const { data } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });
      setDeals(data || []);
      setLoading(false);
    }
    fetchDeals();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      <main className="ml-[240px] p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#0F1923]">Dossiers</h1>
            <p className="text-[#4A5568] mt-1">{deals.length} dossier(s)</p>
          </div>
          <Link
            href="/deals/new"
            className="flex items-center gap-2 bg-[#1B4FD8] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#1640B0] transition-colors"
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
              <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-5 animate-pulse">
                <div className="h-5 bg-[#EEF0F5] rounded w-1/3 mb-2" />
                <div className="h-4 bg-[#EEF0F5] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <p className="text-[#8A95A3]">Aucun dossier</p>
            <Link href="/deals/new" className="text-[#1B4FD8] font-medium text-sm mt-2 inline-block">
              Créer votre premier dossier
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="block bg-white rounded-xl border border-[#E2E8F0] p-5 hover:border-[#CBD5E1] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#0F1923]">{deal.raison_sociale || 'Sans nom'}</h3>
                    <p className="text-sm text-[#4A5568] mt-1">
                      {deal.siren} - {deal.secteur_label} - {deal.montant_finance?.toLocaleString('fr-FR')} EUR
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_LABELS[deal.status]?.style}`}>
                      {STATUS_LABELS[deal.status]?.label}
                    </span>
                    <span className="text-xs text-[#8A95A3]">
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
