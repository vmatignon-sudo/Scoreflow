'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import StepProspect from '@/components/deal/StepProspect';
import StepDeal from '@/components/deal/StepDeal';
import StepDocuments from '@/components/deal/StepDocuments';
import StepLaunch from '@/components/deal/StepLaunch';

export type DealDraft = {
  // Prospect
  siren: string;
  raison_sociale: string;
  forme_juridique: string;
  code_naf: string;
  secteur_label: string;
  adresse: string;
  date_creation_entreprise: string;
  dirigeant_nom: string;
  dirigeant_prenom: string;
  dirigeant_date_nomination: string | null;
  // Deal
  type_financement: string;
  montant_finance: number;
  apport_initial: number;
  duree_mois: number;
  depot_garantie: number;
  // Asset
  asset_class: string;
  asset_subclass: string;
  marque: string;
  modele: string;
  annee_fabrication: number;
  etat: string;
  kilometrage: number;
  heures_moteur: number;
  prix_achat_ht: number;
  numero_serie: string;
  vin: string;
  immatriculation: string;
  traceur_gps: boolean;
  contrat_recuperation: boolean;
  fournisseur_nom: string;
  // Refinancement
  taux_refinancement_banque: number;
  loyer_mensuel_banque: number;
  frais_dossier_banque: number;
  penalites_remboursement_anticipe: number;
  // BDF
  cotation_bdf_activite: string;
  cotation_bdf_credit: string;
  cotation_bdf_source: string;
  indicateur_dirigeant_bdf: string;
  // Documents
  documents: File[];
};

const INITIAL_DRAFT: DealDraft = {
  siren: '',
  raison_sociale: '',
  forme_juridique: '',
  code_naf: '',
  secteur_label: '',
  adresse: '',
  date_creation_entreprise: '',
  dirigeant_nom: '',
  dirigeant_prenom: '',
  dirigeant_date_nomination: null,
  type_financement: '',
  montant_finance: 0,
  apport_initial: 0,
  duree_mois: 48,
  depot_garantie: 0,
  asset_class: '',
  asset_subclass: '',
  marque: '',
  modele: '',
  annee_fabrication: new Date().getFullYear(),
  etat: 'neuf',
  kilometrage: 0,
  heures_moteur: 0,
  prix_achat_ht: 0,
  numero_serie: '',
  vin: '',
  immatriculation: '',
  traceur_gps: false,
  contrat_recuperation: false,
  fournisseur_nom: '',
  taux_refinancement_banque: 4.5,
  loyer_mensuel_banque: 0,
  frais_dossier_banque: 0,
  penalites_remboursement_anticipe: 0,
  cotation_bdf_activite: '',
  cotation_bdf_credit: '',
  cotation_bdf_source: 'non_disponible',
  indicateur_dirigeant_bdf: '',
  documents: [],
};

const STEPS = [
  { num: 1, label: 'Prospect' },
  { num: 2, label: 'Le deal' },
  { num: 3, label: 'Documents' },
  { num: 4, label: 'Analyse' },
];

export default function NewDealPage() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<DealDraft>(INITIAL_DRAFT);

  function updateDraft(updates: Partial<DealDraft>) {
    setDraft((prev) => ({ ...prev, ...updates }));
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Sidebar />
      <main className="ml-[240px] p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <h1 className="text-2xl font-bold text-[#0F1923] mb-2">Nouveau dossier</h1>
          <p className="text-[#4A5568] mb-6">5 minutes pour analyser un deal complet</p>

          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium w-full ${
                    s.num === step
                      ? 'bg-[#1B4FD8] text-white'
                      : s.num < step
                      ? 'bg-[#EBF0FF] text-[#1B4FD8]'
                      : 'bg-[#EEF0F5] text-[#8A95A3]'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    s.num === step
                      ? 'bg-white/20'
                      : s.num < step
                      ? 'bg-[#1B4FD8]/10'
                      : 'bg-[#E2E8F0]'
                  }`}>
                    {s.num < step ? '✓' : s.num}
                  </span>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Step content */}
          {step === 1 && (
            <StepProspect
              draft={draft}
              updateDraft={updateDraft}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepDeal
              draft={draft}
              updateDraft={updateDraft}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepDocuments
              draft={draft}
              updateDraft={updateDraft}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <StepLaunch
              draft={draft}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
