'use client';

import { useState } from 'react';
import { FileDown, Lightbulb } from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import type { DealScore } from '@/types/database';

type Props = { score: DealScore | null };

function getColor(v: number): string {
  if (v >= 14) return '#059669';
  if (v >= 10) return '#B45309';
  return '#DC2626';
}

function getMention(v: number): string {
  if (v >= 17) return 'Excellent';
  if (v >= 13) return 'Bon';
  if (v >= 10) return 'Passable';
  if (v >= 7) return 'Insuffisant';
  if (v >= 4) return 'Mauvais';
  return 'Critique';
}

const VERDICTS: Record<string, { label: string; bg: string; border: string; color: string }> = {
  go: { label: 'GO', bg: '#F0FDF4', border: '#059669', color: '#059669' },
  go_conditionnel: { label: 'GO CONDITIONNEL', bg: '#FFF7E6', border: '#F59E0B', color: '#B45309' },
  no_go: { label: 'NO GO', bg: '#FEF2F2', border: '#DC2626', color: '#DC2626' },
  veto: { label: 'VETO', bg: '#FEF2F2', border: '#DC2626', color: '#991B1B' },
};

const DIMS: { key: keyof DealScore; label: string }[] = [
  { key: 'score_macro_sectoriel_combine', label: 'Macro' },
  { key: 'score_financier', label: 'Financier' },
  { key: 'score_materiel', label: 'Matériel' },
  { key: 'score_dirigeant', label: 'Dirigeant' },
];

export default function RecapBlock({ score }: Props) {
  const [view, setView] = useState<'rosace' | 'barres'>('rosace');
  const total = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const v = verdict ? VERDICTS[verdict] : null;
  const scoreColor = getColor(total);

  const radarData = DIMS.map(({ key, label }) => {
    const val = (score?.[key] as number | null) ?? 0;
    return { dimension: label, value: val, fullMark: 20 };
  });

  if (!score) {
    return (
      <div className="tile" style={{ padding: '16px', minHeight: '120px' }}>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Analyse en attente...</p>
      </div>
    );
  }

  return (
    <div className="tile" style={{ padding: '16px', minHeight: '320px' }}>

      {/* TOP LINE: Récap badge (left) — Verdict + Score GROS (right) */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-white rounded-[6px]"
          style={{ background: 'var(--accent)', padding: '4px 12px' }}>
          Récap
        </span>

        <div className="flex items-center gap-4">
          {/* Verdict — GROS et coloré */}
          {v && (
            <span className="text-[16px] font-bold rounded-full" style={{
              background: v.bg, border: `1px solid ${v.border}`, color: v.color,
              padding: '6px 20px',
            }}>
              {v.label}
            </span>
          )}
          {/* Score — GROS et coloré */}
          <div className="text-right">
            <span className="text-[36px] font-bold font-mono leading-none tracking-tight" style={{ color: scoreColor }}>
              {total.toFixed(1)}
            </span>
            <span className="text-[16px] font-medium ml-0.5" style={{ color: 'var(--text-muted)' }}>/20</span>
            <p className="text-[14px] font-semibold" style={{ color: scoreColor }}>{getMention(total)}</p>
          </div>
        </div>
      </div>

      {/* ROSACE (big) + SYNTHÈSE (small) */}
      <div className="flex gap-3" style={{ minHeight: '260px', alignItems: 'stretch' }}>

        {/* Rosace — takes more space */}
        <div className="shrink-0" style={{ width: '280px' }}>
          {view === 'rosace' ? (
            <div style={{ width: '280px', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#4A5568', fontSize: 11, fontWeight: 500 }} />
                  <PolarRadiusAxis domain={[0, 20]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#185FA5" fill="rgba(24,95,165,0.15)" strokeWidth={1.5}
                    dot={{ r: 4, fill: '#185FA5', stroke: '#185FA5' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {DIMS.map(({ key, label }) => {
                const val = (score?.[key] as number | null) ?? 0;
                const c = getColor(val);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span className="font-mono font-bold" style={{ color: c }}>{val.toFixed(0)}/20</span>
                    </div>
                    <div className="h-[6px] rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(val / 20) * 100}%`, backgroundColor: c }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Toggle */}
          <div className="text-center mt-1">
            <button onClick={() => setView(view === 'rosace' ? 'barres' : 'rosace')} className="text-[9px]">
              <span style={{ color: view === 'rosace' ? 'var(--accent)' : '#BBB' }}>rosace</span>
              <span className="mx-1" style={{ color: '#DDD' }}>·</span>
              <span style={{ color: view === 'barres' ? 'var(--accent)' : '#BBB' }}>barres</span>
            </button>
          </div>
        </div>

        {/* Synthèse — smaller, stretches to match rosace height */}
        <div className="flex-1 min-w-0 rounded-[6px] flex flex-col" style={{
          background: 'white', border: '0.5px solid #DDE3EA',
          boxShadow: '2px 3px 8px rgba(0,0,0,0.08)', padding: '12px',
        }}>
          <div className="flex-1 overflow-y-auto">
            {score.recommandation ? (
              <p className="text-[11px] leading-[1.7]" style={{ color: 'var(--text-secondary)' }}>{score.recommandation}</p>
            ) : (
              <p className="text-[11px] leading-[1.7]" style={{ color: 'var(--text-muted)' }}>
                Analyse composite sur 5 dimensions. Chaque dimension est pondérée selon les paramètres de votre organisation.
              </p>
            )}
          </div>
          {/* Buttons — bottom right, very discreet */}
          <div className="flex justify-end gap-2 mt-2 pt-2" style={{ borderTop: '0.5px solid #E2E8F0' }}>
            <button className="inline-flex items-center gap-1 rounded-[4px] text-[8px]" style={{
              border: '0.5px solid #E2E8F0', background: 'white', color: 'var(--text-secondary)', padding: '0 8px', height: '18px',
            }}>
              <FileDown className="w-2.5 h-2.5" strokeWidth={1.5} /> PDF
            </button>
            {verdict && (verdict === 'go_conditionnel' || verdict === 'no_go') && (
              <button className="inline-flex items-center gap-1 rounded-[4px] text-[8px]" style={{
                border: '0.5px solid #E2E8F0', background: 'white', color: 'var(--text-secondary)', padding: '0 8px', height: '18px',
              }}>
                <Lightbulb className="w-2.5 h-2.5" strokeWidth={1.5} /> Optimiser
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
