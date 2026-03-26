'use client';

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

type Signal = { text: string; type: 'positive' | 'negative' | 'warning' };

type Props = {
  score: number | null;
  label: string;
  signals?: Signal[];
};

function getMention(score: number): { mention: string; color: string; bg: string } {
  if (score >= 17) return { mention: 'Excellent', color: '#2d9d3f', bg: '#2d9d3f' };
  if (score >= 13) return { mention: 'Bon', color: '#2d9d3f', bg: '#2d9d3f' };
  if (score >= 10) return { mention: 'Passable', color: '#bf5a00', bg: '#bf5a00' };
  if (score >= 7) return { mention: 'Insuffisant', color: '#c4342d', bg: '#c4342d' };
  if (score >= 4) return { mention: 'Mauvais', color: '#c4342d', bg: '#c4342d' };
  return { mention: 'Critique', color: '#a50e0e', bg: '#a50e0e' };
}

export default function ScoreExplainer({ score, label, signals }: Props) {
  const m = score !== null ? getMention(score) : null;

  return (
    <div className="bg-white rounded-[20px] shadow p-6">
      {/* Score header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-semibold text-[#2d2d2d]">{label}</h3>
        {score !== null && m && (
          <div className="flex items-center gap-2.5">
            <span className="text-[28px] font-semibold font-mono tracking-tighter" style={{ color: m.color }}>
              {score.toFixed(1)}
            </span>
            <div className="text-right">
              <span className="text-[11px] text-[#6e6e73]">/20</span>
              <div className="text-[11px] font-medium" style={{ color: m.color }}>{m.mention}</div>
            </div>
          </div>
        )}
      </div>

      {/* Score bar */}
      {score !== null && m && (
        <div className="h-[4px] bg-[#f5f5f7] rounded-full overflow-hidden mb-5">
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${(score / 20) * 100}%`,
            backgroundColor: m.color,
          }} />
        </div>
      )}

      {/* Signals */}
      {signals && signals.length > 0 && (
        <div className="space-y-2">
          {signals.map((s, i) => (
            <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-[12px] text-[13px] ${
              s.type === 'positive' ? 'bg-[#2d9d3f]/[0.06] text-[#1a7c2f]' :
              s.type === 'negative' ? 'bg-[#c4342d]/[0.06] text-[#a52a24]' :
              'bg-[#bf5a00]/[0.06] text-[#995200]'
            }`}>
              {s.type === 'positive' && <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.8} />}
              {s.type === 'negative' && <XCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.8} />}
              {s.type === 'warning' && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.8} />}
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
