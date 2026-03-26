'use client';

import type { DealScore } from '@/types/database';

type Props = {
  score: DealScore | null;
};

const VERDICT_CONFIG = {
  go: {
    bg: 'bg-[#34c759]/[0.08]',
    text: 'text-[#248a3d]',
    border: 'border-[#34c759]/20',
    label: 'GO',
    message: "L'analyse globale est favorable.",
  },
  go_conditionnel: {
    bg: 'bg-[#ff9f0a]/[0.08]',
    text: 'text-[#c93400]',
    border: 'border-[#ff9f0a]/20',
    label: 'GO CONDITIONNEL',
    message: 'Points de vigilance — financement possible sous conditions.',
  },
  no_go: {
    bg: 'bg-[#ff3b30]/[0.06]',
    text: 'text-[#d70015]',
    border: 'border-[#ff3b30]/15',
    label: 'NO GO',
    message: 'Risque trop élevé. Financement déconseillé.',
  },
  veto: {
    bg: 'bg-[#ff3b30]/[0.06]',
    text: 'text-[#d70015]',
    border: 'border-[#ff3b30]/20',
    label: 'VETO',
    message: 'Financement bloqué.',
  },
};

function getMention(score: number): { mention: string; color: string } {
  if (score >= 17) return { mention: 'Excellent', color: '#34c759' };
  if (score >= 13) return { mention: 'Bon', color: '#30d158' };
  if (score >= 10) return { mention: 'Passable', color: '#ff9f0a' };
  if (score >= 7) return { mention: 'Insuffisant', color: '#ff6723' };
  if (score >= 4) return { mention: 'Mauvais', color: '#ff3b30' };
  return { mention: 'Critique', color: '#d70015' };
}

export default function VerdictBanner({ score }: Props) {
  if (!score?.verdict) {
    return (
      <div className="mb-6 p-5 bg-black/[0.02] rounded-2xl text-center animate-fade-in">
        <p className="text-[13px] text-[#86868b]">Analyse en cours...</p>
      </div>
    );
  }

  const config = VERDICT_CONFIG[score.verdict];
  const totalScore = score.score_deal_total || 0;
  const mention = getMention(totalScore);

  return (
    <div className={`mb-6 p-5 rounded-2xl border ${config.bg} ${config.border} animate-scale-in`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-xl font-semibold tracking-tight ${config.text}`}>
            {config.label}
          </div>
          <p className={`text-[13px] mt-0.5 ${config.text} opacity-70`}>
            {config.message}
          </p>
          {score.veto_raison && (
            <p className="text-[13px] mt-1.5 text-[#d70015] font-medium">
              {score.veto_raison}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-[40px] font-bold font-mono leading-none tracking-tighter" style={{ color: mention.color }}>
            {totalScore.toFixed(1)}
          </div>
          <div className="text-[12px] font-medium mt-0.5" style={{ color: mention.color }}>
            /20 — {mention.mention}
          </div>
        </div>
      </div>
    </div>
  );
}
