'use client';

import type { DealScore } from '@/types/database';

type Props = { score: DealScore | null };

const VERDICTS: Record<string, { label: string; message: string; color: string }> = {
  go: { label: 'GO', message: "L'analyse globale est favorable.", color: '#2d9d3f' },
  go_conditionnel: { label: 'GO CONDITIONNEL', message: 'Financement possible sous conditions.', color: '#bf5a00' },
  no_go: { label: 'NO GO', message: 'Risque trop élevé.', color: '#c4342d' },
  veto: { label: 'VETO', message: 'Financement bloqué.', color: '#a50e0e' },
};

function getMention(score: number): { mention: string; color: string } {
  if (score >= 17) return { mention: 'Excellent', color: '#2d9d3f' };
  if (score >= 13) return { mention: 'Bon', color: '#34a853' };
  if (score >= 10) return { mention: 'Passable', color: '#bf5a00' };
  if (score >= 7) return { mention: 'Insuffisant', color: '#d93025' };
  if (score >= 4) return { mention: 'Mauvais', color: '#c4342d' };
  return { mention: 'Critique', color: '#a50e0e' };
}

export default function VerdictBanner({ score }: Props) {
  if (!score?.verdict) {
    return (
      <div className="mb-6 p-5 bg-[#f5f5f7] rounded-[16px] text-center">
        <p className="text-[13px] text-[#6e6e73]">Analyse en cours...</p>
      </div>
    );
  }

  const v = VERDICTS[score.verdict];
  const total = score.score_deal_total || 0;
  const mention = getMention(total);

  return (
    <div className="mb-6 p-5 rounded-[16px]" style={{ backgroundColor: `${v.color}06` }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[18px] font-semibold tracking-tight" style={{ color: v.color }}>{v.label}</div>
          <p className="text-[13px] mt-0.5 text-[#6e6e73]">{v.message}</p>
          {score.veto_raison && <p className="text-[12px] mt-1" style={{ color: v.color }}>{score.veto_raison}</p>}
        </div>
        <div className="text-right">
          <div className="text-[36px] font-semibold font-mono leading-none tracking-tighter" style={{ color: mention.color }}>{total.toFixed(1)}</div>
          <div className="text-[11px] font-medium mt-0.5" style={{ color: mention.color }}>/20 — {mention.mention}</div>
        </div>
      </div>
    </div>
  );
}
