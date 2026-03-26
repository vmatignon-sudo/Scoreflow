'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { Deal, DealAsset } from '@/types/database';

type Props = {
  deal: Deal;
  asset: DealAsset | null;
};

export default function SimulatorPanel({ deal, asset }: Props) {
  const duree = deal.duree_mois || 48;
  const [moisDefaut, setMoisDefaut] = useState(Math.floor(duree / 2));
  const [delaiRecuperation, setDelaiRecuperation] = useState(2);

  const loyerClient = deal.loyer_mensuel_client || 0;
  const loyerBanque = deal.loyer_mensuel_banque || 0;
  const depotGarantie = deal.depot_garantie || 0;
  const fraisDossier = deal.frais_dossier_banque || 0;
  const penalites = deal.penalites_remboursement_anticipe || 0;
  const valeurBien = asset?.prix_achat_ht || deal.montant_finance || 0;
  const tauxDepre = asset?.taux_depreciation_annuel || 0.15;
  const coeffRecup = asset?.coefficient_recuperabilite || 0.70;
  const tauxFraisRecup = 0.12;

  const simulation = useMemo(() => {
    const loyersEncaisses = moisDefaut * loyerClient;
    const moisTotal = moisDefaut + delaiRecuperation;
    const coutBancaire = moisTotal * loyerBanque + fraisDossier;
    const loyersPerdus = delaiRecuperation * loyerClient;
    const crdBanque = Math.max(0, loyerBanque * (duree - moisTotal));
    const annees = moisTotal / 12;
    const valeurRecup = valeurBien * Math.pow(1 - tauxDepre, annees);
    const coutRecup = valeurRecup * tauxFraisRecup;
    const valeurNette = valeurRecup * coeffRecup - coutRecup;
    const bilanNet = loyersEncaisses + valeurNette + depotGarantie - coutBancaire - crdBanque - penalites;

    return {
      loyersEncaisses: Math.round(loyersEncaisses),
      loyersPerdus: Math.round(loyersPerdus),
      coutBancaire: Math.round(coutBancaire),
      crdBanque: Math.round(crdBanque),
      valeurRecup: Math.round(valeurRecup),
      coutRecup: Math.round(coutRecup),
      valeurNette: Math.round(valeurNette),
      bilanNet: Math.round(bilanNet),
    };
  }, [moisDefaut, delaiRecuperation, loyerClient, loyerBanque, depotGarantie, fraisDossier, penalites, valeurBien, tauxDepre, coeffRecup, duree]);

  // Chart data
  const chartData = useMemo(() => {
    const data = [];
    for (let m = 0; m <= duree; m++) {
      const crd = Math.max(0, (deal.montant_finance || 0) * (1 - m / duree));
      const valeur = valeurBien * Math.pow(1 - tauxDepre, m / 12) * coeffRecup;
      const loyersCumClient = m * loyerClient;
      const loyersCumBanque = m * loyerBanque + fraisDossier;

      data.push({
        mois: m,
        crd_banque: Math.round(crd),
        valeur_recuperable: Math.round(valeur),
        loyers_client_cumules: Math.round(loyersCumClient),
        couts_banque_cumules: Math.round(loyersCumBanque),
      });
    }
    return data;
  }, [duree, deal.montant_finance, valeurBien, tauxDepre, coeffRecup, loyerClient, loyerBanque, fraisDossier]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h3 className="font-semibold text-[#2d2d2d] mb-4">Simulateur d&apos;incident</h3>

        {/* Slider 1: mois de défaut */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-[#424245]">
              Impayé au mois {moisDefaut}
            </span>
            <span className="text-[#6e6e73]">
              {moisDefaut} loyers encaissés
            </span>
          </div>
          <input
            type="range"
            min="1"
            max={duree}
            value={moisDefaut}
            onChange={(e) => setMoisDefaut(parseInt(e.target.value))}
            className="w-full accent-[#1B4FD8]"
          />
          <div className="flex justify-between text-xs text-[#a1a1a6] mt-1">
            <span>Mois 1</span>
            <span>Mois {duree}</span>
          </div>
        </div>

        {/* Slider 2: délai récupération */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-[#424245]">
              Délai de récupération : {delaiRecuperation} mois
            </span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 6].map((m) => (
              <button
                key={m}
                onClick={() => setDelaiRecuperation(m)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  delaiRecuperation === m
                    ? 'border-[#1d1d1f] bg-[#f5f5f7] text-[#1d1d1f]'
                    : 'border-black/[0.04] text-[#6e6e73] hover:bg-[#ededf0]'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Quick scenarios */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMoisDefaut(6); setDelaiRecuperation(2); }}
            className="px-3 py-1.5 bg-[#f5f5f7] text-[#6e6e73] rounded-lg text-xs font-medium hover:bg-[#f5f5f7]"
          >
            Défaut M6
          </button>
          <button
            onClick={() => { setMoisDefaut(Math.floor(duree / 2)); setDelaiRecuperation(2); }}
            className="px-3 py-1.5 bg-[#f5f5f7] text-[#6e6e73] rounded-lg text-xs font-medium hover:bg-[#f5f5f7]"
          >
            Mi-parcours
          </button>
          <button
            onClick={() => { setMoisDefaut(Math.floor(duree * 0.8)); setDelaiRecuperation(2); }}
            className="px-3 py-1.5 bg-[#f5f5f7] text-[#6e6e73] rounded-lg text-xs font-medium hover:bg-[#f5f5f7]"
          >
            Tardif
          </button>
          <button
            onClick={() => { setMoisDefaut(3); setDelaiRecuperation(6); }}
            className="px-3 py-1.5 bg-[#f5f5f7] text-[#6e6e73] rounded-lg text-xs font-medium hover:bg-[#f5f5f7]"
          >
            Pire cas
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h3 className="font-semibold text-[#2d2d2d] mb-4">Résultat du scénario</h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <ResultCard label="Loyers encaissés" value={simulation.loyersEncaisses} positive />
          <ResultCard label="Valeur nette bien" value={simulation.valeurNette} positive />
          <ResultCard label="CRD banque" value={simulation.crdBanque} negative />
          <ResultCard label="Coûts bancaires" value={simulation.coutBancaire} negative />
          <ResultCard label="Loyers perdus" value={simulation.loyersPerdus} negative />
          <div className={`p-4 rounded-lg border-2 ${
            simulation.bilanNet >= 0
              ? 'bg-[#F0FDF4] border-[#059669]'
              : 'bg-[#FEF2F2] border-[#DC2626]'
          }`}>
            <p className="text-xs text-[#6e6e73] mb-1">Bilan net</p>
            <p className={`text-xl font-bold font-mono ${
              simulation.bilanNet >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
            }`}>
              {simulation.bilanNet >= 0 ? '+' : ''}{simulation.bilanNet.toLocaleString('fr-FR')} EUR
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h3 className="font-semibold text-[#2d2d2d] mb-4">Évolution dans le temps</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
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
              fillOpacity={0.1}
              name="CRD banque"
            />
            <Area
              type="monotone"
              dataKey="valeur_recuperable"
              stroke="#1B4FD8"
              fill="#1B4FD8"
              fillOpacity={0.1}
              name="Valeur récupérable"
            />
            <Area
              type="monotone"
              dataKey="loyers_client_cumules"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.1}
              name="Loyers client cumulés"
            />
            <Area
              type="monotone"
              dataKey="couts_banque_cumules"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.1}
              name="Coûts banque cumulés"
            />
            <ReferenceLine
              x={moisDefaut}
              stroke="#DC2626"
              strokeDasharray="5 5"
              label={{ value: 'Défaut', fill: '#DC2626', fontSize: 11 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: number;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="p-4 bg-[#f5f5f7] rounded-lg">
      <p className="text-xs text-[#6e6e73] mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${
        positive ? 'text-[#059669]' : negative ? 'text-[#DC2626]' : 'text-[#1d1d1f]'
      }`}>
        {value.toLocaleString('fr-FR')} EUR
      </p>
    </div>
  );
}
