'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FolderOpen, Plus, BarChart3, Settings } from 'lucide-react';

const NAV = [
  { name: 'Accueil', href: '/dashboard', icon: LayoutGrid },
  { name: 'Dossiers', href: '/deals', icon: FolderOpen },
  { name: 'Nouveau', href: '/deals/new', icon: Plus, accent: true },
  { name: 'Portefeuille', href: '/portfolio', icon: BarChart3 },
  { name: 'Réglages', href: '/settings', icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-[56px]">
        {NAV.map((item) => {
          const active = item.href === '/deals/new'
            ? pathname === '/deals/new'
            : pathname === item.href || pathname.startsWith(item.href + '/');

          if (item.accent) {
            return (
              <Link key={item.name} href={item.href} title={item.name}
                className="w-10 h-10 flex items-center justify-center rounded-full text-white"
                style={{ background: 'var(--accent, #1e40af)' }}>
                <item.icon className="w-5 h-5" strokeWidth={2} />
              </Link>
            );
          }

          return (
            <Link key={item.name} href={item.href} title={item.name}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[52px]">
              <item.icon
                className="w-[20px] h-[20px]"
                strokeWidth={active ? 1.8 : 1.4}
                style={{ color: active ? 'var(--accent, #1e40af)' : '#8A95A3' }}
              />
              <span className="text-[10px] font-medium"
                style={{ color: active ? 'var(--accent, #1e40af)' : '#8A95A3' }}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
