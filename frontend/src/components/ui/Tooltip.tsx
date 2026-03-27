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
        <div className={`absolute z-50 w-[280px] rounded-[10px] p-4 animate-fade-in ${
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } left-0`}
          style={{
            background: 'white',
            border: '0.5px solid rgba(0,0,0,0.08)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.06)',
          }}>
          {/* Arrow */}
          <div className={`absolute left-4 w-2.5 h-2.5 rotate-45 ${
            position === 'top' ? '-bottom-1' : '-top-1'
          }`} style={{ background: 'white', border: '0.5px solid rgba(0,0,0,0.08)' }} />

          <p className="text-[11px] leading-[1.5] text-[#1d1d1f] mb-2">{definition}</p>

          {formula && (
            <div className="rounded-[6px] px-2.5 py-1.5 mb-2" style={{ background: '#f5f5f7' }}>
              <p className="text-[9px] text-[#a1a1a6] mb-0.5">Formule</p>
              <p className="text-[10px] text-[#1d1d1f]" style={{ fontVariantNumeric: 'tabular-nums' }}>{formula}</p>
            </div>
          )}

          {source && (
            <p className="text-[9px] text-[#a1a1a6]">{source}</p>
          )}
        </div>
      )}
    </div>
  );
}
