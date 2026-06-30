import Sidebar from '../../../components/layout/Sidebar';
export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-h-screen overflow-y-auto pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
