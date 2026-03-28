'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

import Tooltip from '@/components/ui/Tooltip';
import { RATIO_DEFINITIONS } from '@/lib/utils/ratioDefinitions';

type Props = {
  dealId: string;
  organizationId: string;
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
  ratios_sectoriels_ref: Record<string, { q10?: number; q25?: number; q50?: number; q75?: number; q90?: number }> | null;
  score_altman_z: number | null;
  altman_zone: string | null;
  score_conan_holder: number | null;
  conan_zone: string | null;
};

type DocRow = {
  id: string;
  filename: string;
  type: string;
  parse_status: string;
  uploaded_at: string;
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

// Ratios where LOWER is better (debt, days, leverage)
const LOWER_IS_BETTER = new Set([
  'dette_sur_caf', 'endettement', 'gearing', 'levier',
  'dso', 'dpo', 'ccc', 'bfr',
]);

// Seuils normatifs conventionnels (fondamentaux finance d'entreprise)
// { min, max, label } — si lowerIsBetter, la logique s'inverse
const NORMS: Record<string, { danger: number; warning: number; good: number; label: string }> = {
  liquidite_generale:    { danger: 0.8,  warning: 1.0,  good: 1.5,  label: 'Norme > 1' },
  liquidite_reduite:     { danger: 0.5,  warning: 0.8,  good: 1.2,  label: 'Norme > 0,8' },
  liquidite_immediate:   { danger: 0.1,  warning: 0.2,  good: 0.5,  label: 'Norme > 0,2' },
  dscr:                  { danger: 0.8,  warning: 1.0,  good: 1.5,  label: 'Norme > 1,2' },
  couverture_ff:         { danger: 1.5,  warning: 3.0,  good: 5.0,  label: 'Norme > 3' },
  autonomie_financiere:  { danger: 0.15, warning: 0.25, good: 0.40, label: 'Norme > 0,3' },
  dette_sur_caf:         { danger: 5.0,  warning: 3.5,  good: 2.0,  label: 'Norme < 3,5' },  // lower is better
  endettement:           { danger: 2.0,  warning: 1.0,  good: 0.5,  label: 'Norme < 1' },    // lower is better
  gearing:               { danger: 2.5,  warning: 1.5,  good: 0.8,  label: 'Norme < 1,5' },  // lower is better
  levier:                { danger: 4.0,  warning: 2.5,  good: 1.5,  label: 'Norme < 2,5' },  // lower is better
  marge_ebitda:          { danger: 0.03, warning: 0.08, good: 0.15, label: 'Norme > 8%' },
  marge_ebit:            { danger: 0.02, warning: 0.05, good: 0.10, label: 'Norme > 5%' },
  marge_nette:           { danger: 0.01, warning: 0.03, good: 0.08, label: 'Norme > 3%' },
  roe:                   { danger: 0.02, warning: 0.08, good: 0.15, label: 'Norme > 8%' },
  roa:                   { danger: 0.01, warning: 0.03, good: 0.08, label: 'Norme > 3%' },
  roce:                  { danger: 0.03, warning: 0.08, good: 0.15, label: 'Norme > 8%' },
  rotation_actif:        { danger: 0.3,  warning: 0.6,  good: 1.0,  label: 'Norme > 0,6' },
  dso:                   { danger: 90,   warning: 60,   good: 30,   label: 'Norme < 60j' },   // lower is better
  dpo:                   { danger: 90,   warning: 60,   good: 30,   label: 'Norme < 60j' },   // lower is better
  ccc:                   { danger: 120,  warning: 60,   good: 20,   label: 'Norme < 60j' },   // lower is better
};

/** Get norm color for a ratio value. */
function getNormColor(val: number, key: string): string | undefined {
  const norm = NORMS[key];
  if (!norm) return undefined;
  const lowerBetter = LOWER_IS_BETTER.has(key);
  if (lowerBetter) {
    if (val <= norm.good) return '#059669';
    if (val <= norm.warning) return '#2d9d3f';
    if (val <= norm.danger) return '#bf5a00';
    return '#c4342d';
  }
  if (val >= norm.good) return '#059669';
  if (val >= norm.warning) return '#2d9d3f';
  if (val >= norm.danger) return '#bf5a00';
  return '#c4342d';
}

const RATIO_GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Liquidité', keys: ['liquidite_generale', 'liquidite_reduite', 'liquidite_immediate', 'bfr', 'frng', 'tresorerie_nette', 'jours_tresorerie'] },
  { title: 'Capacité de remboursement', keys: ['caf', 'dette_sur_caf', 'dscr', 'couverture_ff'] },
  { title: 'Structure financière', keys: ['autonomie_financiere', 'endettement', 'gearing', 'levier'] },
  { title: 'Rentabilité', keys: ['marge_ebitda', 'marge_ebit', 'marge_nette', 'roe', 'roa', 'roce'] },
  { title: 'Activité', keys: ['dso', 'dpo', 'ccc', 'rotation_actif'] },
];

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (Math.abs(v) >= 1000) return v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  if (Math.abs(v) < 0.01) return v.toFixed(4);
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

function fmtEur(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return (v / 1_000).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

/** Compute trend from multi-year values (oldest → newest). */
function getTrend(values: (number | null | undefined)[]): { direction: 'up' | 'down' | 'stable'; pctChange: number | null } {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length < 2) return { direction: 'stable', pctChange: null };
  const first = valid[0];
  const last = valid[valid.length - 1];
  if (first === 0) return { direction: last > 0 ? 'up' : last < 0 ? 'down' : 'stable', pctChange: null };
  const pct = ((last - first) / Math.abs(first)) * 100;
  if (Math.abs(pct) < 3) return { direction: 'stable', pctChange: pct };
  return { direction: pct > 0 ? 'up' : 'down', pctChange: pct };
}

/** Get color for sector comparison. */
function getSectorColor(val: number, key: string, sector: { q25?: number; q50?: number; q75?: number }): string {
  const lowerBetter = LOWER_IS_BETTER.has(key);
  const q25 = sector.q25;
  const q50 = sector.q50;
  const q75 = sector.q75;
  if (q25 === undefined || q50 === undefined || q75 === undefined) return '#6e6e73';
  if (lowerBetter) {
    if (val <= q25) return '#059669'; // excellent
    if (val <= q50) return '#2d9d3f'; // good
    if (val <= q75) return '#bf5a00'; // warning
    return '#c4342d'; // bad
  }
  if (val >= q75) return '#059669';
  if (val >= q50) return '#2d9d3f';
  if (val >= q25) return '#bf5a00';
  return '#c4342d';
}

export default function FinancialTab({ dealId, organizationId }: Props) {
  const [allYears, setAllYears] = useState<FinancialData[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedRatio, setExpandedRatio] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: ratioRows } = await supabase
      .from('deal_financial_ratios')
      .select('*')
      .eq('deal_id', dealId)
      .order('annee', { ascending: true });
    setAllYears(ratioRows || []);

    const { data: docRows } = await supabase
      .from('deal_documents')
      .select('id, filename, type, parse_status, uploaded_at')
      .eq('deal_id', dealId)
      .in('type', ['liasse_fiscale', 'releve_bancaire'])
      .order('uploaded_at', { ascending: false });
    setDocs(docRows || []);

    setLoading(false);
  }, [dealId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const path = `${dealId}/${Date.now()}-${file.name}`;

      await supabase.storage.from('deal-documents').upload(path, file);

      const lower = file.name.toLowerCase();
      const type = (lower.includes('liasse') || lower.includes('fiscal') || lower.includes('cerfa') || lower.endsWith('.xml'))
        ? 'liasse_fiscale'
        : (lower.includes('relev') || lower.includes('banc'))
          ? 'releve_bancaire'
          : 'liasse_fiscale';

      await supabase.from('deal_documents').insert({
        deal_id: dealId,
        type,
        filename: file.name,
        storage_path: path,
        parse_status: 'pending',
      });
    }

    await fetchData();
    setUploading(false);
  }, [dealId, supabase, fetchData]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);


  if (loading) {
    return (
      <div className="tile animate-pulse" style={{ padding: '24px' }}>
        <div className="h-6 bg-[#f5f5f7] rounded w-1/3 mb-4" />
        <div className="h-4 bg-[#f5f5f7] rounded w-full mb-2" />
        <div className="h-4 bg-[#f5f5f7] rounded w-2/3" />
      </div>
    );
  }

  // Latest year data
  const data = allYears.length > 0 ? allYears[allYears.length - 1] : null;
  const ratios = data?.ratios || {};
  const sectorRef = data?.ratios_sectoriels_ref || {};
  const years = allYears.filter(y => y.annee !== null).sort((a, b) => (a.annee || 0) - (b.annee || 0));

  return (
    <div className="space-y-3">
      {/* Upload zone + documents list */}
      <div className="tile" style={{ padding: '24px' }}>
        <div className="mb-4">
          <h3 className="text-[12px] font-medium text-[#2a5082]">Documents financiers</h3>
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-black/[0.04] rounded-lg p-6 text-center hover:border-[#1d1d1f] transition-colors cursor-pointer mb-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('financial-file-input')?.click()}
        >
          <input
            id="financial-file-input"
            type="file"
            multiple
            accept=".pdf,.xml"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
            className="hidden"
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-[#1d1d1f]">
              <div className="w-5 h-5 border-2 border-[#1d1d1f] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Upload en cours...</span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-[#a1a1a6] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-[#424245] font-medium">Liasses fiscales, relevés bancaires</p>
              <p className="text-xs text-[#a1a1a6] mt-1">PDF ou XML — Glissez-déposez ou cliquez</p>
            </>
          )}
        </div>

        {/* Documents list */}
        {docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded border border-black/[0.04] flex items-center justify-center">
                    <span className="text-[10px] text-[#6e6e73]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {doc.filename.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#424245]">{doc.filename}</p>
                    <p className="text-xs text-[#a1a1a6]">
                      {doc.type === 'liasse_fiscale' ? 'Liasse fiscale' : 'Relevé bancaire'}
                      {' — '}
                      {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  doc.parse_status === 'done' ? 'bg-green-50 text-green-600' :
                  doc.parse_status === 'processing' ? 'bg-blue-50 text-blue-600' :
                  doc.parse_status === 'error' ? 'bg-red-50 text-red-600' :
                  'bg-[#f5f5f7] text-[#a1a1a6]'
                }`}>
                  {doc.parse_status === 'done' ? 'Analysé' :
                   doc.parse_status === 'processing' ? 'En cours...' :
                   doc.parse_status === 'error' ? 'Erreur' : 'En attente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* No data message */}
      {!data && (
        <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-xl p-4 text-sm text-[#B45309]">
          Aucune donnée financière disponible. Uploadez une liasse fiscale ci-dessus puis relancez l&apos;analyse depuis le header.
        </div>
      )}

      {/* Scores académiques */}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="tile" style={{ padding: '20px' }}>
              <Tooltip definition={RATIO_DEFINITIONS.altman_z.definition} formula={RATIO_DEFINITIONS.altman_z.formula} source={RATIO_DEFINITIONS.altman_z.source}>
                <h4 className="text-sm font-medium text-[#6e6e73] mb-1">Altman Z&apos;</h4>
              </Tooltip>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[#1d1d1f]">
                  {data.score_altman_z !== null ? data.score_altman_z.toFixed(2) : '—'}
                </span>
                {data.altman_zone && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZONE_STYLES[data.altman_zone] || ''}`}>
                    {data.altman_zone}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a1a1a6] mt-1">&gt;2.9 sain | 1.23-2.9 gris | &lt;1.23 danger</p>
            </div>
            <div className="tile" style={{ padding: '20px' }}>
              <Tooltip definition={RATIO_DEFINITIONS.conan_holder.definition} formula={RATIO_DEFINITIONS.conan_holder.formula} source={RATIO_DEFINITIONS.conan_holder.source}>
                <h4 className="text-sm font-medium text-[#6e6e73] mb-1">Conan &amp; Holder</h4>
              </Tooltip>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-[#1d1d1f]">
                  {data.score_conan_holder !== null ? data.score_conan_holder.toFixed(3) : '—'}
                </span>
                {data.conan_zone && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ZONE_STYLES[data.conan_zone] || ''}`}>
                    {data.conan_zone}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#a1a1a6] mt-1">&gt;0.09 sain | 0.04-0.09 attention | &lt;0.04 difficultés</p>
            </div>
          </div>

          {/* Probabilité de défaillance — Signaux Faibles */}
          <PredictiveCard dealId={dealId} organizationId={organizationId} />

          {/* Données brutes avec tendance */}
          <div className="tile" style={{ padding: '24px' }}>
            <h3 className="text-[12px] font-medium text-[#2a5082] mb-4">
              Données comptables {data.annee ? `(${data.annee})` : ''} <span className="font-normal text-[#a1a1a6] text-xs">en k€</span>
              {years.length > 1 && (
                <span className="font-normal text-[#a1a1a6] text-xs ml-2">
                  — tendance sur {years.length} ans
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3 text-xs">
              <KVTrend label="Chiffre d'affaires" value={fmtEur(data.ca)} years={years} field="ca" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} />
              <KVTrend label="EBITDA" value={fmtEur(data.ebitda)} years={years} field="ebitda" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} />
              <KVTrend label="EBIT" value={fmtEur(data.ebit)} years={years} field="ebit" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} />
              <KVTrend label="Résultat net" value={fmtEur(data.resultat_net)} years={years} field="resultat_net" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} />
              <KVTrend label="CAF" value={fmtEur(data.caf)} years={years} field="caf" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} />
              <KVTrend label="Actif total" value={fmtEur(data.actif_total)} years={years} field="actif_total" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} />
              <KVTrend label="Fonds propres" value={fmtEur(data.fonds_propres)} years={years} field="fonds_propres" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} />
              <KVTrend label="Dettes financières" value={fmtEur(data.dettes_financieres)} years={years} field="dettes_financieres" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} isLowerBetter />
              <KVTrend label="Trésorerie" value={fmtEur(data.tresorerie)} years={years} field="tresorerie" expandedRatio={expandedRatio} setExpandedRatio={setExpandedRatio} />
            </div>
          </div>

          {/* Ratios par groupe — avec benchmark sectoriel + tendance */}
          {RATIO_GROUPS.map((group) => {
            const hasAny = group.keys.some((k) => ratios[k] !== null && ratios[k] !== undefined);
            if (!hasAny) return null;
            return (
              <div key={group.title} className="tile" style={{ padding: '24px' }}>
                <h3 className="text-[12px] font-medium text-[#2a5082] mb-4">{group.title}</h3>
                <div className="space-y-1">
                  {group.keys.map((key) => {
                    const val = ratios[key];
                    if (val === null || val === undefined) return null;
                    const def = RATIO_DEFINITIONS[key];
                    const sector = sectorRef[key];
                    const isExpanded = expandedRatio === `ratio-${key}`;

                    // Multi-year values for this ratio
                    const yearValues = years.map(y => y.ratios?.[key] ?? null);
                    const trend = getTrend(yearValues);

                    // Colors
                    const sectorColor = sector ? getSectorColor(val, key, sector) : undefined;
                    const normColor = getNormColor(val, key);
                    // Use norm color on the value itself, sector color on the badge
                    const valueColor = normColor || '#1d1d1f';

                    return (
                      <div key={key}>
                        <div
                          className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-[#f5f5f7] transition-colors cursor-pointer"
                          onClick={() => setExpandedRatio(isExpanded ? null : `ratio-${key}`)}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {def ? (
                              <Tooltip definition={def.definition} formula={def.formula} source={def.source}>
                                <span className="text-[13px] text-[#6e6e73]">{def.label}</span>
                              </Tooltip>
                            ) : (
                              <span className="text-[13px] text-[#6e6e73]">{RATIO_LABELS[key] || key}</span>
                            )}
                            {/* Norm label inline */}
                            {NORMS[key] && (
                              <span className="text-[9px] text-[#a1a1a6] hidden sm:inline">{NORMS[key].label}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Trend arrow */}
                            {years.length > 1 && (
                              <TrendBadge direction={trend.direction} pctChange={trend.pctChange} isLowerBetter={LOWER_IS_BETTER.has(key)} />
                            )}

                            {/* Value — colored by norm */}
                            <span className="font-medium text-[14px]" style={{ color: valueColor, fontVariantNumeric: 'tabular-nums' }}>
                              {fmt(val)}
                            </span>

                            {/* Sector median */}
                            {sector?.q50 !== undefined && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded" style={{
                                color: sectorColor,
                                background: `${sectorColor}0D`,
                                fontVariantNumeric: 'tabular-nums',
                              }}>
                                sect. {fmt(sector.q50)}
                              </span>
                            )}

                            {/* Expand indicator */}
                            {(years.length > 1 || sector || NORMS[key]) && (
                              isExpanded
                                ? <ChevronUp className="w-3 h-3 text-[#a1a1a6]" />
                                : <ChevronDown className="w-3 h-3 text-[#a1a1a6]" />
                            )}
                          </div>
                        </div>

                        {/* Expanded: year-by-year detail + norms + sector */}
                        {isExpanded && (
                          <div className="ml-2 mr-1 mb-2 p-3 bg-[#f5f5f7] rounded-lg">
                            <div className="space-y-1.5">
                              {years.map((y, i) => {
                                const v = y.ratios?.[key];
                                const prev = i > 0 ? years[i - 1].ratios?.[key] : null;
                                const change = (v !== null && v !== undefined && prev !== null && prev !== undefined && prev !== 0)
                                  ? ((v - prev) / Math.abs(prev)) * 100
                                  : null;
                                return (
                                  <div key={y.annee} className="flex items-center justify-between text-[12px]">
                                    <span className="text-[#6e6e73] font-medium">{y.annee}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#1d1d1f]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {v !== null && v !== undefined ? fmt(v) : '—'}
                                      </span>
                                      {change !== null && (
                                        <span className="text-[10px]" style={{
                                          fontVariantNumeric: 'tabular-nums',
                                          color: Math.abs(change) < 3 ? '#6e6e73' : ((change > 0 && !LOWER_IS_BETTER.has(key)) || (change < 0 && LOWER_IS_BETTER.has(key))) ? '#059669' : '#c4342d',
                                        }}>
                                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Sector percentiles */}
                            {sector && (
                              <div className="mt-2 pt-2 border-t border-black/[0.06]">
                                <p className="text-[10px] text-[#a1a1a6] mb-1">Benchmark sectoriel</p>
                                <div className="flex flex-wrap gap-3 text-[10px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  {sector.q10 !== undefined && <span className="text-[#c4342d]">Q10 {fmt(sector.q10)}</span>}
                                  {sector.q25 !== undefined && <span className="text-[#bf5a00]">Q25 {fmt(sector.q25)}</span>}
                                  {sector.q50 !== undefined && <span className="text-[#1d1d1f] font-medium">Q50 {fmt(sector.q50)}</span>}
                                  {sector.q75 !== undefined && <span className="text-[#2d9d3f]">Q75 {fmt(sector.q75)}</span>}
                                  {sector.q90 !== undefined && <span className="text-[#059669]">Q90 {fmt(sector.q90)}</span>}
                                </div>
                              </div>
                            )}
                            {/* Norm thresholds */}
                            {NORMS[key] && (
                              <div className={`mt-2 pt-2 border-t border-black/[0.06] ${!sector ? 'mt-2' : ''}`}>
                                <p className="text-[10px] text-[#a1a1a6] mb-1">Seuil normatif conventionnel</p>
                                <div className="flex flex-wrap gap-3 text-[10px]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                  <span style={{ color: '#c4342d' }}>Danger {LOWER_IS_BETTER.has(key) ? '>' : '<'} {fmt(NORMS[key].danger)}</span>
                                  <span style={{ color: '#bf5a00' }}>Vigilance {LOWER_IS_BETTER.has(key) ? '>' : '<'} {fmt(NORMS[key].warning)}</span>
                                  <span style={{ color: '#059669' }}>Bon {LOWER_IS_BETTER.has(key) ? '<' : '>'} {fmt(NORMS[key].good)}</span>
                                </div>
                                <p className="text-[9px] text-[#a1a1a6] mt-1">Votre valeur : <span style={{ color: normColor, fontWeight: 600 }}>{fmt(val)}</span></p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/** Trend badge with colored arrow. */
function TrendBadge({ direction, pctChange, isLowerBetter }: { direction: 'up' | 'down' | 'stable'; pctChange: number | null; isLowerBetter?: boolean }) {
  if (direction === 'stable') {
    return <Minus className="w-3 h-3 text-[#a1a1a6]" strokeWidth={2} />;
  }
  // For "lower is better" ratios, down = good, up = bad
  const isPositive = isLowerBetter ? direction === 'down' : direction === 'up';
  const color = isPositive ? '#059669' : '#c4342d';
  const Icon = direction === 'up' ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center gap-0.5">
      <Icon className="w-3 h-3" style={{ color }} strokeWidth={2} />
      {pctChange !== null && (
        <span className="text-[10px] font-medium" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
          {pctChange > 0 ? '+' : ''}{pctChange.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

/** Key-Value with trend for accounting data. */
function KVTrend({
  label, value, years, field, expandedRatio, setExpandedRatio, isLowerBetter,
}: {
  label: string; value: string;
  years: FinancialData[];
  field: keyof FinancialData;
  expandedRatio: string | null;
  setExpandedRatio: (v: string | null) => void;
  isLowerBetter?: boolean;
}) {
  const yearValues = years.map(y => y[field] as number | null);
  const trend = getTrend(yearValues);
  const isExpanded = expandedRatio === `kv-${field}`;

  return (
    <div>
      <div
        className="flex justify-between items-center cursor-pointer py-0.5"
        onClick={() => setExpandedRatio(isExpanded ? null : `kv-${field}`)}
      >
        <span className="text-[#a1a1a6]">{label}</span>
        <div className="flex items-center gap-1.5">
          {years.length > 1 && (
            <TrendBadge direction={trend.direction} pctChange={trend.pctChange} isLowerBetter={isLowerBetter} />
          )}
          <span className="text-[#1d1d1f]" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        </div>
      </div>
      {isExpanded && years.length > 1 && (
        <div className="mt-1 mb-2 p-2 bg-[#f5f5f7] rounded text-[11px] space-y-1">
          {years.map((y, i) => {
            const v = y[field] as number | null;
            const prev = i > 0 ? (years[i - 1][field] as number | null) : null;
            const change = (v !== null && prev !== null && prev !== 0)
              ? ((v - prev) / Math.abs(prev)) * 100
              : null;
            return (
              <div key={y.annee} className="flex justify-between">
                <span className="text-[#6e6e73]">{y.annee}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#1d1d1f]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {v !== null && v !== undefined ? fmtEur(v) : '—'}
                  </span>
                  {change !== null && (
                    <span style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: Math.abs(change) < 3 ? '#6e6e73' : ((change > 0 && !isLowerBetter) || (change < 0 && isLowerBetter)) ? '#059669' : '#c4342d',
                    }}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- Predictive Card (Signaux Faibles) ----

type PredictiveResult = {
  probability_6m: number;
  probability_12m: number;
  probability_18m: number;
  probability_24m: number;
  risk_level: string;
  contributing_factors: { feature: string; contribution: number; direction: string }[];
  confidence: number;
  model_version: string;
};

const RISK_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  faible: { label: 'Faible', color: '#2d9d3f', bg: '#2d9d3f' },
  'modéré': { label: 'Modéré', color: '#bf5a00', bg: '#bf5a00' },
  'élevé': { label: 'Élevé', color: '#c4342d', bg: '#c4342d' },
  critique: { label: 'Critique', color: '#a50e0e', bg: '#a50e0e' },
};

const FEATURE_LABELS: Record<string, string> = {
  dette_sur_caf: 'Ratio dette/CAF',
  autonomie_financiere: 'Autonomie financière',
  liquidite_generale: 'Liquidité générale',
  marge_nette: 'Marge nette',
  endettement: 'Endettement',
  couverture_ff: 'Couverture frais financiers',
  dso: 'Délai de paiement clients',
  altman_zone_danger: 'Score Altman en zone danger',
  conan_zone_difficultes: 'Score Conan en zone difficultés',
  privilege_urssaf: 'Inscription URSSAF',
  privilege_tresor: 'Inscription Trésor',
  changement_dirigeant_recent: 'Changement dirigeant récent',
  taux_defaillance_sectoriel: 'Taux défaillance sectoriel',
};

function PredictiveCard({ dealId, organizationId }: { dealId: string; organizationId: string }) {
  const [pred, setPred] = useState<PredictiveResult | null>(null);

  useEffect(() => {
    const scoringUrl = process.env.NEXT_PUBLIC_SCORING_API_URL;
    if (!scoringUrl || !organizationId) return;

    fetch(`${scoringUrl}/api/v1/scoring/compute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, organization_id: organizationId, force_recalculate: false }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.predictive) setPred(data.predictive); })
      .catch(() => {});
  }, [dealId, organizationId]);

  if (!pred) return null;

  const risk = RISK_STYLES[pred.risk_level] || RISK_STYLES['modéré'];
  const pct18 = (pred.probability_18m * 100).toFixed(1);

  return (
    <div className="tile" style={{ padding: '24px' }}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#1e40af]" strokeWidth={1.8} />
        <h3 className="text-[12px] font-medium text-[#2a5082]">Probabilité de défaillance</h3>
        <span className="text-[10px] text-[#a1a1a6] bg-[#f5f5f7] px-2 py-0.5 rounded-full">
          Signaux Faibles
        </span>
      </div>

      {/* Main indicator */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[12px] text-[#6e6e73] mb-0.5">Probabilité à 18 mois</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[36px] font-semibold tracking-tighter" style={{ color: risk.color }}>
              {pct18}%
            </span>
            <span className="text-[13px] font-medium px-2.5 py-0.5 rounded-full" style={{
              color: risk.color,
              backgroundColor: `${risk.bg}0A`,
            }}>
              {risk.label}
            </span>
          </div>
        </div>
        <div className="text-right text-[11px] text-[#a1a1a6]">
          <p>Confiance : {(pred.confidence * 100).toFixed(0)}%</p>
          <p>Modèle : {pred.model_version}</p>
        </div>
      </div>

      {/* Horizons */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: '6 mois', value: pred.probability_6m },
          { label: '12 mois', value: pred.probability_12m },
          { label: '18 mois', value: pred.probability_18m },
          { label: '24 mois', value: pred.probability_24m },
        ].map((h) => {
          const pct = h.value * 100;
          const col = pct < 5 ? '#2d9d3f' : pct < 15 ? '#bf5a00' : '#c4342d';
          return (
            <div key={h.label} className="bg-[#f5f5f7] rounded-[12px] p-3 text-center">
              <p className="text-[10px] text-[#86868b] mb-1">{h.label}</p>
              <p className="text-[17px] font-semibold tracking-tight" style={{ color: col }}>
                {pct.toFixed(1)}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-[6px] bg-[#f5f5f7] rounded-full overflow-hidden mb-5">
        <div className="h-full rounded-full transition-all duration-700" style={{
          width: `${Math.min(100, pred.probability_18m * 100 * 2)}%`,
          background: `linear-gradient(90deg, #2d9d3f, #bf5a00 50%, #c4342d)`,
        }} />
      </div>

      {/* Contributing factors */}
      {pred.contributing_factors.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] text-[#6e6e73] font-medium mb-2">Facteurs contributifs</p>
          {pred.contributing_factors.map((f, i) => (
            <div key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-[10px] text-[12px] ${
              f.direction === 'risque'
                ? 'bg-[#c4342d]/[0.05] text-[#a52a24]'
                : 'bg-[#2d9d3f]/[0.05] text-[#1a7c2f]'
            }`}>
              {f.direction === 'risque'
                ? <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.8} />
                : <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={1.8} />}
              <span>{FEATURE_LABELS[f.feature] || f.feature}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
