'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { DealScore } from '@/types/database';

type Props = { score: DealScore | null; analyzed?: boolean };

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
  { key: 'score_macro_sectoriel_combine', label: 'Mac. / Sec.' },
  { key: 'score_financier', label: 'Financier' },
  { key: 'score_materiel', label: 'Matériel' },
  { key: 'score_dirigeant', label: 'Dirigeant' },
];

// Diamond SVG rosace — 4 axes, viewBox 360x360 for label space
const CX = 180, CY = 180, R = 155;
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

// Dimension syntheses — textes longs pour remplir 2 lignes
function getDimSynthesis(key: keyof DealScore, score: DealScore): string {
  const val = (score[key] as number | null) ?? 0;
  if (key === 'score_macro_sectoriel_combine') {
    if (val >= 14) return 'Contexte macro-économique et sectoriel favorable. Les indicateurs de conjoncture ne montrent aucun signal de ralentissement sur ce secteur d\'activité.';
    if (val >= 10) return 'Environnement macro-économique neutre avec quelques indicateurs sectoriels en zone de vigilance. Le taux de défaillance du secteur reste contenu mais en légère hausse.';
    return 'Contexte macro-économique ou sectoriel dégradé. Le secteur présente un taux de défaillance élevé et des signaux conjoncturels défavorables au financement.';
  }
  if (key === 'score_financier') {
    if (val >= 14) return 'Ratios financiers solides sur l\'ensemble des dimensions analysées. Bonne capacité de remboursement, structure bilancielle saine et trésorerie confortable.';
    if (val >= 10) return 'Ratios financiers corrects dans l\'ensemble mais des points de vigilance identifiés sur la liquidité ou le niveau d\'endettement. Le DSCR reste acceptable.';
    return 'Structure financière fragile avec une capacité de remboursement insuffisante. Les ratios d\'endettement et de liquidité sont en dessous des seuils sectoriels médians.';
  }
  if (key === 'score_materiel') {
    if (val >= 14) return 'Bien facilement récupérable avec une faible dépréciation estimée. La couverture matérielle du financement est excellente sur toute la durée du contrat.';
    if (val >= 10) return 'Bien récupérable mais avec une dépréciation modérée à surveiller. La couverture matérielle est partielle, le point d\'équilibre est atteint en milieu de contrat.';
    return 'Bien difficilement récupérable ou soumis à une forte dépréciation. Le risque matériel est élevé avec une exposition significative en début de contrat.';
  }
  if (key === 'score_dirigeant') {
    if (val >= 14) return 'Dirigeant expérimenté avec un historique entrepreneurial solide. Aucune inscription, procédure collective ou signal négatif identifié sur les mandats passés.';
    if (val >= 10) return 'Historique du dirigeant globalement correct mais certains signaux de vigilance détectés : ancienneté limitée, inscriptions mineures ou changement récent de direction.';
    return 'Signaux négatifs identifiés sur le dirigeant : inscriptions au Trésor ou URSSAF, procédures collectives passées ou historique entrepreneurial présentant des défaillances.';
  }
  return '';
}

export default function RecapBlock({ score, analyzed = true }: Props) {
  const [view, setView] = useState<'rosace' | 'barres'>('rosace');
  const [expanded, setExpanded] = useState<string | null>(null);
  // Par axe : -1 = pas commencé, 0→1 = en cours d'animation
  const [dimProgress, setDimProgress] = useState<number[]>([0, 0, 0, 0]);
  const [revealedDims, setRevealedDims] = useState(-1); // -1 = aucune, 0-3 = dim révélée, 4 = note finale
  const prevShow = useRef(false);
  const animRef = useRef<number[]>([]);

  const show = analyzed && !!score;

  // Animation séquentielle : chaque dimension s'anime une par une
  useEffect(() => {
    if (show && !prevShow.current) {
      // Reset
      setDimProgress([0, 0, 0, 0]);
      setRevealedDims(-1);

      // Annuler les anciens timeouts
      animRef.current.forEach(t => clearTimeout(t));
      animRef.current = [];

      const DELAY_BETWEEN = 1500; // 1.5s entre chaque dimension
      const ANIM_DURATION = 1000; // 1s pour animer chaque axe

      DIMS.forEach((_, i) => {
        const startDelay = 300 + i * DELAY_BETWEEN;

        // Commencer le spinner
        animRef.current.push(window.setTimeout(() => {
          // Animer le progress de cet axe de 0 à 1
          const start = performance.now();
          function tick(now: number) {
            const t = Math.min((now - start) / ANIM_DURATION, 1);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            setDimProgress(prev => {
              const next = [...prev];
              next[i] = eased;
              return next;
            });
            if (t < 1) {
              requestAnimationFrame(tick);
            } else {
              // Animation terminée → révéler la note
              setRevealedDims(i);
            }
          }
          requestAnimationFrame(tick);
        }, startDelay));
      });

      // Note finale + recommandation
      const finalDelay = 300 + DIMS.length * DELAY_BETWEEN + 500;
      animRef.current.push(window.setTimeout(() => setRevealedDims(4), finalDelay));
    }
    if (!show) {
      setDimProgress([0, 0, 0, 0]);
      setRevealedDims(-1);
      animRef.current.forEach(t => clearTimeout(t));
      animRef.current = [];
    }
    prevShow.current = show;

    return () => {
      animRef.current.forEach(t => clearTimeout(t));
    };
  }, [show]);

  const total = show ? (score?.score_deal_total || 0) : 0;
  const verdict = show ? score?.verdict : undefined;
  const v = verdict ? VERDICTS[verdict] : null;
  const scoreColor = show ? getColor(total) : '#a1a1a6';

  // Rosace : chaque axe a son propre progress
  const targetValues = AXIS_KEYS.map(k => show ? ((score?.[k] as number | null) ?? 0) : 0);
  const axisValues = targetValues.map((v, i) => v * dimProgress[i]);

  // Pas de return anticipé — on affiche toujours la structure complète

  return (
    <div className="tile" style={{ padding: '16px', flexShrink: 0 }}>

      {/* Title — same as Entreprise tile */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center" style={{ gap: '16px' }}>
          <h4 className="text-[12px] font-medium" style={{ color: '#2a5082' }}>Synthèse</h4>
          <button onClick={() => setView(view === 'rosace' ? 'barres' : 'rosace')} style={{ fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ color: view === 'rosace' ? '#185FA5' : '#BBB' }}>rosace</span>
            <span style={{ margin: '0 3px', color: '#DDD' }}>|</span>
            <span style={{ color: view === 'barres' ? '#185FA5' : '#BBB' }}>barres</span>
          </button>
        </div>
        <span className="font-medium" style={{ fontSize: '10px', color: 'var(--text-muted)', width: '56px', textAlign: 'center', marginRight: '13px' }}>/20</span>
      </div>

      {/* 2 COLUMNS: Rosace | Contenu droit (verdict + dimensions) */}
      <div className="flex" style={{ gap: '16px' }}>

        {/* LEFT — Rosace SVG (280px) */}
        <div className="shrink-0 flex flex-col items-center justify-center" style={{ width: '320px', minHeight: '340px', paddingLeft: '28px' }}>
          {view === 'rosace' ? (
            <svg viewBox="0 0 360 360" width="320" height="320" style={{ display: 'block' }}>
              {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
                <polygon key={f} points={gridPolygon(f, 4)} fill="none" stroke="#E2E8F0" strokeWidth="1" />
              ))}
              {AXES.map((_, i) => {
                const [x, y] = polarToXY((360 / 4) * i, R);
                return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#E2E8F0" strokeWidth="0.5" />;
              })}
              <polygon
                points={polygonPoints(axisValues, 20)}
                fill="rgba(24,95,165,0.20)" stroke="#185FA5" strokeWidth="2" strokeLinejoin="round"
              />
              {AXES.map((label, i) => {
                const val = axisValues[i];
                const dimColor = getColor(val);
                const angle = (360 / 4) * i;
                const [px, py] = polarToXY(angle, (val / 20) * R);
                const scoreOffX = i === 1 ? 14 : i === 3 ? -14 : 0;
                const scoreOffY = i === 0 ? -14 : i === 2 ? 14 : 0;
                const scoreAnchor = (i === 1 ? 'start' : i === 3 ? 'end' : 'middle') as 'start' | 'middle' | 'end';
                let labelEl: React.ReactNode;
                if (i === 0) {
                  labelEl = (<text x={CX} y={CY - R - 9} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '10px', fill: '#6e6e73', fontWeight: 500 }}>{label}</text>);
                } else if (i === 2) {
                  labelEl = (<text x={CX} y={CY + R + 13} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '10px', fill: '#6e6e73', fontWeight: 500 }}>{label}</text>);
                } else if (i === 1) {
                  labelEl = (<text x={CX + R + 11} y={CY} textAnchor="middle" dominantBaseline="central" transform={`rotate(90, ${CX + R + 11}, ${CY})`} style={{ fontSize: '10px', fill: '#6e6e73', fontWeight: 500 }}>{label}</text>);
                } else {
                  labelEl = (<text x={CX - R - 11} y={CY} textAnchor="middle" dominantBaseline="central" transform={`rotate(-90, ${CX - R - 11}, ${CY})`} style={{ fontSize: '10px', fill: '#6e6e73', fontWeight: 500 }}>{label}</text>);
                }
                return (
                  <g key={i}>
                    {labelEl}
                    <circle cx={px} cy={py} r={7} fill="#185FA5" stroke="white" strokeWidth="2" />
                    <text x={px + scoreOffX} y={py + scoreOffY} textAnchor={scoreAnchor} dominantBaseline="central"
                      style={{ fontSize: '11px', fill: '#6e6e73', fontWeight: 700, fontFamily: 'var(--font-geist-mono), monospace', opacity: revealedDims >= i ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                      {val.toFixed(0)}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="flex-1 flex flex-col justify-center" style={{ padding: '16px 0', gap: '20px' }}>
              {DIMS.map(({ key, label }, idx) => {
                const target = show ? ((score?.[key] as number | null) ?? 0) : 0;
                const val = target * dimProgress[idx];
                const revealed = revealedDims >= idx;
                const c = revealed ? getColor(target) : (dimProgress[idx] > 0 ? '#a1a1a6' : '#d1d5db');
                return (
                  <div key={key}>
                    <div className="flex justify-between" style={{ fontSize: '11px', marginBottom: '6px' }}>
                      <span style={{ color: revealed ? c : 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                      <span className="font-mono font-bold" style={{ color: c }}>
                        {revealed ? target.toFixed(1) : dimProgress[idx] > 0 ? val.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: '10px', background: '#E2E8F0' }}>
                      <div className="h-full rounded-full" style={{ width: `${(val / 20) * 100}%`, backgroundColor: c }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT — mini-cartes par dimension */}
        <div className="flex-1 min-w-0 flex flex-col items-end" style={{ paddingRight: '13px' }}>

          {/* 4 mini-cartes dimension — note centrée verticalement */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '90%' }}>
            {DIMS.map(({ key, label }, idx) => {
              const val = show ? ((score?.[key] as number | null) ?? 0) : 0;
              const revealed = revealedDims >= idx;
              const computing = show && !revealed && dimProgress[idx] > 0;
              const c = revealed ? getColor(val) : '#d1d5db';
              const synthesis = revealed ? getDimSynthesis(key, score) : '';
              const isOpen = revealed ? expanded === key : false;
              return (
                <div key={key}
                  onClick={() => revealed && setExpanded(isOpen ? null : key)}
                  style={{
                    display: 'flex', alignItems: 'stretch', cursor: revealed ? 'pointer' : 'default',
                    background: '#f9f9fb',
                    borderRadius: '6px', overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}>
                  {/* Barre colorée gauche */}
                  <div style={{ width: '3px', background: c, flexShrink: 0, transition: 'background 0.3s ease' }} />
                  {/* Texte */}
                  <div style={{ flex: 1, padding: '8px 10px', minWidth: 0 }}>
                    <div className="flex items-center" style={{ gap: '4px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: revealed ? c : '#6e6e73', transition: 'color 0.3s ease' }}>{label}</span>
                      {revealed && <ChevronDown style={{
                        width: '10px', height: '10px', color: '#BBB',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                      }} strokeWidth={1.5} />}
                      {computing && <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#a1a1a6' }} strokeWidth={2} />}
                    </div>
                    {revealed ? (
                      <p style={{
                        fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.3', margin: 0,
                        animation: 'fadeIn 0.4s ease-out',
                        ...(isOpen
                          ? { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }
                          : { display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }
                        ),
                      }}>
                        {synthesis}
                      </p>
                    ) : (
                      <p style={{ fontSize: '11px', color: '#d1d5db', margin: 0 }}>
                        {computing ? 'Calcul en cours...' : '—'}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center justify-center" style={{ width: '56px' }}>
                    {revealed ? (
                      <span className="font-mono font-bold" style={{ fontSize: '13px', color: c, animation: 'fadeIn 0.4s ease-out' }}>
                        {val.toFixed(1)}
                      </span>
                    ) : computing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#a1a1a6' }} strokeWidth={2} />
                    ) : (
                      <span className="font-mono font-bold" style={{ fontSize: '13px', color: '#d1d5db' }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Espace avant recommandation */}
          <div style={{ marginTop: '14px' }} />

          {/* Recommandation + Note finale — même structure que les mini-cartes */}
          {(() => {
            const recoRevealed = revealedDims >= 4;
            const recoComputing = show && !recoRevealed;
            const isRecoOpen = recoRevealed ? expanded === 'reco' : false;
            const recoColor = recoRevealed ? (v ? v.color : '#B45309') : '#6e6e73';
            const recoBg = recoRevealed ? (v ? v.bg : '#FFF7E6') : '#f9f9fb';
            const recoBorder = recoRevealed ? (v ? v.border : '#F59E0B') : '#d1d5db';
            return (
              <div
                onClick={() => show && setExpanded(isRecoOpen ? null : 'reco')}
                style={{
                  display: 'flex', alignItems: 'stretch',
                  width: '90%',
                  background: recoBg,
                  border: `0.5px solid ${recoBorder}`,
                  borderRadius: '6px', overflow: 'hidden',
                  boxShadow: show ? '0 3px 10px rgba(0,0,0,0.10)' : '0 2px 6px rgba(0,0,0,0.08)',
                  cursor: show ? 'pointer' : 'default',
                }}>
                {/* Barre colorée gauche */}
                <div style={{ width: '3px', background: recoBorder, flexShrink: 0 }} />
                {/* Contenu */}
                <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
                  <div className="flex items-center" style={{ gap: '6px', marginBottom: recoRevealed ? '8px' : '0' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: recoColor }}>Recommandation</span>
                    {recoComputing && <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#a1a1a6' }} strokeWidth={2} />}
                    {recoRevealed && <ChevronDown style={{
                      width: '10px', height: '10px', color: recoColor,
                      transform: isRecoOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }} strokeWidth={1.5} />}
                    {recoRevealed && v && (
                      <span className="font-medium" style={{
                        fontSize: '10px', background: 'white', border: `0.5px solid ${recoBorder}`,
                        color: recoColor, borderRadius: '6px',
                        padding: '3px 10px', whiteSpace: 'nowrap',
                        animation: 'fadeIn 0.4s ease-out',
                      }}>
                        {v.label}
                      </span>
                    )}
                  </div>
                  {recoRevealed && score?.recommandation && (
                    <p style={{
                      fontSize: '11px', color: recoColor, lineHeight: '1.4', margin: 0,
                      animation: 'fadeIn 0.4s ease-out',
                      ...(isRecoOpen
                        ? { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }
                        : { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }
                      ),
                    }}>
                      {score?.recommandation}
                    </p>
                  )}
                </div>
                {/* Note à droite */}
                <div className="shrink-0 flex items-center justify-center" style={{ width: '56px', marginRight: '4px' }}>
                  {recoRevealed ? (
                    <span className="font-mono font-bold" style={{ fontSize: '20px', color: scoreColor, animation: 'fadeIn 0.4s ease-out' }}>
                      {total.toFixed(1)}
                    </span>
                  ) : recoComputing ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#a1a1a6' }} strokeWidth={2} />
                  ) : (
                    <span className="font-mono font-bold" style={{ fontSize: '20px', color: '#d1d5db' }}>—</span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
