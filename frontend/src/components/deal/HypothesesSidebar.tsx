'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown } from 'lucide-react';
import type { Deal, DealAsset } from '@/types/database';

type Props = { deal: Deal; asset: DealAsset | null; dealId: string };

type Section = 'deal' | 'asset' | 'qualitative' | 'docs';

type DocRow = { id: string; filename: string; type: string; parse_status: string };

export default function HypothesesSidebar({ deal, asset, dealId }: Props) {
  const [open, setOpen] = useState<Record<Section, boolean>>({
    deal: true, asset: true, qualitative: false, docs: false,
  });
  const [docs, setDocs] = useState<DocRow[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('deal_documents').select('id, filename, type, parse_status')
      .eq('deal_id', dealId).order('uploaded_at', { ascending: false })
      .then(({ data }: { data: DocRow[] | null }) => { if (data) setDocs(data); });
  }, [dealId, supabase]);

  const toggle = (s: Section) => setOpen((p) => ({ ...p, [s]: !p[s] }));

  return (
    <div className="hidden lg:block w-[280px] shrink-0 border-r border-black/[0.04] bg-white/50 overflow-y-auto h-screen sticky top-0">
      <div className="p-5">
        <p className="text-[10px] font-semibold text-[#a1a1a6] uppercase tracking-widest mb-4">Hypothèses</p>

        {/* Deal params */}
        <CollapsibleSection title="Paramètres du deal" open={open.deal} onToggle={() => toggle('deal')}>
          <Row label="Montant" value={fmtEur(deal.montant_finance)} />
          <Row label="Durée" value={deal.duree_mois ? `${deal.duree_mois} mois` : '—'} />
          <Row label="Apport" value={fmtEur(deal.apport_initial)} />
          <Row label="Dépôt garantie" value={fmtEur(deal.depot_garantie)} />
          <Row label="Loyer client" value={deal.loyer_mensuel_client ? `${fmtEur(deal.loyer_mensuel_client)}/m` : '—'} />
          <Row label="Type" value={deal.type_financement?.replace('_', ' ') || '—'} />
        </CollapsibleSection>

        {/* Asset */}
        <CollapsibleSection title="Bien financé" open={open.asset} onToggle={() => toggle('asset')}>
          <Row label="Catégorie" value={asset?.asset_class?.replace(/_/g, ' ') || '—'} />
          <Row label="Marque" value={asset?.marque || '—'} />
          <Row label="Modèle" value={asset?.modele || '—'} />
          <Row label="État" value={asset?.etat?.replace(/_/g, ' ') || '—'} />
          <Row label="Prix HT" value={asset?.prix_achat_ht ? fmtEur(asset.prix_achat_ht) : '—'} />
          <Row label="GPS" value={asset?.traceur_gps ? 'Oui' : 'Non'} />
          <Row label="Récupérateur" value={asset?.contrat_recuperation ? 'Oui' : 'Non'} />
        </CollapsibleSection>

        {/* Qualitative */}
        <CollapsibleSection title="Évaluation qualitative" open={open.qualitative} onToggle={() => toggle('qualitative')}>
          <Row label="Cotation BDF" value={deal.cotation_bdf_credit ? `${deal.cotation_bdf_activite || ''}${deal.cotation_bdf_credit}` : '—'} />
          <Row label="Source BDF" value={deal.cotation_bdf_source?.replace(/_/g, ' ') || '—'} />
          <Row label="Indicateur dirigeant" value={deal.indicateur_dirigeant_bdf || '—'} />
          <Row label="Dirigeant" value={`${deal.dirigeant_prenom || ''} ${deal.dirigeant_nom || ''}`.trim() || '—'} />
          <Row label="Nommé depuis" value={deal.jours_depuis_nomination ? `${deal.jours_depuis_nomination}j` : '—'} />
        </CollapsibleSection>

        {/* Documents */}
        <CollapsibleSection title={`Documents (${docs.length})`} open={open.docs} onToggle={() => toggle('docs')}>
          {docs.length === 0 ? (
            <p className="text-[11px] text-[#a1a1a6]">Aucun document</p>
          ) : (
            docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-1">
                <span className="text-[11px] text-[#424245] truncate max-w-[160px]">{doc.filename}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  doc.parse_status === 'done' ? 'bg-[#2d9d3f]/10 text-[#2d9d3f]' :
                  doc.parse_status === 'error' ? 'bg-[#c4342d]/10 text-[#c4342d]' :
                  'bg-[#f5f5f7] text-[#a1a1a6]'
                }`}>
                  {doc.parse_status === 'done' ? 'OK' : doc.parse_status === 'error' ? 'Err' : '...'}
                </span>
              </div>
            ))
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <button onClick={onToggle} className="flex items-center justify-between w-full py-2 text-[12px] font-semibold text-[#2d2d2d]">
        {title}
        <ChevronDown className={`w-3.5 h-3.5 text-[#a1a1a6] transition-transform duration-200 ${open ? '' : '-rotate-90'}`} strokeWidth={1.8} />
      </button>
      {open && <div className="space-y-1.5 pb-2">{children}</div>}
    </div>
  );
}

function fmtEur(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} EUR`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-[#86868b]">{label}</span>
      <span className="font-mono text-[#424245] text-[10px]">{value}</span>
    </div>
  );
}
