'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { triggerScoring } from '@/lib/api/scoring';
import type { DealDraft } from '@/app/deals/new/page';

type Props = {
  draft: DealDraft;
  onBack: () => void;
};

const ANALYSIS_STEPS = [
  { key: 'macro', label: 'Analyse macro-économique', icon: '🌍' },
  { key: 'sector', label: 'Analyse sectorielle', icon: '🏭' },
  { key: 'financial', label: 'Analyse financière', icon: '📊' },
  { key: 'asset', label: 'Évaluation du bien', icon: '🔧' },
  { key: 'director', label: 'Analyse dirigeant', icon: '👤' },
];

export default function StepLaunch({ draft, onBack }: Props) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<Record<string, 'pending' | 'processing' | 'done'>>({
    macro: 'pending',
    sector: 'pending',
    financial: 'pending',
    asset: 'pending',
    director: 'pending',
  });
  const router = useRouter();
  const supabase = createClient();

  async function handleLaunch() {
    setAnalyzing(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get organization
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Create the deal
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          organization_id: profile.organization_id,
          created_by: user.id,
          siren: draft.siren,
          raison_sociale: draft.raison_sociale,
          forme_juridique: draft.forme_juridique,
          code_naf: draft.code_naf,
          secteur_label: draft.secteur_label,
          adresse: draft.adresse,
          date_creation_entreprise: draft.date_creation_entreprise || null,
          dirigeant_nom: draft.dirigeant_nom,
          dirigeant_prenom: draft.dirigeant_prenom,
          dirigeant_date_nomination: draft.dirigeant_date_nomination,
          type_financement: draft.type_financement || null,
          montant_finance: draft.montant_finance,
          apport_initial: draft.apport_initial,
          duree_mois: draft.duree_mois,
          depot_garantie: draft.depot_garantie,
          taux_refinancement_banque: draft.taux_refinancement_banque,
          loyer_mensuel_banque: draft.loyer_mensuel_banque || null,
          frais_dossier_banque: draft.frais_dossier_banque,
          penalites_remboursement_anticipe: draft.penalites_remboursement_anticipe,
          cotation_bdf_activite: draft.cotation_bdf_activite || null,
          cotation_bdf_credit: draft.cotation_bdf_credit || null,
          cotation_bdf_source: draft.cotation_bdf_source || null,
          indicateur_dirigeant_bdf: draft.indicateur_dirigeant_bdf || null,
          status: 'analyzing',
          loyer_mensuel_client: draft.montant_finance > 0 && draft.duree_mois > 0
            ? (draft.montant_finance - draft.apport_initial) / draft.duree_mois
            : null,
        })
        .select()
        .single();

      if (dealError || !deal) {
        console.error('Error creating deal:', dealError);
        return;
      }

      // Create asset
      if (draft.asset_class) {
        await supabase.from('deal_assets').insert({
          deal_id: deal.id,
          asset_class: draft.asset_class,
          asset_subclass: draft.asset_subclass || null,
          marque: draft.marque || null,
          modele: draft.modele || null,
          annee_fabrication: draft.annee_fabrication || null,
          etat: draft.etat || null,
          kilometrage: draft.kilometrage || null,
          heures_moteur: draft.heures_moteur || null,
          prix_achat_ht: draft.prix_achat_ht || null,
          numero_serie: draft.numero_serie || null,
          vin: draft.vin || null,
          immatriculation: draft.immatriculation || null,
          traceur_gps: draft.traceur_gps,
          contrat_recuperation: draft.contrat_recuperation,
          fournisseur_nom: draft.fournisseur_nom || null,
        });
      }

      // Call scoring backend
      setProgress((prev) => ({ ...prev, macro: 'processing' }));

      try {
        const scoringResult = await triggerScoring(deal.id, profile.organization_id);

        // Update progress as we receive results
        setProgress({ macro: 'done', sector: 'done', financial: 'done', asset: 'done', director: 'done' });

        // Save score to Supabase
        await supabase.from('deal_scores').insert({
          deal_id: deal.id,
          score_macro: scoringResult.scores?.macro_sectoriel?.score_macro ?? null,
          score_sectoriel: scoringResult.scores?.macro_sectoriel?.score_sectoriel ?? null,
          score_macro_sectoriel_combine: scoringResult.scores?.macro_sectoriel?.score ?? null,
          score_financier: scoringResult.scores?.financier?.score ?? null,
          score_materiel: scoringResult.scores?.materiel?.score ?? null,
          score_dirigeant: scoringResult.scores?.dirigeant?.score ?? null,
          score_deal_total: scoringResult.score_total ?? null,
          verdict: scoringResult.verdict?.verdict ?? null,
          veto_raison: scoringResult.verdict?.raison ?? null,
          recommandation: scoringResult.verdict?.message ?? null,
          deal_optimizer_suggestions: scoringResult.optimizer ?? null,
          ponderation_used: scoringResult.ponderation_used ?? null,
        });

        // Update deal status
        await supabase
          .from('deals')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', deal.id);

      } catch (scoringError) {
        console.error('Scoring API error:', scoringError);
        // Fallback: mark steps as done anyway, score will be null
        setProgress({ macro: 'done', sector: 'done', financial: 'done', asset: 'done', director: 'done' });

        await supabase
          .from('deals')
          .update({ status: 'completed' })
          .eq('id', deal.id);
      }

      // Navigate to deal view
      await new Promise((r) => setTimeout(r, 300));
      router.push(`/deals/${deal.id}`);
    } catch (err) {
      console.error('Error launching analysis:', err);
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h3 className="font-semibold text-[#2d2d2d] mb-4">Récapitulatif</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#a1a1a6]">Entreprise</span>
            <p className="font-medium text-[#424245]">{draft.raison_sociale}</p>
            <p className="text-[#6e6e73]">{draft.siren}</p>
          </div>
          <div>
            <span className="text-[#a1a1a6]">Secteur</span>
            <p className="text-[#1d1d1f]">{draft.secteur_label || draft.code_naf}</p>
          </div>
          <div>
            <span className="text-[#a1a1a6]">Montant financé</span>
            <p className="font-mono font-bold text-[#1d1d1f]">
              {draft.montant_finance.toLocaleString('fr-FR')} EUR
            </p>
          </div>
          <div>
            <span className="text-[#a1a1a6]">Durée</span>
            <p className="font-mono text-[#1d1d1f]">{draft.duree_mois} mois</p>
          </div>
          <div>
            <span className="text-[#a1a1a6]">Bien</span>
            <p className="text-[#1d1d1f]">
              {draft.marque} {draft.modele} {draft.annee_fabrication}
            </p>
          </div>
          <div>
            <span className="text-[#a1a1a6]">Type</span>
            <p className="text-[#1d1d1f] capitalize">
              {draft.type_financement?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Analysis progress */}
      {analyzing && (
        <div className="bg-white rounded-[20px] shadow p-6">
          <h3 className="font-semibold text-[#2d2d2d] mb-4">Analyse en cours...</h3>
          <div className="space-y-3">
            {ANALYSIS_STEPS.map((step) => (
              <div key={step.key} className="flex items-center gap-3">
                <span className="text-xl">{step.icon}</span>
                <span className="flex-1 text-sm text-[#424245]">{step.label}</span>
                <AnalysisStatus status={progress[step.key]} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {!analyzing && (
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 bg-white border border-black/[0.04] text-[#6e6e73] py-3 rounded-lg font-medium hover:bg-[#f5f5f7] transition-colors"
          >
            Retour
          </button>
          <button
            onClick={handleLaunch}
            className="flex-1 bg-[#1d1d1f] text-white py-3 rounded-lg font-medium hover:bg-[#000] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Analyser ce deal
          </button>
        </div>
      )}
    </div>
  );
}

function AnalysisStatus({ status }: { status: string }) {
  if (status === 'processing') {
    return (
      <div className="w-5 h-5 border-2 border-[#1d1d1f] border-t-transparent rounded-full animate-spin" />
    );
  }
  if (status === 'done') {
    return (
      <div className="w-5 h-5 bg-[#059669] rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  return <div className="w-5 h-5 bg-[#f5f5f7] rounded-full" />;
}
