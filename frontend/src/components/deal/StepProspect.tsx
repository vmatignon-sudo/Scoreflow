'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { searchEnterprise } from '@/lib/api/enterprise';
import type { DealDraft } from '@/app/deals/new/page';

type Props = {
  draft: DealDraft;
  updateDraft: (updates: Partial<DealDraft>) => void;
  onNext: () => void;
};

type EnterpriseResult = {
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
  tranche_effectif: string;
  etat_administratif: string;
};

export default function StepProspect({ draft, updateDraft, onNext }: Props) {
  const [query, setQuery] = useState(draft.siren || draft.raison_sociale || '');
  const [results, setResults] = useState<EnterpriseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EnterpriseResult | null>(
    draft.siren ? (draft as unknown as EnterpriseResult) : null
  );
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchEnterprise(debouncedQuery)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  function handleSelect(enterprise: EnterpriseResult) {
    setSelected(enterprise);
    setQuery(enterprise.siren);
    setResults([]);

    // Calculate jours_depuis_nomination
    const nomination = enterprise.dirigeant_date_nomination;
    const jours = nomination
      ? Math.floor((Date.now() - new Date(nomination).getTime()) / 86400000)
      : null;

    updateDraft({
      siren: enterprise.siren,
      raison_sociale: enterprise.raison_sociale,
      forme_juridique: enterprise.forme_juridique,
      code_naf: enterprise.code_naf,
      secteur_label: enterprise.secteur_label,
      adresse: enterprise.adresse,
      date_creation_entreprise: enterprise.date_creation_entreprise,
      dirigeant_nom: enterprise.dirigeant_nom,
      dirigeant_prenom: enterprise.dirigeant_prenom,
      dirigeant_date_nomination: enterprise.dirigeant_date_nomination,
    });
  }

  const joursNomination = selected?.dirigeant_date_nomination
    ? Math.floor(
        (Date.now() - new Date(selected.dirigeant_date_nomination).getTime()) / 86400000
      )
    : null;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
      <h2 className="text-lg font-semibold text-[#0F1923] mb-1">Prospect</h2>
      <p className="text-sm text-[#4A5568] mb-6">
        Entrez un SIREN ou une raison sociale
      </p>

      {/* Search field */}
      <div className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="SIREN (9 chiffres) ou raison sociale..."
          className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#1B4FD8] focus:border-transparent outline-none text-[#0F1923] text-lg"
        />
        {loading && (
          <div className="absolute right-3 top-3.5">
            <div className="w-5 h-5 border-2 border-[#1B4FD8] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Results dropdown */}
        {results.length > 0 && !selected && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.siren}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 hover:bg-[#F7F8FA] border-b border-[#E2E8F0] last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#0F1923]">{r.raison_sociale}</p>
                    <p className="text-sm text-[#4A5568]">
                      {r.siren} - {r.secteur_label}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.etat_administratif === 'A'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {r.etat_administratif === 'A' ? 'Active' : 'Fermée'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected enterprise preview */}
      {selected && (
        <div className="border border-[#E2E8F0] rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0F1923]">
              Voilà ce que nous avons trouvé
            </h3>
            <button
              onClick={() => {
                setSelected(null);
                setQuery('');
              }}
              className="text-sm text-[#4A5568] hover:text-[#0F1923]"
            >
              Modifier
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#8A95A3]">Raison sociale</span>
              <p className="font-medium text-[#0F1923]">{selected.raison_sociale}</p>
            </div>
            <div>
              <span className="text-[#8A95A3]">SIREN</span>
              <p className="font-mono text-[#0F1923]">{selected.siren}</p>
            </div>
            <div>
              <span className="text-[#8A95A3]">Forme juridique</span>
              <p className="text-[#0F1923]">{selected.forme_juridique || '—'}</p>
            </div>
            <div>
              <span className="text-[#8A95A3]">Secteur (NAF)</span>
              <p className="text-[#0F1923]">
                {selected.code_naf} — {selected.secteur_label}
              </p>
            </div>
            <div>
              <span className="text-[#8A95A3]">Adresse</span>
              <p className="text-[#0F1923]">{selected.adresse || '—'}</p>
            </div>
            <div>
              <span className="text-[#8A95A3]">Dirigeant</span>
              <p className="text-[#0F1923]">
                {selected.dirigeant_prenom} {selected.dirigeant_nom}
              </p>
            </div>
          </div>

          {/* Dirigeant récent badge */}
          {joursNomination !== null && joursNomination < 180 && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="text-orange-600 font-medium text-sm">
                Dirigeant nommé il y a {joursNomination} jours — Historique limité
              </span>
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!selected}
        className="w-full bg-[#1B4FD8] text-white py-3 rounded-lg font-medium hover:bg-[#1640B0] transition-colors disabled:opacity-50"
      >
        Continuer vers le deal
      </button>
    </div>
  );
}
