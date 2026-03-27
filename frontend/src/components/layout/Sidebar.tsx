'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FolderOpen, BarChart3, Settings, Plus } from 'lucide-react';

const NAV = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutGrid },
  { name: 'Dossiers', href: '/deals', icon: FolderOpen },
  { name: 'Portefeuille', href: '/portfolio', icon: BarChart3 },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex fixed left-0 top-0 h-screen w-[56px] flex-col items-center z-40 py-3"
      style={{ background: 'var(--tile-bg)', borderRight: '0.5px solid #E2E8F0', boxShadow: 'var(--tile-shadow)' }}>

      {/* Logo */}
      <Link href="/dashboard" className="w-8 h-8 rounded-[8px] flex items-center justify-center mb-4" style={{ background: 'var(--accent)' }}>
        <span className="text-white font-semibold text-[9px]">SF</span>
      </Link>

      {/* Nav icons */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.name} href={item.href} title={item.name}
              className="w-9 h-9 flex items-center justify-center rounded-[8px] transition-all"
              style={{
                background: active ? 'rgba(24,95,165,0.12)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
              }}>
              <item.icon className="w-[18px] h-[18px]" strokeWidth={active ? 1.8 : 1.5} />
            </Link>
          );
        })}
      </nav>

      {/* Add button */}
      <Link href="/deals/new" title="Nouveau dossier"
        className="w-9 h-9 flex items-center justify-center rounded-[8px] text-white mb-1"
        style={{ background: 'var(--accent)' }}>
        <Plus className="w-4 h-4" strokeWidth={2} />
      </Link>
    </aside>
  );
}
