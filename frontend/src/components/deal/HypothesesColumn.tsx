'use client';

import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import type { Deal, DealAsset } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Props = { deal: Deal; asset: DealAsset | null; dealId: string; supabase: SupabaseClient };

export default function HypothesesColumn({ deal, asset, dealId, supabase }: Props) {
  return (
    <div className="hidden lg:block w-[280px] shrink-0 border-r border-black/[0.04] bg-white/40 overflow-y-auto">
      <div className="p-4">
        <p className="text-[10px] font-semibold text-[#a1a1a6] uppercase tracking-widest mb-4">Hypothèses</p>

        {/* Tuile 1 — Entreprise */}
        <EditableTile title="Entreprise" dealId={dealId} table="deals" supabase={supabase}
          fields={[
            { key: 'raison_sociale', label: 'Raison sociale', value: deal.raison_sociale || '', type: 'text' },
            { key: 'forme_juridique', label: 'Forme juridique', value: deal.forme_juridique || '', type: 'text' },
            { key: 'siren', label: 'SIREN', value: deal.siren || '', type: 'text' },
            { key: 'code_naf', label: 'NAF', value: `${deal.code_naf || ''} ${deal.secteur_label || ''}`, type: 'readonly' },
            { key: 'dirigeant_nom', label: 'Dirigeant', value: `${deal.dirigeant_prenom || ''} ${deal.dirigeant_nom || ''}`.trim(), type: 'readonly' },
            { key: 'cotation_bdf_activite', label: 'Cote BDF activité', value: deal.cotation_bdf_activite || '', type: 'text' },
            { key: 'cotation_bdf_credit', label: 'Cote BDF crédit', value: deal.cotation_bdf_credit || '', type: 'text' },
            { key: 'cotation_bdf_source', label: 'Source BDF', value: deal.cotation_bdf_source?.replace(/_/g, ' ') || '', type: 'readonly' },
            { key: 'indicateur_dirigeant_bdf', label: 'Indicateur dirigeant', value: deal.indicateur_dirigeant_bdf || '', type: 'text' },
          ]}
        />

        {/* Tuile 2 — Bien à financer */}
        <EditableTile title="Bien à financer" dealId={dealId} table="deal_assets" supabase={supabase}
          fields={[
            { key: 'asset_class', label: 'Catégorie', value: asset?.asset_class?.replace(/_/g, ' ') || '', type: 'readonly' },
            { key: 'marque', label: 'Marque', value: asset?.marque || '', type: 'text' },
            { key: 'modele', label: 'Modèle', value: asset?.modele || '', type: 'text' },
            { key: 'annee_fabrication', label: 'Année', value: asset?.annee_fabrication?.toString() || '', type: 'text' },
            { key: 'etat', label: 'État', value: asset?.etat?.replace(/_/g, ' ') || '', type: 'readonly' },
            { key: 'prix_achat_ht', label: 'Prix HT', value: asset?.prix_achat_ht ? `${asset.prix_achat_ht.toLocaleString('fr-FR')} EUR` : '', type: 'text' },
            { key: 'traceur_gps', label: 'GPS', value: asset?.traceur_gps ? 'Oui' : 'Non', type: 'toggle' },
            { key: 'contrat_recuperation', label: 'Récupérateur', value: asset?.contrat_recuperation ? 'Oui' : 'Non', type: 'toggle' },
            { key: 'coefficient_recuperabilite', label: 'Coeff. récup.', value: asset?.coefficient_recuperabilite ? `${(asset.coefficient_recuperabilite * 100).toFixed(0)}%` : '—', type: 'readonly' },
          ]}
        />

        {/* Tuile 3 — Financement banque */}
        <EditableTile title="Financement banque" dealId={dealId} table="deals" supabase={supabase}
          emptyMessage={!deal.taux_refinancement_banque && !deal.loyer_mensuel_banque ? 'Non renseigné' : undefined}
          fields={[
            { key: 'taux_refinancement_banque', label: 'Taux refinancement', value: deal.taux_refinancement_banque ? `${deal.taux_refinancement_banque}%` : '', type: 'text' },
            { key: 'loyer_mensuel_banque', label: 'Loyer banque', value: deal.loyer_mensuel_banque ? `${deal.loyer_mensuel_banque.toLocaleString('fr-FR')} EUR/m` : '', type: 'text' },
            { key: 'frais_dossier_banque', label: 'Frais dossier', value: deal.frais_dossier_banque ? `${deal.frais_dossier_banque.toLocaleString('fr-FR')} EUR` : '', type: 'text' },
            { key: 'penalites_remboursement_anticipe', label: 'Pénalités RA', value: deal.penalites_remboursement_anticipe ? `${deal.penalites_remboursement_anticipe.toLocaleString('fr-FR')} EUR` : '', type: 'text' },
          ]}
        />

        {/* Tuile 4 — Financement client */}
        <EditableTile title="Financement client" dealId={dealId} table="deals" supabase={supabase}
          fields={[
            { key: 'type_financement', label: 'Type', value: deal.type_financement?.replace('_', ' ') || '', type: 'readonly' },
            { key: 'montant_finance', label: 'Montant financé', value: deal.montant_finance ? `${deal.montant_finance.toLocaleString('fr-FR')} EUR` : '', type: 'text' },
            { key: 'apport_initial', label: 'Apport initial', value: deal.apport_initial ? `${deal.apport_initial.toLocaleString('fr-FR')} EUR` : '0 EUR', type: 'text' },
            { key: 'depot_garantie', label: 'Dépôt garantie', value: deal.depot_garantie ? `${deal.depot_garantie.toLocaleString('fr-FR')} EUR` : '0 EUR', type: 'text' },
            { key: 'duree_mois', label: 'Durée', value: deal.duree_mois ? `${deal.duree_mois} mois` : '', type: 'text' },
            { key: 'loyer_mensuel_client', label: 'Loyer client', value: deal.loyer_mensuel_client ? `${deal.loyer_mensuel_client.toLocaleString('fr-FR')} EUR/m` : 'Auto', type: 'readonly' },
          ]}
        />
      </div>
    </div>
  );
}

// ---- Editable Tile ----

type Field = {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'readonly' | 'toggle';
};

function EditableTile({ title, fields, emptyMessage }: {
  title: string;
  dealId: string;
  table: string;
  supabase: SupabaseClient;
  fields: Field[];
  emptyMessage?: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white rounded-[14px] shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-semibold text-[#2d2d2d]">{title}</h4>
        <button onClick={() => setEditing(!editing)}
          className="p-1 text-[#a1a1a6] hover:text-[#1e40af] rounded-[6px] hover:bg-[#1e40af]/[0.06] transition-all">
          {editing
            ? <Check className="w-3 h-3" strokeWidth={2} />
            : <Pencil className="w-3 h-3" strokeWidth={1.8} />}
        </button>
      </div>

      {emptyMessage && !editing ? (
        <p className="text-[11px] text-[#a1a1a6] italic">{emptyMessage}</p>
      ) : (
        <div className="space-y-1.5">
          {fields.map((f) => (
            <div key={f.key} className="flex justify-between items-center text-[11px]">
              <span className="text-[#86868b] shrink-0">{f.label}</span>
              {editing && f.type === 'text' ? (
                <input
                  defaultValue={f.value}
                  className="w-[120px] text-right font-mono text-[10px] text-[#2d2d2d] bg-[#f5f5f7] rounded-[6px] px-2 py-1 outline-none focus:ring-1 focus:ring-[#1e40af]/30"
                />
              ) : (
                <span className={`font-mono text-[10px] ${f.value ? 'text-[#2d2d2d]' : 'text-[#a1a1a6]'}`}>
                  {f.value || '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
