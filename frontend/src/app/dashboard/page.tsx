import Link from 'next/link';
import { FolderOpen, Target, TrendingUp, CheckCircle, Plus } from 'lucide-react';

const STATS = [
  { icon: FolderOpen, label: 'Dossiers actifs', value: '0', unit: undefined },
  { icon: Target, label: 'Score moyen', value: '--', unit: '/20' },
  { icon: TrendingUp, label: 'Exposition totale', value: '0', unit: 'EUR' },
  { icon: CheckCircle, label: 'Taux GO', value: '--', unit: '%' },
];

export default function DashboardPage() {
  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1d1d1f] tracking-tight">Tableau de bord</h1>
          <p className="text-[14px] text-[#6e6e73] mt-0.5">Vue d&apos;ensemble de vos deals</p>
        </div>
        <Link href="/deals/new"
          className="inline-flex items-center gap-1.5 bg-[#1e40af] text-white px-4 py-2 rounded-full text-[13px] font-medium hover:bg-[#1e3a8a] active:scale-[0.98] transition-all">
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          Nouveau dossier
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="bg-white rounded-[20px] shadow hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[8px] bg-[#1e40af]/[0.08] flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-[#1e40af]" strokeWidth={1.8} />
              </div>
              <p className="text-[12px] text-[#86868b]">{s.label}</p>
            </div>
            <p className="text-[24px] font-semibold text-[#1d1d1f] font-mono tracking-tight leading-none">
              {s.value}
              {s.unit && <span className="text-[13px] text-[#86868b] font-normal font-sans ml-0.5">{s.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Recent deals */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h2 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight mb-4">Dossiers récents</h2>
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-[#f5f5f7] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FolderOpen className="w-5 h-5 text-[#86868b]" strokeWidth={1.5} />
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
