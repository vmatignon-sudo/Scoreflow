'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { LayoutGrid, FolderOpen, BarChart3, Settings, Plus } from 'lucide-react';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutGrid },
  { name: 'Dossiers', href: '/deals', icon: FolderOpen },
  { name: 'Portefeuille', href: '/portfolio', icon: BarChart3 },
  { name: 'Paramètres', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden sm:flex fixed left-0 top-0 h-screen w-[240px] bg-white/90 glass shadow-lg flex-col z-30">
      {/* Logo */}
      <div className="h-[52px] flex items-center px-5">
        <Link href="/dashboard" className="font-semibold text-[#1d1d1f] text-[14px] tracking-tight">
          ScoreFlow
        </Link>
      </div>

      {/* New deal */}
      <div className="px-3 pb-3">
        <Link href="/deals/new"
          className="inline-flex items-center justify-center gap-1.5 w-full bg-[#2563eb] text-white py-[7px] rounded-[10px] text-[12px] font-medium hover:bg-[#1d4ed8] active:scale-[0.98] transition-all">
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          Nouveau dossier
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pt-2">
        <ul className="space-y-px">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-[8px] rounded-[10px] text-[13px] transition-all',
                    isActive
                      ? 'bg-[#2563eb]/[0.08] text-[#2563eb] font-medium'
                      : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#2d2d2d] font-normal'
                  )}
                >
                  <item.icon className={cn("w-[17px] h-[17px]", isActive && "text-[#2563eb]")} strokeWidth={isActive ? 1.8 : 1.5} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="p-3 mx-2 mb-3 rounded-[12px] bg-[#f5f5f7]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
            <span className="text-[#6e6e73] text-[10px] font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#1d1d1f] truncate">Utilisateur</p>
            <p className="text-[10px] text-[#a1a1a6] truncate">Free</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
