'use client';

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { DealScore } from '@/types/database';

type Props = {
  score: DealScore | null;
};

export default function RadarChart({ score }: Props) {
  const data = [
    {
      dimension: 'Macro/Sectoriel',
      value: score?.score_macro_sectoriel_combine || 0,
      fullMark: 20,
    },
    {
      dimension: 'Financier',
      value: score?.score_financier || 0,
      fullMark: 20,
    },
    {
      dimension: 'Matériel',
      value: score?.score_materiel || 0,
      fullMark: 20,
    },
    {
      dimension: 'Dirigeant',
      value: score?.score_dirigeant || 0,
      fullMark: 20,
    },
    {
      dimension: 'Global',
      value: score?.score_deal_total || 0,
      fullMark: 20,
    },
  ];

  if (!score) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[#a1a1a6] text-sm">
        En attente des scores...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#4A5568', fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 20]}
          tick={{ fill: '#8A95A3', fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#1B4FD8"
          fill="#1B4FD8"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
