'use client';

import { useMemo } from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';
import type { Deal, DealAsset } from '@/types/database';

type Props = {
  deal: Deal;
  asset: DealAsset | null;
};

export default function RiskCurveChart({ deal, asset }: Props) {
  const duree = deal.duree_mois || 48;
  const montant = deal.montant_finance || 0;
  const loyerClient = deal.loyer_mensuel_client || 0;
  const loyerBanque = deal.loyer_mensuel_banque || 0;
  const apport = deal.apport_initial || 0;
  const depot = deal.depot_garantie || 0;
  const valeurInitiale = asset?.prix_achat_ht || montant;
  const tauxDepre = asset?.taux_depreciation_annuel || 0.15;
  const coeffRecup = asset?.coefficient_recuperabilite || 0.70;
  const fraisRecupFixes = 500;

  const { curveData, moisCouvertureMateriel, moisCouvertureTotale, expositionMax } = useMemo(() => {
    const data = [];
    let mCM: number | null = null;
    let mCT: number | null = null;
    let expMax = 0;

    for (let m = 0; m <= duree; m++) {
      const crdBanque = Math.max(0, montant * (1 - m / duree));
      const annees = m / 12;
      const valeurBien = valeurInitiale * Math.pow(1 - tauxDepre, annees);
      const valeurRecuperable = valeurBien * coeffRecup - fraisRecupFixes;
      const loyersNets = m * (loyerClient - loyerBanque) + apport + depot;
      const rrn = crdBanque - valeurRecuperable - loyersNets;

      if (mCM === null && valeurRecuperable >= crdBanque) mCM = m;
      if (mCT === null && rrn < 0) mCT = m;
      expMax = Math.max(expMax, rrn);

      data.push({
        mois: m,
        crd_banque: Math.round(crdBanque),
        valeur_recuperable: Math.round(valeurRecuperable),
        loyers_nets_cumules: Math.round(loyersNets),
        rrn: Math.round(rrn),
      });
    }

    return {
      curveData: data,
      moisCouvertureMateriel: mCM,
      moisCouvertureTotale: mCT,
      expositionMax: Math.round(expMax),
    };
  }, [duree, montant, loyerClient, loyerBanque, apport, depot, valeurInitiale, tauxDepre, coeffRecup]);

  return (
    <div className="space-y-3">
      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="tile" style={{ padding: '20px' }}>
          <p className="text-sm text-[#6e6e73] mb-1">Couverture matériel</p>
          <p className="text-2xl font-bold font-mono text-[#1d1d1f]">
            {moisCouvertureMateriel !== null ? `Mois ${moisCouvertureMateriel}` : '—'}
          </p>
          <p className="text-xs text-[#a1a1a6] mt-1">Point A</p>
        </div>
        <div className="tile" style={{ padding: '20px' }}>
          <p className="text-sm text-[#6e6e73] mb-1">Couverture totale</p>
          <p className="text-2xl font-bold font-mono text-[#059669]">
            {moisCouvertureTotale !== null ? `Mois ${moisCouvertureTotale}` : '—'}
          </p>
          <p className="text-xs text-[#a1a1a6] mt-1">Point B — plus de perte possible</p>
        </div>
        <div className="tile" style={{ padding: '20px' }}>
          <p className="text-sm text-[#6e6e73] mb-1">Exposition maximale</p>
          <p className="text-2xl font-bold font-mono text-[#DC2626]">
            {expositionMax.toLocaleString('fr-FR')} EUR
          </p>
        </div>
      </div>

      {/* Main chart */}
      <div className="tile" style={{ padding: '24px' }}>
        <h3 className="font-semibold text-[#2d2d2d] mb-4">Courbe de Risque Résiduel Net (RRN)</h3>

        {moisCouvertureTotale !== null && (
          <div className="mb-4 p-3 bg-[#F0FDF4] border border-[#059669] rounded-lg text-sm text-[#059669]">
            À partir du mois {moisCouvertureTotale}, vous ne pouvez plus perdre d&apos;argent sur ce deal.
          </div>
        )}

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={curveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" />
            <XAxis
              dataKey="mois"
              tick={{ fill: '#8A95A3', fontSize: 11 }}
              label={{ value: 'Mois', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              tick={{ fill: '#8A95A3', fontSize: 11 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => `${Number(value).toLocaleString('fr-FR')} EUR`}
              labelFormatter={(label) => `Mois ${label}`}
            />
            <Area
              type="monotone"
              dataKey="crd_banque"
              stroke="#DC2626"
              fill="#DC2626"
              fillOpacity={0.05}
              name="CRD banque"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="valeur_recuperable"
              stroke="#1B4FD8"
              fill="#1B4FD8"
              fillOpacity={0.05}
              name="Valeur récupérable"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="loyers_nets_cumules"
              stroke="#059669"
              name="Loyers nets cumulés"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="rrn"
              stroke="#F59E0B"
              name="RRN"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={false}
            />
            <ReferenceLine y={0} stroke="#0F1923" strokeWidth={1} />
            {moisCouvertureTotale !== null && (
              <ReferenceLine
                x={moisCouvertureTotale}
                stroke="#059669"
                strokeDasharray="8 4"
                label={{ value: 'Point B', fill: '#059669', fontSize: 11 }}
              />
            )}
            {moisCouvertureMateriel !== null && (
              <ReferenceLine
                x={moisCouvertureMateriel}
                stroke="#1B4FD8"
                strokeDasharray="8 4"
                label={{ value: 'Point A', fill: '#1B4FD8', fontSize: 11 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>

        <div className="flex gap-4 mt-4 text-xs text-[#6e6e73]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#DC2626] rounded-sm inline-block" /> CRD banque
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#1d1d1f] rounded-sm inline-block" /> Valeur récupérable
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#059669] rounded-sm inline-block" /> Loyers nets
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-[#F59E0B] rounded-sm inline-block" /> RRN
          </span>
        </div>
      </div>
    </div>
  );
}
