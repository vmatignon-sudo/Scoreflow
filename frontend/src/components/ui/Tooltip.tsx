'use client';

import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

type Props = {
  definition: string;
  formula?: string;
  source?: string;
  children: React.ReactNode;
};

export default function Tooltip({ definition, formula, source, children }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition(rect.top < 200 ? 'bottom' : 'top');
    }
  }, [open]);

  return (
    <div className="relative inline-flex items-center gap-1" ref={triggerRef}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      <Info className="w-3 h-3 text-[#a1a1a6] hover:text-[#6e6e73] cursor-help shrink-0 transition-colors" strokeWidth={1.8} />

      {open && (
        <div className={`absolute z-50 w-[280px] bg-[#1d1d1f] text-white rounded-[14px] p-4 shadow-xl animate-fade-in ${
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } left-1/2 -translate-x-1/2`}>
          {/* Arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#1d1d1f] rotate-45 ${
            position === 'top' ? '-bottom-1' : '-top-1'
          }`} />

          <p className="text-[12px] leading-[1.5] text-white/90 mb-2">{definition}</p>

          {formula && (
            <div className="bg-white/10 rounded-[8px] px-2.5 py-1.5 mb-2">
              <p className="text-[10px] text-white/50 mb-0.5">Formule</p>
              <p className="text-[11px] font-mono text-white/80">{formula}</p>
            </div>
          )}

          {source && (
            <p className="text-[10px] text-white/40">{source}</p>
          )}
        </div>
      )}
    </div>
  );
}
