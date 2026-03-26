'use client';

import { useState } from 'react';
import type { Deal, DealScore } from '@/types/database';

type Props = {
  deal: Deal;
  score: DealScore | null;
};

export default function NegotiationSliders({ deal, score }: Props) {
  const montant = deal.montant_finance || 0;
  const [apportPct, setApportPct] = useState(
    montant > 0 ? Math.round((deal.apport_initial / montant) * 100) : 0
  );
  const [depotGarantie, setDepotGarantie] = useState(
    deal.loyer_mensuel_client ? deal.depot_garantie / deal.loyer_mensuel_client : 0
  );
  const [duree, setDuree] = useState(deal.duree_mois || 48);
  const [vrAdjust, setVrAdjust] = useState(0);
  const [cautionPerso, setCautionPerso] = useState(false);

  // Simulated score impact (placeholder — will be replaced with backend call)
  const baseScore = score?.score_deal_total || 10;
  const adjustedScore = Math.min(
    20,
    Math.max(
      0,
      baseScore
        + (apportPct - (montant > 0 ? (deal.apport_initial / montant) * 100 : 0)) * 0.05
        + (depotGarantie - (deal.loyer_mensuel_client ? deal.depot_garantie / deal.loyer_mensuel_client : 0)) * 0.3
        + ((deal.duree_mois || 48) - duree) * 0.02
        + vrAdjust * 0.1
        + (cautionPerso ? 1.5 : 0)
    )
  );

  return (
    <div className="bg-white rounded-[20px] shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1d1d1f]">Curseurs de négociation</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6e6e73]">Score Deal :</span>
          <span className="text-lg font-bold font-mono text-[#1d1d1f]">
            {adjustedScore.toFixed(1)}/20
          </span>
        </div>
      </div>

      <p className="text-xs text-[#a1a1a6] mb-6">
        Le modèle est fixe. Seules les conditions du deal varient.
      </p>

      <div className="space-y-5">
        {/* Apport initial */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#1d1d1f] font-medium">Apport initial</span>
            <span className="font-mono text-[#6e6e73]">
              {apportPct}% ({Math.round(montant * apportPct / 100).toLocaleString('fr-FR')} EUR)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            step="1"
            value={apportPct}
            onChange={(e) => setApportPct(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#059669] rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Dépôt de garantie */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#1d1d1f] font-medium">Dépôt de garantie</span>
            <span className="font-mono text-[#6e6e73]">{depotGarantie.toFixed(1)} loyers</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="0.5"
            value={depotGarantie}
            onChange={(e) => setDepotGarantie(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#059669] rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Durée */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#1d1d1f] font-medium">Durée</span>
            <span className="font-mono text-[#6e6e73]">{duree} mois</span>
          </div>
          <input
            type="range"
            min="12"
            max="84"
            step="12"
            value={duree}
            onChange={(e) => setDuree(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gradient-to-r from-[#059669] via-[#F59E0B] to-[#DC2626] rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-[#a1a1a6] mt-1">
            <span>12</span>
            <span>84</span>
          </div>
        </div>

        {/* Valeur résiduelle */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[#1d1d1f] font-medium">Ajustement valeur résiduelle</span>
            <span className="font-mono text-[#6e6e73]">{vrAdjust > 0 ? '+' : ''}{vrAdjust}%</span>
          </div>
          <input
            type="range"
            min="-30"
            max="20"
            step="5"
            value={vrAdjust}
            onChange={(e) => setVrAdjust(parseInt(e.target.value))}
            className="w-full accent-[#1B4FD8]"
          />
        </div>

        {/* Caution personnelle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={cautionPerso}
            onChange={(e) => setCautionPerso(e.target.checked)}
            className="w-5 h-5 accent-[#1B4FD8]"
          />
          <span className="text-sm font-medium text-[#1d1d1f]">Caution personnelle</span>
          {cautionPerso && (
            <span className="text-xs text-[#059669] font-medium">+1.5 pts</span>
          )}
        </label>
      </div>
    </div>
  );
}
