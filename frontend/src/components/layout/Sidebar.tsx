'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutGrid, FolderOpen, BarChart3, Settings, Plus, ChevronRight } from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutGrid },
  { name: 'Dossiers', href: '/deals', icon: FolderOpen },
  { name: 'Portefeuille', href: '/portfolio', icon: BarChart3 },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {expanded && (
        <div className="fixed inset-0 bg-black/20 z-30 sm:hidden" onClick={() => setExpanded(false)} />
      )}

      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          'hidden sm:flex fixed left-0 top-0 h-screen bg-white shadow-lg flex-col z-40 transition-all duration-200 ease-out',
          expanded ? 'w-[220px]' : 'w-[64px]'
        )}
      >
        {/* Logo */}
        <div className="h-[52px] flex items-center px-[18px] overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-[#1e40af] rounded-[8px] flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-[10px]">SF</span>
            </div>
            <span className={cn(
              'font-semibold text-[#1d1d1f] text-[14px] tracking-tight whitespace-nowrap transition-opacity duration-200',
              expanded ? 'opacity-100' : 'opacity-0'
            )}>
              ScoreFlow
            </span>
          </Link>
        </div>

        {/* New deal */}
        <div className="px-2 pb-2">
          <Link href="/deals/new"
            className={cn(
              'inline-flex items-center justify-center gap-1.5 w-full bg-[#1e40af] text-white rounded-[10px] text-[12px] font-medium hover:bg-[#1e3a8a] active:scale-[0.98] transition-all overflow-hidden',
              expanded ? 'py-[7px] px-3' : 'py-[7px] px-0'
            )}>
            <Plus className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span className={cn(
              'whitespace-nowrap transition-opacity duration-200',
              expanded ? 'opacity-100' : 'opacity-0 w-0'
            )}>
              Nouveau
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-1">
          <ul className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <Link href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-[14px] py-[9px] rounded-[10px] text-[13px] transition-all overflow-hidden',
                      isActive
                        ? 'bg-[#1e40af]/[0.08] text-[#1e40af] font-medium'
                        : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#2d2d2d] font-normal'
                    )}>
                    <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-[#1e40af]')} strokeWidth={isActive ? 1.8 : 1.5} />
                    <span className={cn(
                      'whitespace-nowrap transition-opacity duration-200',
                      expanded ? 'opacity-100' : 'opacity-0'
                    )}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Expand hint */}
        {!expanded && (
          <div className="px-2 pb-4 flex justify-center">
            <ChevronRight className="w-3.5 h-3.5 text-[#a1a1a6]" strokeWidth={1.5} />
          </div>
        )}

        {/* User — only when expanded */}
        {expanded && (
          <div className="p-2.5 mx-2 mb-3 rounded-[10px] bg-[#f5f5f7] transition-opacity duration-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                <span className="text-[#6e6e73] text-[10px] font-medium">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-[#1d1d1f] truncate">Utilisateur</p>
                <p className="text-[10px] text-[#a1a1a6]">Free</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
