'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ScoreExplainer from '@/components/ui/ScoreExplainer';
import Tooltip from '@/components/ui/Tooltip';
import type { DealScore } from '@/types/database';

type Props = { dealId: string; score: DealScore | null };

type MacroData = {
  pib_croissance: number | null;
  inflation: number | null;
  taux_bce: number | null;
  pmi_manufacturier: number | null;
  indice_confiance_entreprises: number | null;
  phase_cycle: string | null;
  score_macro_brut: number | null;
  code_naf: string | null;
  tendance_sectoriel: string | null;
  taux_defaillance_sectoriel: number | null;
  dso_moyen_sectoriel: number | null;
  score_sectoriel_brut: number | null;
  bonus_malus_croisement: number | null;
  matrice_croisement: string | null;
};

export default function MacroSectorTab({ dealId, score }: Props) {
  const [data, setData] = useState<MacroData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('deal_macro_sector_data').select('*').eq('deal_id', dealId).maybeSingle()
      .then(({ data: d }: { data: MacroData | null }) => { if (d) setData(d); });
  }, [dealId, supabase]);

  const macroScore = score?.score_macro ?? null;
  const sectorScore = score?.score_sectoriel ?? null;
  const combined = score?.score_macro_sectoriel_combine ?? null;

  // Build signals based on data
  const macroSignals = [];
  if (data) {
    if (data.pib_croissance !== null && data.pib_croissance > 1.5)
      macroSignals.push({ text: `PIB en croissance (${data.pib_croissance}%)`, type: 'positive' as const });
    else if (data.pib_croissance !== null && data.pib_croissance < 0)
      macroSignals.push({ text: `PIB négatif (${data.pib_croissance}%)`, type: 'negative' as const });

    if (data.inflation !== null && data.inflation > 4)
      macroSignals.push({ text: `Inflation élevée (${data.inflation}%)`, type: 'negative' as const });

    if (data.pmi_manufacturier !== null && data.pmi_manufacturier > 50)
      macroSignals.push({ text: `PMI en zone d'expansion (${data.pmi_manufacturier})`, type: 'positive' as const });
    else if (data.pmi_manufacturier !== null)
      macroSignals.push({ text: `PMI en zone de contraction (${data.pmi_manufacturier})`, type: 'negative' as const });

    if (data.phase_cycle)
      macroSignals.push({ text: `Phase du cycle : ${data.phase_cycle}`, type: data.phase_cycle === 'expansion' ? 'positive' as const : data.phase_cycle === 'recession' ? 'negative' as const : 'warning' as const });
  }

  const sectorSignals = [];
  if (data) {
    if (data.tendance_sectoriel === 'croissance')
      sectorSignals.push({ text: 'Secteur en croissance', type: 'positive' as const });
    else if (data.tendance_sectoriel === 'crise')
      sectorSignals.push({ text: 'Secteur en crise', type: 'negative' as const });

    if (data.taux_defaillance_sectoriel !== null && data.taux_defaillance_sectoriel > 0.05)
      sectorSignals.push({ text: `Taux de défaillance élevé (${(data.taux_defaillance_sectoriel * 100).toFixed(1)}%)`, type: 'negative' as const });
    else if (data.taux_defaillance_sectoriel !== null && data.taux_defaillance_sectoriel < 0.02)
      sectorSignals.push({ text: `Taux de défaillance faible (${(data.taux_defaillance_sectoriel * 100).toFixed(1)}%)`, type: 'positive' as const });

    if (data.dso_moyen_sectoriel !== null)
      sectorSignals.push({ text: `DSO moyen sectoriel : ${data.dso_moyen_sectoriel} jours`, type: data.dso_moyen_sectoriel > 75 ? 'warning' as const : 'positive' as const });

    if (data.bonus_malus_croisement !== null && data.bonus_malus_croisement !== 0)
      sectorSignals.push({ text: `Croisement macro×sectoriel : ${data.matrice_croisement} (${data.bonus_malus_croisement > 0 ? '+' : ''}${data.bonus_malus_croisement} pts)`,
        type: data.bonus_malus_croisement > 0 ? 'positive' as const : 'negative' as const });
  }

  if (!data && !macroScore) {
    sectorSignals.push({ text: 'Données macro-sectorielles non encore récupérées', type: 'warning' as const });
  }

  return (
    <div className="space-y-6">
      {/* Score combiné */}
      <ScoreExplainer score={combined} label="Score Macro + Sectoriel combiné" signals={[
        ...(data?.matrice_croisement ? [{ text: `Matrice de croisement : ${data.matrice_croisement}`, type: (combined !== null && combined >= 12 ? 'positive' : combined !== null && combined < 8 ? 'negative' : 'warning') as 'positive' | 'negative' | 'warning' }] : []),
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macro */}
        <ScoreExplainer score={macroScore} label="Indicateurs macro-économiques" signals={macroSignals} />

        {/* Sectoriel */}
        <ScoreExplainer score={sectorScore} label="Analyse sectorielle" signals={sectorSignals} />
      </div>

      {/* Indicateurs détaillés */}
      {data && (
        <div className="tile" style={{ padding: '24px' }}>
          <h3 className="text-[15px] font-semibold text-[#2d2d2d] mb-4">Indicateurs détaillés</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Metric label="PIB" value={data.pib_croissance !== null ? `${data.pib_croissance}%` : '—'} />
            <Metric label="Inflation" value={data.inflation !== null ? `${data.inflation}%` : '—'} />
            <Metric label="Taux BCE" value={data.taux_bce !== null ? `${data.taux_bce}%` : '—'} />
            <Metric label="PMI manufacturier" value={data.pmi_manufacturier !== null ? `${data.pmi_manufacturier}` : '—'} />
            <Metric label="Confiance entreprises" value={data.indice_confiance_entreprises !== null ? `${data.indice_confiance_entreprises}` : '—'} />
            <Metric label="NAF" value={data.code_naf || '—'} />
            <Metric label="Tendance sectorielle" value={data.tendance_sectoriel || '—'} />
            <Metric label="Taux défaillance" value={data.taux_defaillance_sectoriel !== null ? `${(data.taux_defaillance_sectoriel * 100).toFixed(1)}%` : '—'} />
            <Metric label="DSO sectoriel" value={data.dso_moyen_sectoriel !== null ? `${data.dso_moyen_sectoriel}j` : '—'} />
          </div>
        </div>
      )}
    </div>
  );
}

const MACRO_DEFS: Record<string, { definition: string; source: string }> = {
  PIB: { definition: 'Produit Intérieur Brut : croissance annuelle de l\'économie française.', source: 'API INSEE Melodi' },
  Inflation: { definition: 'Évolution annuelle des prix à la consommation.', source: 'API INSEE' },
  'Taux BCE': { definition: 'Taux directeur de la Banque Centrale Européenne. Influence le coût du crédit.', source: 'API Banque de France' },
  'PMI manufacturier': { definition: 'Purchasing Managers\' Index : > 50 = expansion, < 50 = contraction de l\'activité.', source: 'API Eurostat' },
  'Confiance entreprises': { definition: 'Indicateur de climat des affaires mesuré par l\'INSEE. Base 100 = moyenne long terme.', source: 'API INSEE' },
  'Taux défaillance': { definition: 'Part des entreprises du secteur NAF qui font défaut chaque année.', source: 'API BODACC / ratios_inpi_bce_sectors (data.economie.gouv.fr)' },
  'DSO sectoriel': { definition: 'Délai moyen de paiement des clients dans ce secteur NAF.', source: 'API ratios_inpi_bce_sectors (data.economie.gouv.fr)' },
  'Tendance sectorielle': { definition: 'Orientation générale du secteur : croissance, stable, ralentissement ou crise.', source: 'API BODACC + Serper (actualités)' },
};

function Metric({ label, value }: { label: string; value: string }) {
  const def = MACRO_DEFS[label];
  return (
    <div className="bg-[#f5f5f7] rounded-[14px] p-4">
      {def ? (
        <Tooltip definition={def.definition} source={def.source}>
          <p className="text-[11px] text-[#86868b] mb-1">{label}</p>
        </Tooltip>
      ) : (
        <p className="text-[11px] text-[#86868b] mb-1">{label}</p>
      )}
      <p className="text-[15px] font-semibold text-[#2d2d2d] font-mono tracking-tight">{value}</p>
    </div>
  );
}
