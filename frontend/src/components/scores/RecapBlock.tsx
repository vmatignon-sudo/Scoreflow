'use client';

import { useState } from 'react';
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

const DIMS: { key: keyof DealScore; label: string; color: string }[] = [
  { key: 'score_macro_sectoriel_combine', label: 'Mac. / Sec.', color: '#185FA5' },
  { key: 'score_financier', label: 'Financier', color: '#EF6C00' },
  { key: 'score_materiel', label: 'Matériel', color: '#059669' },
  { key: 'score_dirigeant', label: 'Dirigeant', color: '#185FA5' },
];

// Diamond SVG rosace — 4 axes, viewBox 360x360 for label space
const CX = 180, CY = 180, R = 120;
const AXES = ['Mac. / Sec.', 'Financier', 'Matériel', 'Dirigeant'];
const AXIS_KEYS: (keyof DealScore)[] = [
  'score_macro_sectoriel_combine', 'score_financier', 'score_materiel', 'score_dirigeant',
];

function polarToXY(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function polygonPoints(values: number[], max: number): string {
  return values.map((v, i) => {
    const angle = (360 / values.length) * i;
    const r = (v / max) * R;
    const [x, y] = polarToXY(angle, r);
    return `${x},${y}`;
  }).join(' ');
}

function gridPolygon(fraction: number, count: number): string {
  return Array.from({ length: count }, (_, i) => {
    const angle = (360 / count) * i;
    const [x, y] = polarToXY(angle, R * fraction);
    return `${x},${y}`;
  }).join(' ');
}

// Dimension syntheses
function getDimSynthesis(key: keyof DealScore, score: DealScore): string {
  const val = (score[key] as number | null) ?? 0;
  if (key === 'score_macro_sectoriel_combine') {
    if (val >= 14) return 'Contexte macro et sectoriel favorable. Pas de signal de ralentissement identifié.';
    if (val >= 10) return 'Environnement neutre. Quelques indicateurs sectoriels en zone de vigilance.';
    return 'Contexte macro ou sectoriel dégradé. Risque exogène identifié.';
  }
  if (key === 'score_financier') {
    if (val >= 14) return 'Ratios financiers solides. Bonne capacité de remboursement et structure saine.';
    if (val >= 10) return 'Ratios corrects mais points de vigilance sur la liquidité ou l\'endettement.';
    return 'Structure financière fragile. Capacité de remboursement insuffisante.';
  }
  if (key === 'score_materiel') {
    if (val >= 14) return 'Bien facilement récupérable avec faible dépréciation. Bonne couverture matérielle.';
    if (val >= 10) return 'Bien récupérable mais dépréciation modérée. Couverture partielle.';
    return 'Bien difficilement récupérable ou forte dépréciation. Risque matériel élevé.';
  }
  if (key === 'score_dirigeant') {
    if (val >= 14) return 'Dirigeant expérimenté, historique clean. Aucune inscription ou procédure.';
    if (val >= 10) return 'Historique correct mais vigilance sur certains signaux (ancienneté, inscriptions).';
    return 'Signaux négatifs sur le dirigeant. Inscriptions ou historique problématique.';
  }
  return '';
}

export default function RecapBlock({ score }: Props) {
  const [view, setView] = useState<'rosace' | 'barres'>('rosace');
  const total = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const v = verdict ? VERDICTS[verdict] : null;
  const scoreColor = getColor(total);

  const axisValues = AXIS_KEYS.map(k => (score?.[k] as number | null) ?? 0);

  if (!score) {
    return (
      <div style={{
        background: 'white', border: '0.5px solid #E2E8F0', borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '16px', minHeight: '120px',
      }}>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Analyse en attente...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white', border: '0.5px solid #E2E8F0', borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '32px 16px 16px 16px',
      flexShrink: 0,
    }}>

      {/* TOP LINE: Synthèse (left) — Verdict + Score (right) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#185FA5', lineHeight: '1', paddingTop: '2px' }}>Synthèse</span>

        {/* Verdict + Note + Mention — centered on same axis */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          {v && (
            <span className="font-medium rounded-full" style={{
              fontSize: '14px', background: v.bg, border: `1px solid ${v.border}`, color: v.color,
              padding: '8px 20px', whiteSpace: 'nowrap',
            }}>
              {v.label}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="font-bold font-mono leading-none tracking-tight" style={{ fontSize: '44px', color: scoreColor }}>
              {total.toFixed(1)}
            </span>
            <span className="font-medium" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/20</span>
          </div>
          <span className="font-semibold" style={{ fontSize: '16px', color: scoreColor }}>{getMention(total)}</span>
        </div>
      </div>

      {/* ROSACE + SYNTHÈSE TEXT */}
      <div className="flex" style={{ gap: '24px' }}>

        {/* Left — Rosace SVG */}
        <div className="shrink-0" style={{ width: '320px' }}>
          {view === 'rosace' ? (
            <svg viewBox="0 0 360 360" width="320" height="320" style={{ display: 'block' }}>
              {/* 5 grid polygons (20% 40% 60% 80% 100%) */}
              {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
                <polygon key={f} points={gridPolygon(f, 4)} fill="none" stroke="#E2E8F0" strokeWidth="1" />
              ))}
              {/* Axis lines */}
              {AXES.map((_, i) => {
                const [x, y] = polarToXY((360 / 4) * i, R);
                return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#E2E8F0" strokeWidth="0.5" />;
              })}
              {/* Data polygon */}
              <polygon
                points={polygonPoints(axisValues, 20)}
                fill="rgba(24,95,165,0.20)" stroke="#185FA5" strokeWidth="2" strokeLinejoin="round"
              />
              {/* Data points + labels + permanent score */}
              {AXES.map((label, i) => {
                const val = axisValues[i];
                const angle = (360 / 4) * i;
                const [px, py] = polarToXY(angle, (val / 20) * R);
                // Score label offset from point
                const scoreOffX = i === 1 ? 14 : i === 3 ? -14 : 0;
                const scoreOffY = i === 0 ? -14 : i === 2 ? 14 : 0;
                const scoreAnchor = (i === 1 ? 'start' : i === 3 ? 'end' : 'middle') as 'start' | 'middle' | 'end';

                // Label positions: top/bottom horizontal, left/right vertical
                let labelEl: React.ReactNode;
                if (i === 0) {
                  // Top — horizontal
                  labelEl = (
                    <text x={CX} y={CY - R - 28} textAnchor="middle" dominantBaseline="central"
                      style={{ fontSize: '11px', fill: '#4A5568', fontWeight: 500 }}>
                      {label}
                    </text>
                  );
                } else if (i === 2) {
                  // Bottom — horizontal
                  labelEl = (
                    <text x={CX} y={CY + R + 32} textAnchor="middle" dominantBaseline="central"
                      style={{ fontSize: '11px', fill: '#4A5568', fontWeight: 500 }}>
                      {label}
                    </text>
                  );
                } else if (i === 1) {
                  // Right — vertical text
                  labelEl = (
                    <text x={CX + R + 28} y={CY} textAnchor="middle" dominantBaseline="central"
                      transform={`rotate(90, ${CX + R + 28}, ${CY})`}
                      style={{ fontSize: '11px', fill: '#4A5568', fontWeight: 500 }}>
                      {label}
                    </text>
                  );
                } else {
                  // Left — vertical text
                  labelEl = (
                    <text x={CX - R - 28} y={CY} textAnchor="middle" dominantBaseline="central"
                      transform={`rotate(-90, ${CX - R - 28}, ${CY})`}
                      style={{ fontSize: '11px', fill: '#4A5568', fontWeight: 500 }}>
                      {label}
                    </text>
                  );
                }

                return (
                  <g key={i}>
                    {labelEl}
                    {/* Point */}
                    <circle cx={px} cy={py} r={7} fill="#185FA5" stroke="white" strokeWidth="2" />
                    {/* Permanent score label next to point */}
                    <text x={px + scoreOffX} y={py + scoreOffY} textAnchor={scoreAnchor} dominantBaseline="central"
                      style={{ fontSize: '11px', fill: '#185FA5', fontWeight: 700, fontFamily: 'var(--font-geist-mono), monospace' }}>
                      {val.toFixed(0)}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="space-y-3" style={{ padding: '16px 0' }}>
              {DIMS.map(({ key, label }) => {
                const val = (score?.[key] as number | null) ?? 0;
                const c = getColor(val);
                return (
                  <div key={key}>
                    <div className="flex justify-between" style={{ fontSize: '10px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span className="font-mono font-bold" style={{ color: c }}>{val.toFixed(0)}/20</span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: '6px', background: '#E2E8F0' }}>
                      <div className="h-full rounded-full" style={{ width: `${(val / 20) * 100}%`, backgroundColor: c, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Toggle */}
          <div className="text-center" style={{ marginTop: '4px' }}>
            <button onClick={() => setView(view === 'rosace' ? 'barres' : 'rosace')} style={{ fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ color: view === 'rosace' ? '#185FA5' : '#BBB' }}>rosace</span>
              <span style={{ margin: '0 4px', color: '#DDD' }}>·</span>
              <span style={{ color: view === 'barres' ? '#185FA5' : '#BBB' }}>barres</span>
            </button>
          </div>
        </div>

        {/* Right — Dimension syntheses */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: '240px' }}>
          {/* 4 dimension lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {DIMS.map(({ key, label, color }) => {
              const val = (score?.[key] as number | null) ?? 0;
              const synthesis = getDimSynthesis(key, score);
              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', alignItems: 'start', minHeight: '35px' }}>
                  <div className="flex items-center" style={{ gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color }}>{label}</span>
                    <span className="font-mono" style={{ fontSize: '11px', color: '#BBB' }}>{val.toFixed(0)}/20</span>
                  </div>
                  <p style={{
                    fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.3',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    margin: 0,
                  }}>
                    {synthesis}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Recommandation — full-width orange card */}
          {score.recommandation && (
            <div style={{
              background: '#FFF7E6', border: '0.5px solid #F59E0B', borderRadius: '8px',
              padding: '12px 16px', marginTop: '12px',
            }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#B45309', margin: '0 0 4px 0' }}>Recommandation</p>
              <p style={{
                fontSize: '12px', color: '#92400E', lineHeight: '1.5', margin: 0,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {score.recommandation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
