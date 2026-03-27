'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import ScoreExplainer from '@/components/ui/ScoreExplainer';
import type { Deal } from '@/types/database';

type Props = { deal: Deal; dealId: string };

type DirectorData = {
  nb_mandats_total: number;
  nb_societes_saines: number;
  nb_societes_liquidees: number;
  nb_procedures_collectives: number;
  taux_reussite: number | null;
  jours_depuis_nomination: number | null;
  changement_recent: boolean;
  privilege_tresor_montant: number | null;
  privilege_urssaf_montant: number | null;
  charge_mensuelle_creditbaux_estimee: number | null;
  signaux_positifs: string[];
  signaux_negatifs: string[];
  score_reputation: number | null;
};

export default function DirectorTab({ deal, dealId }: Props) {
  const [data, setData] = useState<DirectorData | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('deal_director_analysis').select('*').eq('deal_id', dealId).maybeSingle()
      .then(({ data: d }: { data: DirectorData | null }) => { if (d) setData(d); });
  }, [dealId, supabase]);

  const signals = [];

  // From deal data
  if (deal.dirigeant_nom)
    signals.push({ text: `Dirigeant : ${deal.dirigeant_prenom} ${deal.dirigeant_nom}`, type: 'positive' as const });

  if (deal.changement_dirigeant_recent)
    signals.push({ text: `Dirigeant nommé récemment (${deal.jours_depuis_nomination || '?'} jours) — historique limité`, type: 'warning' as const });
  else if (deal.jours_depuis_nomination && deal.jours_depuis_nomination > 1825)
    signals.push({ text: `Dirigeant en poste depuis ${Math.floor(deal.jours_depuis_nomination / 365)} ans — bonne stabilité`, type: 'positive' as const });

  // BDF
  if (deal.cotation_bdf_credit === 'P')
    signals.push({ text: 'Cotation BDF = P — VETO automatique', type: 'negative' as const });
  else if (deal.cotation_bdf_credit)
    signals.push({ text: `Cotation BDF : ${deal.cotation_bdf_activite || ''}${deal.cotation_bdf_credit} (source : ${deal.cotation_bdf_source || 'inconnue'})`, type: 'positive' as const });

  if (deal.indicateur_dirigeant_bdf === '060')
    signals.push({ text: 'Indicateur BDF dirigeant = 060 — VETO automatique', type: 'negative' as const });
  else if (deal.indicateur_dirigeant_bdf === '050')
    signals.push({ text: 'Indicateur BDF dirigeant = 050 — incident mineur', type: 'warning' as const });

  // From director analysis
  if (data) {
    if (data.nb_societes_liquidees === 0)
      signals.push({ text: 'Aucune liquidation dans l\'historique du dirigeant', type: 'positive' as const });
    else if (data.nb_societes_liquidees === 1)
      signals.push({ text: '1 liquidation dans l\'historique', type: 'warning' as const });
    else
      signals.push({ text: `${data.nb_societes_liquidees} liquidations — risque élevé`, type: 'negative' as const });

    if (data.taux_reussite !== null && data.taux_reussite >= 0.8)
      signals.push({ text: `Taux de réussite : ${(data.taux_reussite * 100).toFixed(0)}% sur ${data.nb_mandats_total} mandats`, type: 'positive' as const });
    else if (data.taux_reussite !== null && data.taux_reussite < 0.5)
      signals.push({ text: `Taux de réussite faible : ${(data.taux_reussite * 100).toFixed(0)}%`, type: 'negative' as const });

    if (data.privilege_tresor_montant && data.privilege_tresor_montant > 0)
      signals.push({ text: `Privilège Trésor : ${data.privilege_tresor_montant.toLocaleString('fr-FR')} EUR`, type: 'negative' as const });
    if (data.privilege_urssaf_montant && data.privilege_urssaf_montant > 0)
      signals.push({ text: `Privilège URSSAF : ${data.privilege_urssaf_montant.toLocaleString('fr-FR')} EUR`, type: 'negative' as const });

    if (data.charge_mensuelle_creditbaux_estimee && data.charge_mensuelle_creditbaux_estimee > 0)
      signals.push({ text: `Crédit-baux en cours : ${data.charge_mensuelle_creditbaux_estimee.toLocaleString('fr-FR')} EUR/mois`, type: 'warning' as const });

    // Append custom signals
    (data.signaux_positifs || []).forEach((s) =>
      signals.push({ text: s, type: 'positive' as const }));
    (data.signaux_negatifs || []).forEach((s) =>
      signals.push({ text: s, type: 'negative' as const }));
  }

  if (!data && !deal.dirigeant_nom)
    signals.push({ text: 'Aucune donnée dirigeant disponible', type: 'warning' as const });

  return (
    <div className="space-y-3">
      <ScoreExplainer score={data?.score_reputation ?? null} label="Score Dirigeant & Inscriptions" signals={signals} />

      {/* Mandats */}
      {data && (
        <div className="tile" style={{ padding: '24px' }}>
          <h3 className="text-[15px] font-semibold text-[#2d2d2d] mb-4">Historique des mandats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Metric label="Mandats total" value={data.nb_mandats_total.toString()} />
            <Metric label="Sociétés saines" value={data.nb_societes_saines.toString()} color="#2d9d3f" />
            <Metric label="Liquidations" value={data.nb_societes_liquidees.toString()} color={data.nb_societes_liquidees > 0 ? '#c4342d' : '#2d9d3f'} />
            <Metric label="Taux réussite" value={data.taux_reussite !== null ? `${(data.taux_reussite * 100).toFixed(0)}%` : '—'} color={data.taux_reussite !== null && data.taux_reussite >= 0.7 ? '#2d9d3f' : '#c4342d'} />
          </div>
        </div>
      )}

      {/* RGPD notice */}
      <p className="text-[11px] text-[#a1a1a6] leading-relaxed">
        Données traitées dans le cadre de la prévention du risque de crédit (art. 6.1.f RGPD)
      </p>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#f5f5f7] rounded-[14px] p-4 text-center">
      <p className="text-[11px] text-[#86868b] mb-1">{label}</p>
      <p className="text-[22px] font-semibold font-mono tracking-tight" style={{ color: color || '#2d2d2d' }}>{value}</p>
    </div>
  );
}
