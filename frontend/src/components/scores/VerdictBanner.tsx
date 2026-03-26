'use client';

import type { DealScore } from '@/types/database';

type Props = {
  score: DealScore | null;
};

const VERDICT_STYLES = {
  go: {
    bg: 'bg-[#F0FDF4]',
    text: 'text-[#059669]',
    border: 'border-[#059669]',
    label: 'GO',
    message: "L'analyse globale est favorable.",
  },
  go_conditionnel: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
    border: 'border-[#F59E0B]',
    label: 'GO CONDITIONNEL',
    message: 'Points de vigilance — financement possible sous conditions.',
  },
  no_go: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#991B1B]',
    border: 'border-[#DC2626]',
    label: 'NO GO',
    message: 'Risque trop élevé. Financement déconseillé.',
  },
  veto: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#991B1B]',
    border: 'border-[#991B1B]',
    label: 'VETO',
    message: 'Financement bloqué.',
  },
};

function getMention(score: number): { mention: string; color: string } {
  if (score >= 17) return { mention: 'Excellent', color: '#059669' };
  if (score >= 13) return { mention: 'Bon', color: '#10B981' };
  if (score >= 10) return { mention: 'Passable', color: '#F59E0B' };
  if (score >= 7) return { mention: 'Insuffisant', color: '#EF6C00' };
  if (score >= 4) return { mention: 'Mauvais', color: '#DC2626' };
  return { mention: 'Critique', color: '#991B1B' };
}

export default function VerdictBanner({ score }: Props) {
  if (!score?.verdict) {
    return (
      <div className="mb-6 p-6 bg-[#F7F8FA] rounded-xl border border-[#E2E8F0] text-center">
        <p className="text-[#8A95A3]">Analyse en cours...</p>
      </div>
    );
  }

  const style = VERDICT_STYLES[score.verdict];
  const totalScore = score.score_deal_total || 0;
  const mention = getMention(totalScore);

  return (
    <div className={`mb-6 p-6 rounded-xl border-2 ${style.bg} ${style.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${style.text}`}>{style.label}</div>
          <p className={`text-sm mt-1 ${style.text} opacity-80`}>{style.message}</p>
          {score.veto_raison && (
            <p className="text-sm mt-2 text-[#991B1B] font-medium">
              Raison : {score.veto_raison}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold font-mono" style={{ color: mention.color }}>
            {totalScore.toFixed(1)}
          </div>
          <div className="text-sm font-medium" style={{ color: mention.color }}>
            /20 — {mention.mention}
          </div>
        </div>
      </div>
    </div>
  );
}
