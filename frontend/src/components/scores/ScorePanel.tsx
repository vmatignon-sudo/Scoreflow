'use client';

import { FileDown, Share2 } from 'lucide-react';
import type { DealScore } from '@/types/database';

type Props = { score: DealScore | null };

function getMention(score: number): { mention: string; color: string } {
  if (score >= 17) return { mention: 'Excellent', color: '#2d9d3f' };
  if (score >= 13) return { mention: 'Bon', color: '#34a853' };
  if (score >= 10) return { mention: 'Passable', color: '#bf5a00' };
  if (score >= 7) return { mention: 'Insuffisant', color: '#d93025' };
  if (score >= 4) return { mention: 'Mauvais', color: '#c4342d' };
  return { mention: 'Critique', color: '#a50e0e' };
}

const VERDICTS: Record<string, { label: string; color: string }> = {
  go: { label: 'GO', color: '#2d9d3f' },
  go_conditionnel: { label: 'GO CONDITIONNEL', color: '#bf5a00' },
  no_go: { label: 'NO GO', color: '#c4342d' },
  veto: { label: 'VETO', color: '#a50e0e' },
};

const DIMS = [
  { key: 'score_macro_sectoriel_combine' as const, label: 'Macro & Sectoriel' },
  { key: 'score_financier' as const, label: 'Financier' },
  { key: 'score_materiel' as const, label: 'Matériel' },
  { key: 'score_dirigeant' as const, label: 'Dirigeant' },
];

export default function ScorePanel({ score }: Props) {
  const total = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const mention = getMention(total);
  const v = verdict ? VERDICTS[verdict] : null;

  return (
    <>
      {/* Desktop — right panel 400px */}
      <div className="hidden xl:block fixed right-0 top-0 w-[400px] h-screen bg-white shadow-xl overflow-y-auto z-20">
        <div className="p-7">
          {/* Verdict — dominant */}
          {v && (
            <div className="rounded-[18px] px-6 py-5 mb-6 text-center" style={{ backgroundColor: `${v.color}0C` }}>
              <div className="text-[22px] font-bold tracking-tight" style={{ color: v.color }}>
                {v.label}
              </div>
              <p className="text-[12px] mt-1" style={{ color: `${v.color}99` }}>
                {v.label === 'GO' ? 'Analyse favorable' :
                 v.label === 'GO CONDITIONNEL' ? 'Financement sous conditions' :
                 v.label === 'NO GO' ? 'Risque trop élevé' : 'Financement bloqué'}
              </p>
            </div>
          )}

          {/* Gauge — 200px diameter */}
          <div className="text-center mb-7">
            <div className="relative inline-block">
              <svg viewBox="0 0 220 130" className="w-[200px] mx-auto">
                <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="#f0f0f2" strokeWidth="10" strokeLinecap="round" />
                <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke={mention.color} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${(total / 20) * 282.6} 282.6`}
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              </svg>
              <div className="absolute inset-0 flex items-end justify-center pb-2">
                <div>
                  <div className="text-[42px] font-bold font-mono leading-none tracking-tighter" style={{ color: mention.color }}>
                    {total.toFixed(1)}
                  </div>
                  <div className="text-[13px] font-semibold mt-1" style={{ color: mention.color }}>
                    /20 — {mention.mention}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dimensions — thick bars */}
          <div className="space-y-4 mb-7">
            {DIMS.map(({ key, label }) => {
              const val = score?.[key] ?? null;
              const m = val !== null ? getMention(val) : null;
              return (
                <div key={key}>
                  <div className="flex justify-between text-[12px] mb-2">
                    <span className="text-[#6e6e73] font-medium">{label}</span>
                    <span className="font-mono font-bold text-[14px]" style={{ color: m?.color || '#a1a1a6' }}>
                      {val !== null ? val.toFixed(1) : '—'}
                      <span className="text-[11px] text-[#a1a1a6] font-normal">/20</span>
                    </span>
                  </div>
                  <div className="h-[6px] bg-[#f0f0f2] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: val !== null ? `${(val / 20) * 100}%` : '0%',
                      backgroundColor: m?.color || 'transparent',
                      transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommandation */}
          {score?.recommandation && (
            <div className="bg-[#f5f5f7] rounded-[16px] p-4 mb-6">
              <p className="text-[11px] text-[#6e6e73] font-semibold uppercase tracking-wide mb-1.5">Recommandation</p>
              <p className="text-[13px] text-[#424245] leading-[1.5]">{score.recommandation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5">
            <button className="w-full inline-flex items-center justify-center gap-2 bg-[#1e40af] text-white py-3 rounded-[14px] text-[14px] font-medium hover:bg-[#1e3a8a] active:scale-[0.98] transition-all">
              <FileDown className="w-4 h-4" strokeWidth={1.8} />
              Exporter PDF
            </button>
            <button className="w-full inline-flex items-center justify-center gap-2 bg-[#f5f5f7] text-[#424245] py-3 rounded-[14px] text-[14px] font-medium hover:bg-[#ededf0] active:scale-[0.98] transition-all">
              <Share2 className="w-4 h-4" strokeWidth={1.8} />
              Partager avec la banque
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-black/[0.04]">
            <p className="text-[11px] text-[#a1a1a6] leading-relaxed">Le modèle est fixe. Seules les conditions du deal varient.</p>
            {score?.computed_at && <p className="text-[11px] text-[#a1a1a6] mt-1">Calculé le {new Date(score.computed_at).toLocaleDateString('fr-FR')}</p>}
          </div>
        </div>
      </div>

      {/* Mobile — bottom sticky bar */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/95 glass shadow-xl border-t border-black/[0.04] z-20 px-5 py-3 sm:ml-[64px]">
        <div className="flex items-center justify-between max-w-[600px] mx-auto">
          {v && (
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-bold" style={{ color: v.color }}>{v.label}</span>
              <span className="text-[24px] font-bold font-mono tracking-tighter" style={{ color: mention.color }}>
                {total.toFixed(1)}<span className="text-[13px] text-[#a1a1a6] font-normal">/20</span>
              </span>
            </div>
          )}
          <button className="bg-[#1e40af] text-white px-4 py-2 rounded-[10px] text-[12px] font-medium">
            Détails
          </button>
        </div>
      </div>
    </>
  );
}
