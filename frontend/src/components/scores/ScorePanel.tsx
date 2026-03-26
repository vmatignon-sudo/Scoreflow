'use client';

import type { DealScore } from '@/types/database';

type Props = {
  score: DealScore | null;
};

function getMention(score: number): { mention: string; color: string } {
  if (score >= 17) return { mention: 'Excellent', color: '#2d9d3f' };
  if (score >= 13) return { mention: 'Bon', color: '#34a853' };
  if (score >= 10) return { mention: 'Passable', color: '#bf5a00' };
  if (score >= 7) return { mention: 'Insuffisant', color: '#d93025' };
  if (score >= 4) return { mention: 'Mauvais', color: '#c4342d' };
  return { mention: 'Critique', color: '#a50e0e' };
}

const VERDICTS: Record<string, { label: string; color: string }> = {
  go: { label: 'GO', color: '#2d9d3f' },
  go_conditionnel: { label: 'GO CONDITIONNEL', color: '#bf5a00' },
  no_go: { label: 'NO GO', color: '#c4342d' },
  veto: { label: 'VETO', color: '#a50e0e' },
};

const DIMS = [
  { key: 'score_macro_sectoriel_combine' as const, label: 'Macro + Sectoriel' },
  { key: 'score_financier' as const, label: 'Financier' },
  { key: 'score_materiel' as const, label: 'Matériel' },
  { key: 'score_dirigeant' as const, label: 'Dirigeant' },
];

export default function ScorePanel({ score }: Props) {
  const total = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const mention = getMention(total);
  const v = verdict ? VERDICTS[verdict] : null;

  return (
    <div className="hidden lg:block fixed right-0 top-0 w-[280px] h-screen bg-white/90 glass shadow-lg p-5 overflow-y-auto z-20">
      {/* Verdict */}
      {v && (
        <div className="rounded-[14px] px-4 py-3 mb-5 text-center" style={{ backgroundColor: `${v.color}08` }}>
          <div className="text-[14px] font-semibold tracking-tight" style={{ color: v.color }}>
            {v.label}
          </div>
        </div>
      )}

      {/* Gauge */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <svg viewBox="0 0 200 120" className="w-40 mx-auto">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={mention.color} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(total / 20) * 251.2} 251.2`} style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
          </svg>
          <div className="absolute inset-0 flex items-end justify-center pb-1">
            <div>
              <div className="text-[28px] font-semibold font-mono leading-none tracking-tighter" style={{ color: mention.color }}>{total.toFixed(1)}</div>
              <div className="text-[11px] font-medium mt-0.5" style={{ color: mention.color }}>/20 — {mention.mention}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-3 mb-6">
        {DIMS.map(({ key, label }) => {
          const val = score?.[key] ?? null;
          const m = val !== null ? getMention(val) : null;
          return (
            <div key={key}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[#6e6e73]">{label}</span>
                <span className="font-mono font-medium" style={{ color: m?.color || '#a1a1a6' }}>{val !== null ? val.toFixed(1) : '—'}</span>
              </div>
              <div className="h-[2px] bg-black/[0.04] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: val !== null ? `${(val / 20) * 100}%` : '0%',
                  backgroundColor: m?.color || 'transparent',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button className="w-full bg-[#2563eb] text-white py-2 rounded-[12px] text-[12px] font-medium hover:bg-[#1d4ed8] active:scale-[0.98] transition-all">
          Exporter PDF
        </button>
        <button className="w-full bg-[#f5f5f7] text-[#1d1d1f] py-2 rounded-[12px] text-[12px] font-medium hover:bg-[#ededf0] active:scale-[0.98] transition-all">
          Partager
        </button>
      </div>

      <div className="mt-5 pt-4 border-t border-black/[0.04] text-[10px] text-[#a1a1a6] leading-relaxed">
        <p>Le modèle est fixe. Seules les conditions du deal varient.</p>
        {score?.computed_at && <p className="mt-1">Calculé le {new Date(score.computed_at).toLocaleDateString('fr-FR')}</p>}
      </div>
    </div>
  );
}
