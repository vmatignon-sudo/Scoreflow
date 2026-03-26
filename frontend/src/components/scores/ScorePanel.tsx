'use client';

import type { DealScore } from '@/types/database';

type Props = {
  score: DealScore | null;
};

const VERDICT_LABELS: Record<string, string> = {
  go: 'GO',
  go_conditionnel: 'GO CONDITIONNEL',
  no_go: 'NO GO',
  veto: 'VETO',
};

function getMention(score: number): { mention: string; color: string } {
  if (score >= 17) return { mention: 'Excellent', color: '#34c759' };
  if (score >= 13) return { mention: 'Bon', color: '#30d158' };
  if (score >= 10) return { mention: 'Passable', color: '#ff9f0a' };
  if (score >= 7) return { mention: 'Insuffisant', color: '#ff6723' };
  if (score >= 4) return { mention: 'Mauvais', color: '#ff3b30' };
  return { mention: 'Critique', color: '#d70015' };
}

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'go': return '#34c759';
    case 'go_conditionnel': return '#ff9f0a';
    case 'no_go': return '#ff3b30';
    case 'veto': return '#d70015';
    default: return '#86868b';
  }
}

const DIMENSIONS = [
  { key: 'score_macro_sectoriel_combine' as const, label: 'Macro + Sectoriel' },
  { key: 'score_financier' as const, label: 'Financier' },
  { key: 'score_materiel' as const, label: 'Matériel' },
  { key: 'score_dirigeant' as const, label: 'Dirigeant' },
];

export default function ScorePanel({ score }: Props) {
  const totalScore = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const mention = getMention(totalScore);

  return (
    <div className="hidden lg:block fixed right-0 top-0 w-[300px] h-screen bg-white/80 glass border-l border-black/[0.04] p-5 overflow-y-auto z-20">
      {/* Verdict pill */}
      {verdict && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-center"
          style={{ backgroundColor: `${getVerdictColor(verdict)}10` }}
        >
          <div
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: getVerdictColor(verdict) }}
          >
            {VERDICT_LABELS[verdict]}
          </div>
        </div>
      )}

      {/* Score gauge */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <svg viewBox="0 0 200 120" className="w-44 mx-auto">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="rgba(0,0,0,0.04)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={mention.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(totalScore / 20) * 251.2} 251.2`}
              style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-end justify-center pb-1">
            <div>
              <div
                className="text-[32px] font-bold font-mono leading-none tracking-tighter"
                style={{ color: mention.color }}
              >
                {totalScore.toFixed(1)}
              </div>
              <div className="text-[11px] font-medium mt-1" style={{ color: mention.color }}>
                /20 — {mention.mention}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension scores */}
      <div className="space-y-3 mb-6">
        {DIMENSIONS.map(({ key, label }) => {
          const val = score?.[key] ?? null;
          const m = val !== null ? getMention(val) : null;
          return (
            <div key={key}>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="text-[#86868b]">{label}</span>
                {val !== null ? (
                  <span className="font-mono font-semibold" style={{ color: m?.color }}>
                    {val.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-[#86868b]">—</span>
                )}
              </div>
              <div className="h-[3px] bg-black/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: val !== null ? `${(val / 20) * 100}%` : '0%',
                    backgroundColor: m?.color || 'transparent',
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button className="w-full bg-[#1d1d1f] text-white py-2.5 rounded-xl text-[13px] font-medium hover:bg-[#333] active:scale-[0.98] transition-all">
          Exporter PDF
        </button>
        <button className="w-full bg-black/[0.04] text-[#1d1d1f] py-2.5 rounded-xl text-[13px] font-medium hover:bg-black/[0.06] active:scale-[0.98] transition-all">
          Partager
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-black/[0.04] text-[11px] text-[#86868b] leading-relaxed">
        <p>Le modèle est fixe. Seules les conditions du deal varient.</p>
        {score?.computed_at && (
          <p className="mt-1">
            Calculé le {new Date(score.computed_at).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
}
