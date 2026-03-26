import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar />
      <main className="sm:ml-[260px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
