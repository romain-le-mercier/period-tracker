import { Outlet } from 'react-router-dom';
import { Navigation } from './Layout/Navigation';
import { SyncIndicator } from './SyncIndicator';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <SyncIndicator />
      <main className="md:ml-64 pb-20 md:pb-0">
        {/* Mobile-first container with safe areas */}
        <div className="w-full px-4 py-6 md:container md:mx-auto md:p-8 md:max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}