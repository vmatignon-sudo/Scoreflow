import Sidebar from '@/components/layout/Sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <Sidebar />
      <main className="ml-[56px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
