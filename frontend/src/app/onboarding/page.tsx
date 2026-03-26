'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const ACTIVITY_TYPES = [
  { id: 'financement_auto', label: 'Financement automobile' },
  { id: 'financement_materiel', label: 'Financement matériel / équipement' },
  { id: 'credit_bail', label: 'Crédit-bail immobilier' },
  { id: 'affacturage', label: 'Affacturage' },
  { id: 'courtage', label: 'Courtage en financement' },
  { id: 'banque', label: 'Établissement bancaire' },
  { id: 'autre', label: 'Autre' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [activityType, setActivityType] = useState('');
  const [tauxRefinancement, setTauxRefinancement] = useState(4.5);
  const [delaiRecuperation, setDelaiRecuperation] = useState(2);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleComplete() {
    setLoading(true);

    const slug = orgName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug: slug + '-' + Date.now().toString(36),
        settings: {
          ponderation_macro_sectoriel: 20,
          ponderation_financier: 30,
          ponderation_materiel: 30,
          ponderation_dirigeant: 20,
          seuil_go: 14,
          seuil_go_conditionnel: 10,
          seuil_changement_dirigeant_jours: 180,
          seuil_privilege_tresor_euros: 1,
          seuil_privilege_urssaf_euros: 1,
          nb_liquidations_veto: 2,
          activer_detection_somptuaire: true,
          seuil_depense_somptuaire: 500,
          whitelist_libelles_bancaires: [],
          taux_refinancement_defaut: tauxRefinancement,
          delai_recuperation_defaut_mois: delaiRecuperation,
          profils_scoring: [],
          activite_principale: activityType,
        },
      })
      .select()
      .single();

    if (orgError || !org) {
      setLoading(false);
      return;
    }

    // Update user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .upsert({
          id: user.id,
          organization_id: org.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || '',
          role: 'admin',
          onboarding_completed: true,
        });
    }

    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-black/[0.04] max-w-lg w-full">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#1d1d1f]' : 'bg-[#E2E8F0]'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Organization name */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-1">
              Bienvenue sur ScoreFlow
            </h2>
            <p className="text-[#6e6e73] mb-6">
              Comment s&apos;appelle votre organisation ?
            </p>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Ex: Finance Plus, BTP Crédit..."
              className="w-full px-3 py-2.5 rounded-[16px] bg-[#f5f5f7] focus:ring-2 focus:ring-[#1B4FD8] focus:border-transparent outline-none text-[#1d1d1f] mb-6"
            />
            <button
              onClick={() => setStep(2)}
              disabled={!orgName.trim()}
              className="w-full bg-[#1d1d1f] text-white py-2.5 rounded-lg font-medium hover:bg-[#000] transition-colors disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Step 2: Activity type */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-1">
              Type d&apos;activité
            </h2>
            <p className="text-[#6e6e73] mb-6">
              Quel est votre domaine principal ?
            </p>
            <div className="space-y-2 mb-6">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setActivityType(type.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    activityType === type.id
                      ? 'border-[#1d1d1f] bg-[#f5f5f7] text-[#1d1d1f]'
                      : 'border-black/[0.04] hover:bg-[#ededf0] text-[#1d1d1f]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-[#f5f5f7] text-[#6e6e73] py-2.5 rounded-lg font-medium hover:bg-[#f5f5f7] transition-colors"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!activityType}
                className="flex-1 bg-[#1d1d1f] text-white py-2.5 rounded-lg font-medium hover:bg-[#000] transition-colors disabled:opacity-50"
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Default parameters */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-[#1d1d1f] mb-1">
              Paramètres par défaut
            </h2>
            <p className="text-[#6e6e73] mb-6">
              Vous pourrez les modifier à tout moment.
            </p>

            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  Taux de refinancement par défaut : {tauxRefinancement}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={tauxRefinancement}
                  onChange={(e) => setTauxRefinancement(parseFloat(e.target.value))}
                  className="w-full accent-[#1B4FD8]"
                />
                <div className="flex justify-between text-xs text-[#a1a1a6] mt-1">
                  <span>1%</span>
                  <span>10%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  Délai de récupération par défaut : {delaiRecuperation} mois
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 6].map((m) => (
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
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-[#f5f5f7] text-[#6e6e73] py-2.5 rounded-lg font-medium hover:bg-[#f5f5f7] transition-colors"
              >
                Retour
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 bg-[#1d1d1f] text-white py-2.5 rounded-lg font-medium hover:bg-[#000] transition-colors disabled:opacity-50"
              >
                {loading ? 'Configuration...' : 'Lancer ScoreFlow'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
