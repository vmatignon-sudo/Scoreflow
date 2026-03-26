'use client';

import { useState, useCallback } from 'react';
import type { DealDraft } from '@/app/deals/new/page';

type Props = {
  draft: DealDraft;
  updateDraft: (updates: Partial<DealDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

const FINANCING_TYPES = [
  { id: 'loa', label: 'LOA', icon: '🚗' },
  { id: 'credit_bail', label: 'Crédit-bail', icon: '🏭' },
  { id: 'pret', label: 'Prêt', icon: '🏦' },
  { id: 'affacturage', label: 'Affacturage', icon: '📄' },
  { id: 'autre', label: 'Autre', icon: '📋' },
];

const ASSET_CLASSES = [
  { id: 'vehicule_leger', label: 'Véhicule léger', icon: '🚗' },
  { id: 'vehicule_utilitaire', label: 'Véhicule utilitaire', icon: '🚐' },
  { id: 'vehicule_luxe_collection', label: 'Luxe / Collection', icon: '🏎️' },
  { id: 'engin_tp', label: 'Engin TP', icon: '🚜' },
  { id: 'machine_industrielle', label: 'Machine industrielle', icon: '⚙️' },
  { id: 'materiel_agricole', label: 'Matériel agricole', icon: '🌾' },
  { id: 'vehicule_pl_transport', label: 'PL / Transport', icon: '🚛' },
  { id: 'levage_manutention', label: 'Levage / Manutention', icon: '🏗️' },
  { id: 'echafaudage_coffrage', label: 'Échafaudage', icon: '🔨' },
  { id: 'materiel_medical', label: 'Matériel médical', icon: '🏥' },
  { id: 'informatique_bureautique', label: 'Informatique', icon: '💻' },
  { id: 'materiel_restauration', label: 'Restauration', icon: '🍳' },
  { id: 'energie_environnement', label: 'Énergie / Environnement', icon: '🌱' },
  { id: 'autre', label: 'Autre', icon: '📦' },
];

const DURATIONS = [12, 24, 36, 48, 60, 72, 84];

export default function StepDeal({ draft, updateDraft, onNext, onBack }: Props) {
  const [showRefinancement, setShowRefinancement] = useState(false);
  const [showBDF, setShowBDF] = useState(false);

  // Estimate monthly payment
  const estimatedPayment =
    draft.montant_finance > 0 && draft.duree_mois > 0
      ? (draft.montant_finance - draft.apport_initial) / draft.duree_mois
      : 0;

  const marginBrut =
    estimatedPayment > 0 && draft.loyer_mensuel_banque > 0
      ? estimatedPayment - draft.loyer_mensuel_banque
      : 0;

  const marginPct =
    estimatedPayment > 0 ? (marginBrut / estimatedPayment) * 100 : 0;

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        // TODO: OCR + Claude extraction
        updateDraft({ documents: [...draft.documents, ...files] });
      }
    },
    [draft.documents, updateDraft]
  );

  return (
    <div className="space-y-6">
      {/* Devis upload zone */}
      <div
        className="bg-white rounded-xl border-2 border-dashed border-black/[0.04] p-8 text-center hover:border-[#1d1d1f] transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
      >
        <svg className="w-10 h-10 text-[#a1a1a6] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-[#1d1d1f] font-medium">Déposez le devis fournisseur</p>
        <p className="text-sm text-[#a1a1a6] mt-1">pour remplissage automatique</p>
      </div>

      {/* Financing type */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h3 className="font-semibold text-[#2d2d2d] mb-4">Type de financement</h3>
        <div className="flex gap-2">
          {FINANCING_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => updateDraft({ type_financement: t.id })}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border text-sm transition-colors ${
                draft.type_financement === t.id
                  ? 'border-[#1d1d1f] bg-[#f5f5f7] text-[#1d1d1f]'
                  : 'border-black/[0.04] text-[#6e6e73] hover:bg-[#ededf0]'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Deal fields */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h3 className="font-semibold text-[#2d2d2d] mb-4">Conditions du deal</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#424245] mb-1">
              Montant financé (EUR)
            </label>
            <input
              type="number"
              value={draft.montant_finance || ''}
              onChange={(e) => updateDraft({ montant_finance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
              placeholder="85 000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#424245] mb-1">
              Apport initial (EUR)
            </label>
            <input
              type="number"
              value={draft.apport_initial || ''}
              onChange={(e) => updateDraft({ apport_initial: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
              placeholder="8 500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
              Durée : {draft.duree_mois} mois
            </label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => updateDraft({ duree_mois: d })}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    draft.duree_mois === d
                      ? 'border-[#1d1d1f] bg-[#f5f5f7] text-[#1d1d1f]'
                      : 'border-black/[0.04] text-[#6e6e73] hover:bg-[#ededf0]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#424245] mb-1">
              Dépôt de garantie (EUR)
            </label>
            <input
              type="number"
              value={draft.depot_garantie || ''}
              onChange={(e) => updateDraft({ depot_garantie: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#424245] mb-1">
              Valeur du bien (EUR)
            </label>
            <input
              type="number"
              value={draft.prix_achat_ht || ''}
              onChange={(e) => updateDraft({ prix_achat_ht: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
            />
          </div>
        </div>

        {/* Real-time estimate */}
        {estimatedPayment > 0 && (
          <div className="mt-4 p-3 bg-[#f5f5f7] rounded-lg flex items-center justify-between text-sm">
            <span className="text-[#6e6e73]">Loyer estimé :</span>
            <span className="font-mono font-bold text-[#1d1d1f]">
              {estimatedPayment.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} EUR/mois
            </span>
            {marginBrut > 0 && (
              <span className="text-[#059669] font-medium">
                Marge : {marginBrut.toFixed(0)} EUR ({marginPct.toFixed(0)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Asset class */}
      <div className="bg-white rounded-[20px] shadow p-6">
        <h3 className="font-semibold text-[#2d2d2d] mb-4">Catégorie du bien</h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {ASSET_CLASSES.map((a) => (
            <button
              key={a.id}
              onClick={() => updateDraft({ asset_class: a.id })}
              className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs transition-colors ${
                draft.asset_class === a.id
                  ? 'border-[#1d1d1f] bg-[#f5f5f7] text-[#1d1d1f]'
                  : 'border-black/[0.04] text-[#6e6e73] hover:bg-[#ededf0]'
              }`}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="font-medium text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Asset details */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-[#424245] mb-1">Marque</label>
            <input
              type="text"
              value={draft.marque}
              onChange={(e) => updateDraft({ marque: e.target.value })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-sm text-[#424245]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#424245] mb-1">Modèle</label>
            <input
              type="text"
              value={draft.modele}
              onChange={(e) => updateDraft({ modele: e.target.value })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-sm text-[#424245]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#424245] mb-1">Année</label>
            <input
              type="number"
              value={draft.annee_fabrication}
              onChange={(e) => updateDraft({ annee_fabrication: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-sm text-[#424245]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#424245] mb-1">État</label>
            <select
              value={draft.etat}
              onChange={(e) => updateDraft({ etat: e.target.value })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-sm text-[#424245]"
            >
              <option value="neuf">Neuf</option>
              <option value="occasion_tres_bon">Occasion très bon état</option>
              <option value="occasion_bon">Occasion bon état</option>
              <option value="occasion_correct">Occasion correct</option>
              <option value="reconditionne">Reconditionné</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#424245] mb-1">Km</label>
            <input
              type="number"
              value={draft.kilometrage || ''}
              onChange={(e) => updateDraft({ kilometrage: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-sm text-[#424245]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#424245] mb-1">Heures moteur</label>
            <input
              type="number"
              value={draft.heures_moteur || ''}
              onChange={(e) => updateDraft({ heures_moteur: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-sm text-[#424245]"
            />
          </div>
        </div>

        {/* Recuperability section */}
        <div className="mt-4 p-4 bg-[#f5f5f7] rounded-lg">
          <h4 className="text-sm font-medium text-[#1d1d1f] mb-3">Récupérabilité</h4>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.traceur_gps}
                onChange={(e) => updateDraft({ traceur_gps: e.target.checked })}
                className="w-4 h-4 accent-[#1B4FD8]"
              />
              <span className="text-sm text-[#424245]">Traceur GPS (+0.15)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.contrat_recuperation}
                onChange={(e) => updateDraft({ contrat_recuperation: e.target.checked })}
                className="w-4 h-4 accent-[#1B4FD8]"
              />
              <span className="text-sm text-[#424245]">Contrat récupérateur (+0.05)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Refinancement (collapsible) */}
      <div className="bg-[#f5f5f7] rounded-[20px]">
        <button
          onClick={() => setShowRefinancement(!showRefinancement)}
          className="w-full flex items-center justify-between p-6"
        >
          <h3 className="font-semibold text-[#2d2d2d]">Refinancement</h3>
          <svg
            className={`w-5 h-5 text-[#a1a1a6] transition-transform ${showRefinancement ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showRefinancement && (
          <div className="px-6 pb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#424245] mb-1">Taux refinancement (%)</label>
              <input
                type="number"
                step="0.1"
                value={draft.taux_refinancement_banque}
                onChange={(e) => updateDraft({ taux_refinancement_banque: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#424245] mb-1">Loyer banque (EUR/mois)</label>
              <input
                type="number"
                value={draft.loyer_mensuel_banque || ''}
                onChange={(e) => updateDraft({ loyer_mensuel_banque: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#424245] mb-1">Frais dossier (EUR)</label>
              <input
                type="number"
                value={draft.frais_dossier_banque || ''}
                onChange={(e) => updateDraft({ frais_dossier_banque: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#424245] mb-1">Pénalités RA (EUR)</label>
              <input
                type="number"
                value={draft.penalites_remboursement_anticipe || ''}
                onChange={(e) => updateDraft({ penalites_remboursement_anticipe: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cotation BDF (collapsible) */}
      <div className="bg-[#f5f5f7] rounded-[20px]">
        <button
          onClick={() => setShowBDF(!showBDF)}
          className="w-full flex items-center justify-between p-6"
        >
          <h3 className="font-semibold text-[#2d2d2d]">Cotation Banque de France</h3>
          <svg
            className={`w-5 h-5 text-[#a1a1a6] transition-transform ${showBDF ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showBDF && (
          <div className="px-6 pb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#424245] mb-1">Cote activité (A-X)</label>
              <input
                type="text"
                value={draft.cotation_bdf_activite}
                onChange={(e) => updateDraft({ cotation_bdf_activite: e.target.value })}
                className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
                placeholder="D"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#424245] mb-1">Cote crédit (1+ - P)</label>
              <input
                type="text"
                value={draft.cotation_bdf_credit}
                onChange={(e) => updateDraft({ cotation_bdf_credit: e.target.value })}
                className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
                placeholder="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#424245] mb-1">Source</label>
              <select
                value={draft.cotation_bdf_source}
                onChange={(e) => updateDraft({ cotation_bdf_source: e.target.value })}
                className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
              >
                <option value="non_disponible">Non disponible</option>
                <option value="fiben_direct">FIBEN (saisie)</option>
                <option value="estimation_infonet">Estimation Infonet</option>
                <option value="fournie_prospect">Fournie par le prospect</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#424245] mb-1">Indicateur dirigeant</label>
              <select
                value={draft.indicateur_dirigeant_bdf}
                onChange={(e) => updateDraft({ indicateur_dirigeant_bdf: e.target.value })}
                className="w-full px-3 py-2 rounded-[16px] bg-[#f5f5f7] text-[#1d1d1f]"
              >
                <option value="">Non renseigné</option>
                <option value="000">000 - Aucun incident</option>
                <option value="050">050 - Incident mineur</option>
                <option value="060">060 - Incident majeur (VETO)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-white border border-black/[0.04] text-[#6e6e73] py-3 rounded-lg font-medium hover:bg-[#f5f5f7] transition-colors"
        >
          Retour
        </button>
        <button
          onClick={onNext}
          disabled={!draft.type_financement || !draft.montant_finance}
          className="flex-1 bg-[#2563eb] text-white py-3 rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
