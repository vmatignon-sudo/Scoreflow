'use client';

import { useState } from 'react';
import { FileDown, Lightbulb, BarChart2, PieChart } from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import type { DealScore } from '@/types/database';

type Props = { score: DealScore | null };

function getColor(v: number): string {
  if (v >= 14) return '#2d9d3f';
  if (v >= 10) return '#bf5a00';
  return '#c4342d';
}

function getMention(v: number): string {
  if (v >= 17) return 'Excellent';
  if (v >= 13) return 'Bon';
  if (v >= 10) return 'Passable';
  if (v >= 7) return 'Insuffisant';
  if (v >= 4) return 'Mauvais';
  return 'Critique';
}

const VERDICTS: Record<string, { label: string; color: string }> = {
  go: { label: 'GO', color: '#2d9d3f' },
  go_conditionnel: { label: 'GO COND.', color: '#bf5a00' },
  no_go: { label: 'NO GO', color: '#c4342d' },
  veto: { label: 'VETO', color: '#a50e0e' },
};

const DIMS: { key: keyof DealScore; label: string; radarLabel: string }[] = [
  { key: 'score_macro_sectoriel_combine', label: 'Macro & Sectoriel', radarLabel: 'Macro' },
  { key: 'score_financier', label: 'Financier', radarLabel: 'Financier' },
  { key: 'score_materiel', label: 'Matériel', radarLabel: 'Matériel' },
  { key: 'score_dirigeant', label: 'Dirigeant', radarLabel: 'Dirigeant' },
];

export default function ScoreBlock({ score }: Props) {
  const [view, setView] = useState<'radar' | 'bars'>('radar');
  const total = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const v = verdict ? VERDICTS[verdict] : null;
  const color = getColor(total);

  const radarData = DIMS.map(({ key, radarLabel }) => {
    const val = (score?.[key] as number | null) ?? 0;
    return { dimension: `${radarLabel} ${val.toFixed(0)}`, value: val, fullMark: 20 };
  });

  if (!score) {
    return (
      <div className="rounded-[8px] p-5 text-center" style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)' }}>
        <p className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>Analyse en attente...</p>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] overflow-hidden" style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)' }}>
      <div className="p-5">
        {/* Top row: toggle left, score+verdict right */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex rounded-[6px] p-0.5" style={{ background: 'var(--color-background-secondary)' }}>
            <button onClick={() => setView('radar')} className="p-1.5 rounded-[5px] transition-all"
              style={{ background: view === 'radar' ? 'var(--color-background-primary)' : 'transparent', boxShadow: view === 'radar' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
              <PieChart className="w-3.5 h-3.5" style={{ color: view === 'radar' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }} strokeWidth={1.8} />
            </button>
            <button onClick={() => setView('bars')} className="p-1.5 rounded-[5px] transition-all"
              style={{ background: view === 'bars' ? 'var(--color-background-primary)' : 'transparent', boxShadow: view === 'bars' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
              <BarChart2 className="w-3.5 h-3.5" style={{ color: view === 'bars' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }} strokeWidth={1.8} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {v && <span className="text-[13px] font-semibold px-2.5 py-0.5 rounded-full" style={{ color: v.color, background: `${v.color}0C` }}>{v.label}</span>}
            <div className="text-right">
              <span className="text-[28px] font-bold font-mono tracking-tighter leading-none" style={{ color }}>{total.toFixed(1)}</span>
              <span className="text-[12px] ml-0.5" style={{ color: 'var(--color-text-tertiary)' }}>/20</span>
              <p className="text-[10px] font-medium" style={{ color }}>{getMention(total)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {view === 'radar' ? (
          <div className="flex gap-4 items-start">
            <div className="w-[200px] h-[170px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="var(--color-border-tertiary)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--color-text-secondary)', fontSize: 9 }} />
                  <PolarRadiusAxis domain={[0, 20]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.10} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0">
              {score.recommandation && <p className="text-[11px] leading-[1.6] mb-3" style={{ color: 'var(--color-text-secondary)' }}>{score.recommandation}</p>}
              <ActionButtons verdict={verdict} />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {DIMS.map(({ key, label }) => {
              const val = (score?.[key] as number | null) ?? null;
              const c = val !== null ? getColor(val) : '#d4d4d8';
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] w-[100px] shrink-0 truncate" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                  <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--color-background-secondary)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: val !== null ? `${(val / 20) * 100}%` : '0%', backgroundColor: c }} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold w-[28px] text-right" style={{ color: c }}>{val !== null ? val.toFixed(0) : '—'}</span>
                </div>
              );
            })}
            {score.recommandation && <p className="text-[11px] leading-[1.6] mt-2 pt-2" style={{ color: 'var(--color-text-secondary)', borderTop: '0.5px solid var(--color-border-tertiary)' }}>{score.recommandation}</p>}
            <ActionButtons verdict={verdict} />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButtons({ verdict }: { verdict: string | null | undefined }) {
  return (
    <div className="flex gap-2 mt-2">
      <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[10px] font-medium transition-all" style={{ background: 'var(--color-accent)', color: 'white' }}>
        <FileDown className="w-3 h-3" strokeWidth={1.8} /> PDF
      </button>
      {verdict && (verdict === 'go_conditionnel' || verdict === 'no_go') && (
        <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[10px] font-medium transition-all" style={{ background: '#bf5a000F', color: '#bf5a00' }}>
          <Lightbulb className="w-3 h-3" strokeWidth={1.8} /> Optimiser
        </button>
      )}
    </div>
  );
}
