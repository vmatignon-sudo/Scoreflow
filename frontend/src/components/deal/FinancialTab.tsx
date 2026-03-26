'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { triggerScoring } from '@/lib/api/scoring';
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
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} EUR`;
}

export default function FinancialTab({ dealId, organizationId }: Props) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: ratioRow } = await supabase
      .from('deal_financial_ratios')
      .select('*')
      .eq('deal_id', dealId)
      .order('annee', { ascending: false })
      .limit(1)
      .maybeSingle();
    setData(ratioRow);

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

      // Upload to Supabase Storage
      await supabase.storage.from('deal-documents').upload(path, file);

      // Detect type
      const lower = file.name.toLowerCase();
      const type = (lower.includes('liasse') || lower.includes('fiscal') || lower.includes('cerfa') || lower.endsWith('.xml'))
        ? 'liasse_fiscale'
        : (lower.includes('relev') || lower.includes('banc'))
          ? 'releve_bancaire'
          : 'liasse_fiscale';

      // Insert document record
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

  const handleReanalyze = useCallback(async () => {
    setReanalyzing(true);
    try {
      const result = await triggerScoring(dealId, organizationId);

      // Save updated score
      await supabase.from('deal_scores').insert({
        deal_id: dealId,
        score_macro: result.scores?.macro_sectoriel?.score_macro ?? null,
        score_sectoriel: result.scores?.macro_sectoriel?.score_sectoriel ?? null,
        score_macro_sectoriel_combine: result.scores?.macro_sectoriel?.score ?? null,
        score_financier: result.scores?.financier?.score ?? null,
        score_materiel: result.scores?.materiel?.score ?? null,
        score_dirigeant: result.scores?.dirigeant?.score ?? null,
        score_deal_total: result.score_total ?? null,
        verdict: result.verdict?.verdict ?? null,
        veto_raison: result.verdict?.raison ?? null,
        recommandation: result.verdict?.message ?? null,
        deal_optimizer_suggestions: result.optimizer ?? null,
        ponderation_used: result.ponderation_used ?? null,
      });

      // Refresh financial data
      await fetchData();
    } catch (err) {
      console.error('Re-analysis error:', err);
    }
    setReanalyzing(false);
  }, [dealId, organizationId, supabase, fetchData]);

  if (loading) {
    return (
      <div className="bg-white rounded-[20px] shadow p-6 animate-pulse">
        <div className="h-6 bg-[#f5f5f7] rounded w-1/3 mb-4" />
        <div className="h-4 bg-[#f5f5f7] rounded w-full mb-2" />
        <div className="h-4 bg-[#f5f5f7] rounded w-2/3" />
      </div>
    );
  }

  const ratios = data?.ratios || {};

  return (
    <div className="space-y-6">
      {/* Upload zone + documents list */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2d2d2d]">Documents financiers</h3>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e40af] text-white rounded-lg text-sm font-medium hover:bg-[#1e3a8a] transition-colors disabled:opacity-50"
          >
            {reanalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Relancer l&apos;analyse
              </>
            )}
          </button>
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
                    <span className="text-[10px] font-mono text-[#6e6e73]">
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
          Aucune donnée financière disponible. Uploadez une liasse fiscale ci-dessus puis cliquez sur &quot;Relancer l&apos;analyse&quot;.
        </div>
      )}

      {/* Scores académiques */}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[20px] shadow p-5">
              <Tooltip definition={RATIO_DEFINITIONS.altman_z.definition} formula={RATIO_DEFINITIONS.altman_z.formula} source={RATIO_DEFINITIONS.altman_z.source}>
                <h4 className="text-sm font-medium text-[#6e6e73] mb-1">Altman Z&apos;</h4>
              </Tooltip>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono text-[#1d1d1f]">
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
            <div className="bg-white rounded-[20px] shadow p-5">
              <Tooltip definition={RATIO_DEFINITIONS.conan_holder.definition} formula={RATIO_DEFINITIONS.conan_holder.formula} source={RATIO_DEFINITIONS.conan_holder.source}>
                <h4 className="text-sm font-medium text-[#6e6e73] mb-1">Conan &amp; Holder</h4>
              </Tooltip>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono text-[#1d1d1f]">
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

          {/* Données brutes */}
          <div className="bg-white rounded-[20px] shadow p-6">
            <h3 className="font-semibold text-[#2d2d2d] mb-4">
              Données comptables {data.annee ? `(${data.annee})` : ''}
            </h3>
            <div className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm">
              <KV label="Chiffre d'affaires" value={fmtEur(data.ca)} />
              <KV label="EBITDA" value={fmtEur(data.ebitda)} />
              <KV label="EBIT" value={fmtEur(data.ebit)} />
              <KV label="Résultat net" value={fmtEur(data.resultat_net)} />
              <KV label="CAF" value={fmtEur(data.caf)} />
              <KV label="Actif total" value={fmtEur(data.actif_total)} />
              <KV label="Fonds propres" value={fmtEur(data.fonds_propres)} />
              <KV label="Dettes financières" value={fmtEur(data.dettes_financieres)} />
              <KV label="Trésorerie" value={fmtEur(data.tresorerie)} />
            </div>
          </div>

          {/* Ratios par groupe */}
          {RATIO_GROUPS.map((group) => {
            const hasAny = group.keys.some((k) => ratios[k] !== null && ratios[k] !== undefined);
            if (!hasAny) return null;
            return (
              <div key={group.title} className="bg-white rounded-[20px] shadow p-6">
                <h3 className="font-semibold text-[#2d2d2d] mb-4">{group.title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {group.keys.map((key) => {
                    const val = ratios[key];
                    if (val === null || val === undefined) return null;
                    const def = RATIO_DEFINITIONS[key];
                    return (
                      <div key={key} className="flex justify-between items-center">
                        {def ? (
                          <Tooltip definition={def.definition} formula={def.formula} source={def.source}>
                            <span className="text-[#6e6e73]">{def.label}</span>
                          </Tooltip>
                        ) : (
                          <span className="text-[#6e6e73]">{RATIO_LABELS[key] || key}</span>
                        )}
                        <span className="font-mono font-medium text-[#424245]">{fmt(val)}</span>
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

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#a1a1a6]">{label}</span>
      <span className="font-mono text-[#1d1d1f]">{value}</span>
    </div>
  );
}

// ---- Predictive Card (Signaux Faibles) ----

import { CheckCircle, XCircle, TrendingUp } from 'lucide-react';

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
    <div className="bg-white rounded-[20px] shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#1e40af]" strokeWidth={1.8} />
        <h3 className="text-[15px] font-semibold text-[#2d2d2d]">Probabilité de défaillance</h3>
        <span className="text-[10px] text-[#a1a1a6] bg-[#f5f5f7] px-2 py-0.5 rounded-full">
          Signaux Faibles
        </span>
      </div>

      {/* Main indicator */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[12px] text-[#6e6e73] mb-0.5">Probabilité à 18 mois</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[36px] font-semibold font-mono tracking-tighter" style={{ color: risk.color }}>
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
              <p className="text-[17px] font-semibold font-mono tracking-tight" style={{ color: col }}>
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
