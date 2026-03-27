'use client';

import { FileDown, Lightbulb } from 'lucide-react';
import type { DealScore } from '@/types/database';

type Props = { score: DealScore | null };

function getColor(score: number): string {
  if (score >= 14) return '#2d9d3f';
  if (score >= 10) return '#bf5a00';
  return '#c4342d';
}

function getMention(score: number): string {
  if (score >= 17) return 'Excellent';
  if (score >= 13) return 'Bon';
  if (score >= 10) return 'Passable';
  if (score >= 7) return 'Insuffisant';
  if (score >= 4) return 'Mauvais';
  return 'Critique';
}

const VERDICTS: Record<string, { label: string; color: string }> = {
  go: { label: 'GO', color: '#2d9d3f' },
  go_conditionnel: { label: 'GO COND.', color: '#bf5a00' },
  no_go: { label: 'NO GO', color: '#c4342d' },
  veto: { label: 'VETO', color: '#a50e0e' },
};

const DIMS: { key: keyof DealScore; short: string }[] = [
  { key: 'score_macro_sectoriel_combine', short: 'M' },
  { key: 'score_financier', short: 'F' },
  { key: 'score_materiel', short: 'B' },
  { key: 'score_dirigeant', short: 'D' },
];

export default function BottomBar({ score }: Props) {
  const total = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const v = verdict ? VERDICTS[verdict] : null;
  const color = getColor(total);
  const mention = getMention(total);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white shadow-[0_-2px_16px_rgba(0,0,0,0.06)] sm:ml-[56px]">
      <div className="flex items-center justify-between h-[80px] px-5 sm:px-8 max-w-[1400px] mx-auto">

        {/* Verdict */}
        <div className="flex items-center gap-5">
          {v && (
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
              <span className="text-[18px] sm:text-[20px] font-bold tracking-tight" style={{ color: v.color }}>
                {v.label}
              </span>
            </div>
          )}

          {/* Score */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] sm:text-[32px] font-bold font-mono tracking-tighter" style={{ color }}>
              {total.toFixed(1)}
            </span>
            <span className="text-[13px] text-[#a1a1a6]">/20</span>
            <span className="text-[12px] font-medium ml-1 hidden sm:inline" style={{ color }}>
              {mention}
            </span>
          </div>
        </div>

        {/* 4 dimension dots */}
        <div className="hidden md:flex items-center gap-3">
          {DIMS.map(({ key, short }) => {
            const val = (score?.[key] as number | null) ?? null;
            const c = val !== null ? getColor(val) : '#d4d4d8';
            return (
              <div key={key} className="flex items-center gap-1.5" title={`${short}: ${val?.toFixed(1) || '—'}/20`}>
                <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: c }} />
                <span className="text-[11px] font-mono font-semibold text-[#424245]">
                  {short}
                </span>
                <span className="text-[12px] font-mono font-bold" style={{ color: c }}>
                  {val !== null ? val.toFixed(0) : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {score?.verdict && (score.verdict === 'go_conditionnel' || score.verdict === 'no_go') && (
            <button className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[#bf5a00]/10 text-[#bf5a00] rounded-[10px] text-[12px] font-medium hover:bg-[#bf5a00]/15 transition-all">
              <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.8} />
              Optimiser
            </button>
          )}
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1e40af] text-white rounded-[10px] text-[12px] font-medium hover:bg-[#1e3a8a] active:scale-[0.98] transition-all">
            <FileDown className="w-3.5 h-3.5" strokeWidth={1.8} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
