'use client';

import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import type { Deal, DealAsset } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Props = { deal: Deal; asset: DealAsset | null; dealId: string; supabase: SupabaseClient };

export default function HypothesesColumn({ deal, asset }: Props) {
  return (
    <div className="space-y-2">
      {/* Tuile 1 — Entreprise */}
      <Tile title="Entreprise">
        <Row label="Raison sociale" value={deal.raison_sociale || '—'} />
        <Row label="Forme juridique" value={deal.forme_juridique || '—'} />
        <Row label="SIREN" value={deal.siren || '—'} mono />
        <Row label="NAF" value={`${deal.code_naf || ''} ${deal.secteur_label || ''}`} />
        <Row label="Dirigeant" value={`${deal.dirigeant_prenom || ''} ${deal.dirigeant_nom || ''}`.trim() || '—'} />
        {deal.dirigeant_date_nomination && (
          <Row label="Nommé depuis" value={deal.jours_depuis_nomination ? `${deal.jours_depuis_nomination}j` : '—'} />
        )}
        <div className="mt-1.5 pt-1.5" style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          <Row label="Cotation BDF" value={deal.cotation_bdf_credit ? `${deal.cotation_bdf_activite || ''}${deal.cotation_bdf_credit}` : '—'} />
          <Row label="Source" value={deal.cotation_bdf_source?.replace(/_/g, ' ') || '—'} />
          <Row label="Indic. dirigeant" value={deal.indicateur_dirigeant_bdf || '—'} />
        </div>
      </Tile>

      {/* Tuile 2 — Bien à financer */}
      <Tile title="Bien à financer">
        <Row label="Catégorie" value={asset?.asset_class?.replace(/_/g, ' ') || '—'} />
        {asset?.asset_subclass && <Row label="Sous-catégorie" value={asset.asset_subclass} />}
        <Row label="Marque" value={asset?.marque || '—'} />
        <Row label="Modèle" value={asset?.modele || '—'} />
        <Row label="Année" value={asset?.annee_fabrication?.toString() || '—'} />
        <Row label="État" value={asset?.etat?.replace(/_/g, ' ') || '—'} />
        {(asset?.numero_serie || asset?.vin) && (
          <Row label="N° série / VIN" value={asset?.vin || asset?.numero_serie || '—'} mono />
        )}
        <Row label="Km / Heures" value={
          asset?.kilometrage ? `${asset.kilometrage.toLocaleString('fr-FR')} km` :
          asset?.heures_moteur ? `${asset.heures_moteur.toLocaleString('fr-FR')} h` : '—'
        } />
        <Row label="Prix HT" value={asset?.prix_achat_ht ? `${asset.prix_achat_ht.toLocaleString('fr-FR')} EUR` : '—'} />
        <div className="mt-1.5 pt-1.5" style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          <Row label="GPS" value={asset?.traceur_gps ? 'Oui' : 'Non'} highlight={asset?.traceur_gps} />
          <Row label="Récupérateur" value={asset?.contrat_recuperation ? 'Oui' : 'Non'} highlight={asset?.contrat_recuperation} />
          <Row label="Coeff. récup." value={asset?.coefficient_recuperabilite ? `${(asset.coefficient_recuperabilite * 100).toFixed(0)}%` : '—'} />
        </div>
      </Tile>

      {/* Tuile 3 — Financement banque */}
      <Tile title="Financement banque" empty={!deal.taux_refinancement_banque && !deal.loyer_mensuel_banque}>
        <Row label="Taux refinancement" value={deal.taux_refinancement_banque ? `${deal.taux_refinancement_banque}%` : '—'} />
        <Row label="Loyer banque" value={deal.loyer_mensuel_banque ? `${deal.loyer_mensuel_banque.toLocaleString('fr-FR')} EUR/m` : '—'} />
        <Row label="Frais dossier" value={deal.frais_dossier_banque ? `${deal.frais_dossier_banque.toLocaleString('fr-FR')} EUR` : '—'} />
        <Row label="Pénalités RA" value={deal.penalites_remboursement_anticipe ? `${deal.penalites_remboursement_anticipe.toLocaleString('fr-FR')} EUR` : '—'} />
      </Tile>

      {/* Tuile 4 — Financement client */}
      <Tile title="Financement client">
        <Row label="Type" value={deal.type_financement?.replace('_', ' ') || '—'} />
        <Row label="Montant financé" value={deal.montant_finance ? `${deal.montant_finance.toLocaleString('fr-FR')} EUR` : '—'} />
        <Row label="Apport initial" value={deal.apport_initial ? `${deal.apport_initial.toLocaleString('fr-FR')} EUR` : '0 EUR'} />
        {deal.montant_finance && deal.apport_initial ? (
          <Row label="Apport %" value={`${((deal.apport_initial / deal.montant_finance) * 100).toFixed(0)}%`} />
        ) : null}
        <Row label="Dépôt garantie" value={deal.depot_garantie ? `${deal.depot_garantie.toLocaleString('fr-FR')} EUR` : '0 EUR'} />
        <Row label="Durée" value={deal.duree_mois ? `${deal.duree_mois} mois` : '—'} />
        <Row label="Loyer client" value={deal.loyer_mensuel_client ? `${deal.loyer_mensuel_client.toLocaleString('fr-FR')} EUR/m` : 'Auto'} />
      </Tile>
    </div>
  );
}

function Tile({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-[8px]" style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', padding: '12px 14px' }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{title}</h4>
        <button onClick={() => setEditing(!editing)}
          className="p-1 rounded-[4px] transition-all"
          style={{ color: editing ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }}>
          {editing ? <Check className="w-3 h-3" strokeWidth={2} /> : <Pencil className="w-3 h-3" strokeWidth={1.8} />}
        </button>
      </div>
      {empty && !editing ? (
        <p className="text-[11px] italic" style={{ color: 'var(--color-text-tertiary)' }}>Non renseigné</p>
      ) : (
        <div className="space-y-1">{children}</div>
      )}
    </div>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-baseline text-[11px]">
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className={mono ? 'font-mono' : ''} style={{
        color: highlight ? 'var(--success)' : (value === '—' || value === 'Non') ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
        fontSize: '10px',
      }}>{value}</span>
    </div>
  );
}
