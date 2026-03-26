import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1923]">Tableau de bord</h1>
          <p className="text-[#4A5568] mt-1">Vue d&apos;ensemble de vos deals</p>
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

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Dossiers actifs" value="0" />
        <StatCard label="Score moyen" value="--/20" />
        <StatCard label="Exposition totale" value="0 EUR" />
        <StatCard label="Taux GO" value="--%" />
      </div>

      {/* Recent deals */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h2 className="text-lg font-semibold text-[#0F1923] mb-4">Dossiers récents</h2>
        <div className="text-center py-12 text-[#8A95A3]">
          <svg className="w-12 h-12 mx-auto mb-3 text-[#E2E8F0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Aucun dossier pour le moment</p>
          <Link
            href="/deals/new"
            className="inline-block mt-3 text-sm text-[#1B4FD8] font-medium hover:underline"
          >
            Créer votre premier dossier
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
      <p className="text-sm text-[#4A5568] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#0F1923] font-mono">{value}</p>
    </div>
  );
}
