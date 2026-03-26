'use client';

import type { Deal, DealScore } from '@/types/database';

type Props = {
  deal: Deal;
  score: DealScore | null;
};

const VERDICT_STYLES: Record<string, { bg: string; text: string }> = {
  go: { bg: 'bg-[#F0FDF4]', text: 'text-[#059669]' },
  go_conditionnel: { bg: 'bg-[#FFFBEB]', text: 'text-[#B45309]' },
  no_go: { bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]' },
  veto: { bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]' },
};

const VERDICT_LABELS: Record<string, string> = {
  go: 'GO',
  go_conditionnel: 'GO CONDITIONNEL',
  no_go: 'NO GO',
  veto: 'VETO',
};

function getMention(score: number): { mention: string; color: string } {
  if (score >= 17) return { mention: 'Excellent', color: '#059669' };
  if (score >= 13) return { mention: 'Bon', color: '#10B981' };
  if (score >= 10) return { mention: 'Passable', color: '#F59E0B' };
  if (score >= 7) return { mention: 'Insuffisant', color: '#EF6C00' };
  if (score >= 4) return { mention: 'Mauvais', color: '#DC2626' };
  return { mention: 'Critique', color: '#991B1B' };
}

const DIMENSIONS = [
  { key: 'score_macro_sectoriel_combine' as const, label: 'Macro + Sectoriel' },
  { key: 'score_financier' as const, label: 'Financier' },
  { key: 'score_materiel' as const, label: 'Matériel' },
  { key: 'score_dirigeant' as const, label: 'Dirigeant' },
];

export default function ScorePanel({ deal, score }: Props) {
  const totalScore = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const mention = getMention(totalScore);
  const verdictStyle = verdict ? VERDICT_STYLES[verdict] : null;

  return (
    <div className="fixed right-0 top-0 w-[320px] h-screen bg-white border-l border-[#E2E8F0] p-6 overflow-y-auto z-20">
      {/* Verdict */}
      {verdict && verdictStyle && (
        <div className={`rounded-xl p-4 mb-6 ${verdictStyle.bg}`}>
          <div className={`text-xl font-bold ${verdictStyle.text}`}>
            {VERDICT_LABELS[verdict]}
          </div>
        </div>
      )}

      {/* Score gauge */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          {/* Semi-circular gauge */}
          <svg viewBox="0 0 200 120" className="w-48 mx-auto">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#EEF0F5"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Score arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={mention.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(totalScore / 20) * 251.2} 251.2`}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <div>
              <div className="text-3xl font-bold font-mono" style={{ color: mention.color }}>
                {totalScore.toFixed(1)}
              </div>
              <div className="text-sm font-medium" style={{ color: mention.color }}>
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
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#4A5568]">{label}</span>
                {val !== null ? (
                  <span className="font-mono font-medium" style={{ color: m?.color }}>
                    {val.toFixed(1)}/20
                  </span>
                ) : (
                  <span className="text-[#8A95A3]">—</span>
                )}
              </div>
              <div className="h-1.5 bg-[#EEF0F5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: val !== null ? `${(val / 20) * 100}%` : '0%',
                    backgroundColor: m?.color || '#EEF0F5',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button className="w-full bg-[#1B4FD8] text-white py-2.5 rounded-lg font-medium hover:bg-[#1640B0] transition-colors text-sm">
          Exporter PDF
        </button>
        <button className="w-full bg-[#EBF0FF] text-[#1B4FD8] py-2.5 rounded-lg font-medium hover:bg-[#D6E0FF] transition-colors text-sm">
          Partager avec la banque
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 pt-6 border-t border-[#E2E8F0] text-xs text-[#8A95A3]">
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
