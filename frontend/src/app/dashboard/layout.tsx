import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <Sidebar />
      <main className="sm:ml-[240px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
