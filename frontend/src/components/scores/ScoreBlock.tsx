'use client';

import { FileDown, Lightbulb } from 'lucide-react';
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

const VERDICTS: Record<string, { label: string; color: string; message: string }> = {
  go: { label: 'GO', color: '#2d9d3f', message: 'Analyse favorable — financement recommandé' },
  go_conditionnel: { label: 'GO CONDITIONNEL', color: '#bf5a00', message: 'Financement possible sous conditions' },
  no_go: { label: 'NO GO', color: '#c4342d', message: 'Risque trop élevé — financement déconseillé' },
  veto: { label: 'VETO', color: '#a50e0e', message: 'Conditions bloquantes — financement impossible' },
};

const DIMS: { key: keyof DealScore; label: string; short: string }[] = [
  { key: 'score_macro_sectoriel_combine', label: 'Macro & Sectoriel', short: 'Macro' },
  { key: 'score_financier', label: 'Financier', short: 'Financier' },
  { key: 'score_materiel', label: 'Matériel', short: 'Matériel' },
  { key: 'score_dirigeant', label: 'Dirigeant', short: 'Dirigeant' },
];

export default function ScoreBlock({ score }: Props) {
  const total = score?.score_deal_total || 0;
  const verdict = score?.verdict;
  const v = verdict ? VERDICTS[verdict] : null;
  const color = getColor(total);
  const mention = getMention(total);

  const radarData = DIMS.map(({ key, short }) => ({
    dimension: short,
    value: (score?.[key] as number | null) ?? 0,
    fullMark: 20,
  }));

  if (!score) {
    return (
      <div className="bg-white rounded-[20px] shadow p-6 text-center">
        <p className="text-[13px] text-[#6e6e73]">Analyse en attente...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] shadow overflow-hidden">
      {/* Top section: radar + synthesis + score */}
      <div className="flex flex-col lg:flex-row items-center gap-6 p-6">

        {/* LEFT — Radar pentagon */}
        <div className="w-[200px] h-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#e8e8ed" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#6e6e73', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 20]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#1e40af" fill="#1e40af" fillOpacity={0.12} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* MIDDLE — Synthesis text */}
        <div className="flex-1 min-w-0">
          {v && (
            <div className="mb-3">
              <span className="text-[20px] font-bold tracking-tight" style={{ color: v.color }}>
                {v.label}
              </span>
              <p className="text-[12px] text-[#6e6e73] mt-0.5">{v.message}</p>
            </div>
          )}
          {score.recommandation && (
            <p className="text-[12px] text-[#424245] leading-[1.5] bg-[#f5f5f7] rounded-[10px] px-3 py-2">
              {score.recommandation}
            </p>
          )}
        </div>

        {/* RIGHT — Score big */}
        <div className="text-center shrink-0">
          <div className="text-[48px] font-bold font-mono tracking-tighter leading-none" style={{ color }}>
            {total.toFixed(1)}
          </div>
          <div className="text-[14px] font-semibold mt-1" style={{ color }}>
            /20 — {mention}
          </div>
        </div>
      </div>

      {/* 5 dimension bars */}
      <div className="px-6 pb-4 space-y-2.5">
        {DIMS.map(({ key, label }) => {
          const val = (score?.[key] as number | null) ?? null;
          const c = val !== null ? getColor(val) : '#d4d4d8';
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-[11px] text-[#6e6e73] w-[120px] shrink-0 truncate">{label}</span>
              <div className="flex-1 h-[6px] bg-[#f0f0f2] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: val !== null ? `${(val / 20) * 100}%` : '0%',
                  backgroundColor: c,
                }} />
              </div>
              <span className="text-[12px] font-mono font-bold w-[36px] text-right" style={{ color: c }}>
                {val !== null ? val.toFixed(0) : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-6 pb-5">
        <button className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1e40af] text-white py-2.5 rounded-[12px] text-[13px] font-medium hover:bg-[#1e3a8a] active:scale-[0.98] transition-all">
          <FileDown className="w-4 h-4" strokeWidth={1.8} />
          Exporter PDF
        </button>
        {verdict && (verdict === 'go_conditionnel' || verdict === 'no_go') && (
          <button className="flex-1 inline-flex items-center justify-center gap-2 bg-[#bf5a00]/10 text-[#bf5a00] py-2.5 rounded-[12px] text-[13px] font-medium hover:bg-[#bf5a00]/15 transition-all">
            <Lightbulb className="w-4 h-4" strokeWidth={1.8} />
            Optimiser le deal
          </button>
        )}
      </div>
    </div>
  );
}
