'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  dealId: string;
};

type FinancialData = {
  annee: number | null;
  ca: number | null;
  ebitda: number | null;
  ebit: number | null;
  resultat_net: number | null;
  caf: number | null;
  actif_total: number | null;
  fonds_propres: number | null;
  dettes_financieres: number | null;
  tresorerie: number | null;
  ratios: Record<string, number | null> | null;
  score_altman_z: number | null;
  altman_zone: string | null;
  score_conan_holder: number | null;
  conan_zone: string | null;
};

const ZONE_STYLES: Record<string, string> = {
  sain: 'bg-green-50 text-green-700',
  gris: 'bg-yellow-50 text-yellow-700',
  danger: 'bg-red-50 text-red-700',
  attention: 'bg-yellow-50 text-yellow-700',
  difficultes: 'bg-red-50 text-red-700',
};

const RATIO_LABELS: Record<string, string> = {
  liquidite_generale: 'Liquidité générale',
  liquidite_reduite: 'Liquidité réduite',
  liquidite_immediate: 'Liquidité immédiate',
  bfr: 'BFR',
  frng: 'FRNG',
  tresorerie_nette: 'Trésorerie nette',
  jours_tresorerie: 'Jours de trésorerie',
  caf: 'CAF',
  dette_sur_caf: 'Dette / CAF',
  dscr: 'DSCR',
  couverture_ff: 'Couverture frais financiers',
  autonomie_financiere: 'Autonomie financière',
  endettement: 'Endettement',
  gearing: 'Gearing',
  levier: 'Levier',
  marge_ebitda: 'Marge EBITDA',
  marge_ebit: 'Marge EBIT',
  marge_nette: 'Marge nette',
  roe: 'ROE',
  roa: 'ROA',
  roce: 'ROCE',
  dso: 'DSO (jours)',
  dpo: 'DPO (jours)',
  ccc: 'CCC (jours)',
  rotation_actif: 'Rotation actif',
};

const RATIO_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: 'Liquidité',
    keys: ['liquidite_generale', 'liquidite_reduite', 'liquidite_immediate', 'bfr', 'frng', 'tresorerie_nette', 'jours_tresorerie'],
  },
  {
    title: 'Capacité de remboursement',
    keys: ['caf', 'dette_sur_caf', 'dscr', 'couverture_ff'],
  },
  {
    title: 'Structure financière',
    keys: ['autonomie_financiere', 'endettement', 'gearing', 'levier'],
  },
  {
    title: 'Rentabilité',
    keys: ['marge_ebitda', 'marge_ebit', 'marge_nette', 'roe', 'roa', 'roce'],
  },
  {
    title: 'Activité',
    keys: ['dso', 'dpo', 'ccc', 'rotation_actif'],
  },
];

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (Math.abs(v) >= 1000) return v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  if (Math.abs(v) < 0.01) return v.toFixed(4);
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function fmtEur(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} EUR`;
}

export default function FinancialTab({ dealId }: Props) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data: rows } = await supabase
        .from('deal_financial_ratios')
        .select('*')
        .eq('deal_id', dealId)
        .order('annee', { ascending: false })
        .limit(1)
        .maybeSingle();
      setData(rows);
      setLoading(false);
    }
    fetch();
  }, [dealId, supabase]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 animate-pulse">
        <div className="h-6 bg-[#EEF0F5] rounded w-1/3 mb-4" />
        <div className="h-4 bg-[#EEF0F5] rounded w-full mb-2" />
        <div className="h-4 bg-[#EEF0F5] rounded w-2/3" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#0F1923] mb-2">Analyse financière</h3>
        <p className="text-[#8A95A3] text-sm">
          Aucune donnée financière disponible. Uploadez une liasse fiscale pour déclencher l&apos;analyse.
        </p>
      </div>
    );
  }

  const ratios = data.ratios || {};

  return (
    <div className="space-y-6">
      {/* Scores académiques */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h4 className="text-sm font-medium text-[#4A5568] mb-1">Altman Z&apos;</h4>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-mono text-[#0F1923]">
              {data.score_altman_z !== null ? data.score_altman_z.toFixed(2) : '—'}
            </span>
            {data.altman_zone && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZONE_STYLES[data.altman_zone] || ''}`}>
                {data.altman_zone}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8A95A3] mt-1">&gt;2.9 sain | 1.23-2.9 gris | &lt;1.23 danger</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h4 className="text-sm font-medium text-[#4A5568] mb-1">Conan &amp; Holder</h4>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-mono text-[#0F1923]">
              {data.score_conan_holder !== null ? data.score_conan_holder.toFixed(3) : '—'}
            </span>
            {data.conan_zone && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZONE_STYLES[data.conan_zone] || ''}`}>
                {data.conan_zone}
              </span>
            )}
          </div>
          <p className="text-xs text-[#8A95A3] mt-1">&gt;0.09 sain | 0.04-0.09 attention | &lt;0.04 difficultés</p>
        </div>
      </div>

      {/* Données brutes */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#0F1923] mb-4">
          Données comptables {data.annee ? `(${data.annee})` : ''}
        </h3>
        <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <Row label="Chiffre d'affaires" value={fmtEur(data.ca)} />
          <Row label="EBITDA" value={fmtEur(data.ebitda)} />
          <Row label="EBIT" value={fmtEur(data.ebit)} />
          <Row label="Résultat net" value={fmtEur(data.resultat_net)} />
          <Row label="CAF" value={fmtEur(data.caf)} />
          <Row label="Actif total" value={fmtEur(data.actif_total)} />
          <Row label="Fonds propres" value={fmtEur(data.fonds_propres)} />
          <Row label="Dettes financières" value={fmtEur(data.dettes_financieres)} />
          <Row label="Trésorerie" value={fmtEur(data.tresorerie)} />
        </div>
      </div>

      {/* Ratios par groupe */}
      {RATIO_GROUPS.map((group) => {
        const hasAny = group.keys.some((k) => ratios[k] !== null && ratios[k] !== undefined);
        if (!hasAny) return null;
        return (
          <div key={group.title} className="bg-white rounded-xl border border-[#E2E8F0] p-6">
            <h3 className="font-semibold text-[#0F1923] mb-4">{group.title}</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {group.keys.map((key) => {
                const val = ratios[key];
                if (val === null || val === undefined) return null;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-[#4A5568]">{RATIO_LABELS[key] || key}</span>
                    <span className="font-mono font-medium text-[#0F1923]">{fmt(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#8A95A3]">{label}</span>
      <span className="font-mono text-[#0F1923]">{value}</span>
    </div>
  );
}
