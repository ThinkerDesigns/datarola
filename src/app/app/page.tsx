'use client';

import { useState } from 'react';
import AuthProviderPage from '@/app/auth-provider-page';
import { AuthGuard } from '@/app/auth-guard';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { DashboardView } from '@/components/dashboard-view';
import { ConnectionsView } from '@/components/connections-view';
import { AlertsView } from '@/components/alerts-view';
import { SettingsView } from '@/components/settings-view';

type View = 'dashboard' | 'connections' | 'alerts' | 'settings';

export default function AppPage() {
  return (
    <AuthProviderPage>
      <AppShell />
    </AuthProviderPage>
  );
}

function AppShell() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [modelProvider, setModelProvider] = useState<'ollama' | 'anthropic'>('ollama');

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#0d1117] text-white">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar modelProvider={modelProvider} onModelToggle={() => setModelProvider((p) => (p === 'ollama' ? 'anthropic' : 'ollama'))} />
          <main className="flex-1 overflow-auto p-6">
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'connections' && <ConnectionsView />}
            {activeView === 'alerts' && <AlertsView />}
            {activeView === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

// ponytail: static generation can't resolve Firebase at build time — force runtime render
export const dynamic = 'force-dynamic';
