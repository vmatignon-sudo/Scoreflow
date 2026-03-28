import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <Sidebar />
      <MobileNav />
      <main className="sm:ml-[56px] min-h-screen pb-[72px] sm:pb-0">
        {children}
      </main>
    </div>
  );
}
