'use client';

import { useCallback, useState } from 'react';
import type { DealDraft } from '@/app/deals/new/page';

type Props = {
  draft: DealDraft;
  updateDraft: (updates: Partial<DealDraft>) => void;
  onNext: () => void;
  onBack: () => void;
};

type UploadedDoc = {
  file: File;
  type: 'liasse_fiscale' | 'releve_bancaire' | 'devis_fournisseur' | 'autre';
  status: 'pending' | 'processing' | 'done' | 'error';
};

export default function StepDocuments({ draft, updateDraft, onNext, onBack }: Props) {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [inpiAvailable, setInpiAvailable] = useState<boolean | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      const newDocs: UploadedDoc[] = files.map((file) => ({
        file,
        type: detectDocType(file.name),
        status: 'pending' as const,
      }));
      setUploadedDocs((prev) => [...prev, ...newDocs]);
      updateDraft({ documents: [...draft.documents, ...files] });
    },
    [draft.documents, updateDraft]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const newDocs: UploadedDoc[] = files.map((file) => ({
        file,
        type: detectDocType(file.name),
        status: 'pending' as const,
      }));
      setUploadedDocs((prev) => [...prev, ...newDocs]);
      updateDraft({ documents: [...draft.documents, ...files] });
    },
    [draft.documents, updateDraft]
  );

  function removeDoc(index: number) {
    setUploadedDocs((prev) => prev.filter((_, i) => i !== index));
    updateDraft({
      documents: draft.documents.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="space-y-6">
      {/* INPI check */}
      {draft.siren && (
        <div className="bg-white rounded-[20px] shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#1d1d1f]">Liasses fiscales INPI</h3>
              <p className="text-sm text-[#6e6e73] mt-1">
                Vérification des liasses disponibles pour {draft.siren}
              </p>
            </div>
            {inpiAvailable === null ? (
              <button
                onClick={() => {
                  // TODO: Check INPI API
                  setInpiAvailable(false); // Simulated
                }}
                className="px-4 py-2 bg-[#f5f5f7] text-[#1d1d1f] rounded-lg text-sm font-medium hover:bg-[#ededf0] transition-colors"
              >
                Vérifier INPI
              </button>
            ) : inpiAvailable ? (
              <span className="text-sm text-[#059669] font-medium bg-green-50 px-3 py-1 rounded-full">
                Liasses disponibles
              </span>
            ) : (
              <span className="text-sm text-[#a1a1a6] bg-[#f5f5f7] px-3 py-1 rounded-full">
                Non disponible — upload manuel
              </span>
            )}
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        className="bg-white rounded-xl border-2 border-dashed border-black/[0.04] p-12 text-center hover:border-[#1d1d1f] transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.xml,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          className="hidden"
        />
        <svg className="w-12 h-12 text-[#a1a1a6] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-[#1d1d1f] font-medium text-lg">
          Déposez vos documents ici
        </p>
        <p className="text-sm text-[#a1a1a6] mt-2">
          Liasses fiscales (PDF/XML) - Relevés bancaires (PDF)
        </p>
        <p className="text-xs text-[#a1a1a6] mt-1">
          Détection automatique du type de document
        </p>
      </div>

      {/* Uploaded documents list */}
      {uploadedDocs.length > 0 && (
        <div className="bg-white rounded-[20px] shadow p-6">
          <h3 className="font-semibold text-[#1d1d1f] mb-4">
            Documents ({uploadedDocs.length})
          </h3>
          <div className="space-y-3">
            {uploadedDocs.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg border border-black/[0.04] flex items-center justify-center">
                    <span className="text-xs font-mono text-[#6e6e73]">
                      {doc.file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1d1d1f]">{doc.file.name}</p>
                    <p className="text-xs text-[#a1a1a6]">
                      {DOC_TYPE_LABELS[doc.type]} - {formatFileSize(doc.file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => removeDoc(i)}
                    className="text-[#a1a1a6] hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          className="flex-1 bg-[#1d1d1f] text-white py-3 rounded-lg font-medium hover:bg-[#000] transition-colors"
        >
          {uploadedDocs.length > 0 ? 'Continuer' : 'Passer cette étape'}
        </button>
      </div>
    </div>
  );
}

const DOC_TYPE_LABELS: Record<string, string> = {
  liasse_fiscale: 'Liasse fiscale',
  releve_bancaire: 'Relevé bancaire',
  devis_fournisseur: 'Devis fournisseur',
  autre: 'Document',
};

function detectDocType(filename: string): UploadedDoc['type'] {
  const lower = filename.toLowerCase();
  if (lower.includes('liasse') || lower.includes('fiscal') || lower.includes('cerfa') || lower.endsWith('.xml')) {
    return 'liasse_fiscale';
  }
  if (lower.includes('relev') || lower.includes('banc') || lower.includes('bank')) {
    return 'releve_bancaire';
  }
  if (lower.includes('devis') || lower.includes('factur') || lower.includes('proforma')) {
    return 'devis_fournisseur';
  }
  return 'autre';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-[#f5f5f7] text-[#a1a1a6]',
    processing: 'bg-blue-50 text-blue-600',
    done: 'bg-green-50 text-green-600',
    error: 'bg-red-50 text-red-600',
  };
  const labels = {
    pending: 'En attente',
    processing: 'Analyse...',
    done: 'Analysé',
    error: 'Erreur',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}
