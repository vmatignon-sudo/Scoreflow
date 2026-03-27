import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <Sidebar />
      <main className="sm:ml-[56px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
