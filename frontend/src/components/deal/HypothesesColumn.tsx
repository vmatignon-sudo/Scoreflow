'use client';

import { useState } from 'react';
import { PenLine, Check } from 'lucide-react';
import type { Deal, DealAsset } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Props = { deal: Deal; asset: DealAsset | null; dealId: string; supabase: SupabaseClient; onChanged?: () => void };

export default function HypothesesColumn({ deal, asset, dealId, supabase, onChanged }: Props) {
  return (
    <div className="space-y-2">
      <Tile title="Entreprise" editable={false} dealId={dealId} table="deals" supabase={supabase} fields={[
        { k: 'raison_sociale', l: 'Raison sociale', v: deal.raison_sociale || '' },
        { k: 'forme_juridique', l: 'Forme juridique', v: deal.forme_juridique || '' },
        { k: 'siren', l: 'SIREN', v: deal.siren || '', mono: true },
        { k: '', l: 'NAF', v: `${deal.code_naf || ''} ${deal.secteur_label || ''}`, ro: true },
        { k: '', l: 'Dirigeant', v: `${deal.dirigeant_prenom || ''} ${deal.dirigeant_nom || ''}`.trim() || '—', ro: true },
        { k: '', l: 'Nomination', v: deal.jours_depuis_nomination ? `${deal.jours_depuis_nomination}j` : '—', ro: true },
        { k: 'cotation_bdf_activite', l: 'BDF activité', v: deal.cotation_bdf_activite || '' },
        { k: 'cotation_bdf_credit', l: 'BDF crédit', v: deal.cotation_bdf_credit || '' },
        { k: '', l: 'Source BDF', v: deal.cotation_bdf_source?.replace(/_/g, ' ') || '—', ro: true },
        { k: 'indicateur_dirigeant_bdf', l: 'Indic. dirigeant', v: deal.indicateur_dirigeant_bdf || '' },
      ]} />

      <Tile title="Bien à financer" dealId={dealId} table="deal_assets" supabase={supabase} fields={[
        { k: '', l: 'Catégorie', v: asset?.asset_class?.replace(/_/g, ' ') || '—', ro: true },
        { k: 'marque', l: 'Marque', v: asset?.marque || '' },
        { k: 'modele', l: 'Modèle', v: asset?.modele || '' },
        { k: 'annee_fabrication', l: 'Année', v: asset?.annee_fabrication?.toString() || '' },
        { k: '', l: 'État', v: asset?.etat?.replace(/_/g, ' ') || '—', ro: true },
        { k: '', l: 'N° série / VIN', v: asset?.vin || asset?.numero_serie || '—', ro: true, mono: true },
        { k: '', l: 'Km / Heures', v: asset?.kilometrage ? `${asset.kilometrage.toLocaleString('fr-FR')} km` : asset?.heures_moteur ? `${asset.heures_moteur.toLocaleString('fr-FR')} h` : '—', ro: true },
        { k: '', l: 'Prix HT', v: asset?.prix_achat_ht ? `${asset.prix_achat_ht.toLocaleString('fr-FR')} EUR` : '—', ro: true, mono: true },
        { k: '', l: 'GPS', v: asset?.traceur_gps ? 'Oui' : 'Non', ro: true, accent: asset?.traceur_gps },
        { k: '', l: 'Récupérateur', v: asset?.contrat_recuperation ? 'Oui' : 'Non', ro: true, accent: asset?.contrat_recuperation },
        { k: '', l: 'Coeff. récup.', v: asset?.coefficient_recuperabilite ? `${(asset.coefficient_recuperabilite * 100).toFixed(0)}%` : '—', ro: true },
      ]} />

      <Tile title="Financement banque" dealId={dealId} table="deals" supabase={supabase}
        empty={!deal.taux_refinancement_banque && !deal.loyer_mensuel_banque}
        fields={[
          { k: 'taux_refinancement_banque', l: 'Taux refinancement', v: deal.taux_refinancement_banque ? `${deal.taux_refinancement_banque}%` : '' },
          { k: 'loyer_mensuel_banque', l: 'Loyer banque', v: deal.loyer_mensuel_banque ? `${deal.loyer_mensuel_banque.toLocaleString('fr-FR')} EUR/m` : '' },
          { k: 'frais_dossier_banque', l: 'Frais dossier', v: deal.frais_dossier_banque ? `${deal.frais_dossier_banque.toLocaleString('fr-FR')} EUR` : '' },
          { k: 'penalites_remboursement_anticipe', l: 'Pénalités RA', v: deal.penalites_remboursement_anticipe ? `${deal.penalites_remboursement_anticipe.toLocaleString('fr-FR')} EUR` : '' },
        ]} />

      <Tile title="Financement client" dealId={dealId} table="deals" supabase={supabase} fields={[
        { k: '', l: 'Type', v: deal.type_financement?.replace('_', ' ') || '—', ro: true },
        { k: 'montant_finance', l: 'Montant financé', v: deal.montant_finance ? `${deal.montant_finance.toLocaleString('fr-FR')} EUR` : '' },
        { k: 'apport_initial', l: 'Apport initial', v: `${(deal.apport_initial || 0).toLocaleString('fr-FR')} EUR` },
        ...(deal.montant_finance && deal.apport_initial ? [{ k: '', l: 'Apport %', v: `${((deal.apport_initial / deal.montant_finance) * 100).toFixed(0)}%`, ro: true as const }] : []),
        { k: 'depot_garantie', l: 'Dépôt garantie', v: `${(deal.depot_garantie || 0).toLocaleString('fr-FR')} EUR` },
        { k: 'duree_mois', l: 'Durée', v: deal.duree_mois ? `${deal.duree_mois} mois` : '' },
        { k: '', l: 'Loyer client', v: deal.loyer_mensuel_client ? `${deal.loyer_mensuel_client.toLocaleString('fr-FR')} EUR/m` : 'Auto', ro: true },
      ]} />
    </div>
  );
}

type Field = { k: string; l: string; v: string; ro?: boolean; mono?: boolean; accent?: boolean };

function Tile({ title, fields, empty, editable = true, dealId, table, supabase }: {
  title: string; fields: Field[]; empty?: boolean; editable?: boolean;
  dealId: string; table: string; supabase: SupabaseClient;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  function startEdit() {
    const init: Record<string, string> = {};
    fields.forEach(f => { if (f.k && !f.ro) init[f.k] = f.v; });
    setValues(init);
    setEditing(true);
  }

  async function save() {
    const updates: Record<string, string | number | null> = {};
    Object.entries(values).forEach(([k, v]) => {
      const cleaned = v.replace(/[^\d.,-]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      updates[k] = cleaned && !isNaN(num) ? num : (v || null);
    });
    if (Object.keys(updates).length > 0) {
      if (table === 'deals') {
        await supabase.from('deals').update({ ...updates, status: 'draft' }).eq('id', dealId);
      } else {
        await supabase.from(table).update(updates).eq('deal_id', dealId);
        await supabase.from('deals').update({ status: 'draft' }).eq('id', dealId);
      }
    }
    setEditing(false);
  }

  return (
    <div className="tile" style={{ padding: '16px', position: 'relative' }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-medium" style={{ color: '#2d6a4f' }}>{title}</h4>
        {editable && !empty && (
          editing ? (
            <button onClick={save} aria-label="Valider" className="p-0.5 rounded-[4px] transition-colors hover:bg-green-50">
              <Check className="w-[14px] h-[14px]" strokeWidth={2} style={{ color: '#059669' }} />
            </button>
          ) : (
            <button onClick={startEdit} aria-label="Modifier" className="p-0.5 rounded-[4px] transition-colors hover:bg-blue-50">
              <PenLine className="w-[14px] h-[14px]" strokeWidth={1.8} style={{ color: '#2d6a4f' }} />
            </button>
          )
        )}
      </div>

      {empty && !editing ? (
        <div className="flex items-center justify-between">
          <p className="text-[11px] italic" style={{ color: 'var(--text-muted)' }}>Non renseigné</p>
          <button onClick={startEdit} aria-label="Ajouter" className="p-0.5 rounded-[4px] transition-colors hover:bg-blue-50">
            <PenLine className="w-[14px] h-[14px]" strokeWidth={1.8} style={{ color: '#2d6a4f' }} />
          </button>
        </div>
      ) : (
        <div className="space-y-[5px]">
          {fields.map((f, i) => (
            <div key={i} className="flex justify-between items-baseline text-[11px]">
              <span style={{ color: 'var(--text-secondary)' }}>{f.l}</span>
              {editing && f.k && !f.ro ? (
                <input value={values[f.k] ?? f.v}
                  onChange={(e) => setValues(p => ({ ...p, [f.k]: e.target.value }))}
                  className="w-[110px] text-right text-[10px] rounded-[4px] px-1.5 py-0.5 outline-none"
                  style={{ background: 'var(--page-bg)', border: '0.5px solid #E2E8F0', color: 'var(--text-primary)', fontFamily: f.mono ? 'var(--font-geist-mono), monospace' : 'inherit' }}
                />
              ) : (
                <span className={f.mono ? 'font-mono' : ''} style={{
                  fontSize: '10px',
                  color: f.accent ? '#059669' : (f.v && f.v !== '—' && f.v !== 'Non') ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>{f.v || '—'}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
