import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">Tableau de bord</h1>
          <p className="text-[14px] text-[#6e6e73] mt-0.5">Vue d&apos;ensemble de vos deals</p>
        </div>
        <Link href="/deals/new"
          className="flex items-center gap-2 bg-[#1d1d1f] text-white px-4 py-2 rounded-full text-[13px] font-medium hover:bg-black active:scale-[0.98] transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouveau dossier
        </Link>
      </div>

      {/* Stats — white elevated cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Dossiers actifs" value="0" />
        <StatCard label="Score moyen" value="--" unit="/20" />
        <StatCard label="Exposition totale" value="0" unit="EUR" />
        <StatCard label="Taux GO" value="--" unit="%" />
      </div>

      {/* Recent deals — white card */}
      <div className="bg-white rounded-[20px] shadow-sm p-6">
        <h2 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight mb-4">Dossiers récents</h2>
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-[#86868b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
          <p className="text-[13px] text-[#86868b]">Aucun dossier pour le moment</p>
          <Link href="/deals/new" className="inline-block mt-3 text-[13px] text-[#06c] font-medium hover:underline">
            Créer votre premier dossier
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-white rounded-[20px] shadow hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5">
      <p className="text-[12px] text-[#86868b] mb-2">{label}</p>
      <p className="text-[24px] font-semibold text-[#1d1d1f] font-mono tracking-tight leading-none">
        {value}
        {unit && <span className="text-[13px] text-[#86868b] font-normal font-sans ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
