'use client';

import { useState } from 'react';
import { AuthGuard } from '@/app/auth-guard';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { DashboardView } from '@/components/dashboard-view';
import { ConnectionsView } from '@/components/connections-view';
import { AlertsView } from '@/components/alerts-view';
import { SettingsView } from '@/components/settings-view';
import { SavedQueriesView } from '@/components/saved-queries-view';

type View = 'dashboard' | 'connections' | 'alerts' | 'saved-queries' | 'settings';

export function AppShell() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [modelProvider, setModelProvider] = useState<'ollama' | 'anthropic'>('ollama');
  const [restoreQuery, setRestoreQuery] = useState<{ question: string; sql?: string } | null>(null);

  // Pass restored query to dashboard chat when needed
  const handleRestore = (question: string, sql?: string) => {
    setRestoreQuery({ question, sql });
    setActiveView('dashboard');
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#0d1117] text-white">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar modelProvider={modelProvider} onModelToggle={() => setModelProvider((p) => (p === 'ollama' ? 'anthropic' : 'ollama'))} />
          <main className="flex-1 overflow-auto p-6">
            {activeView === 'dashboard' && <DashboardView restoreQuery={restoreQuery} />}
            {activeView === 'connections' && <ConnectionsView />}
            {activeView === 'alerts' && <AlertsView />}
            {activeView === 'saved-queries' && <SavedQueriesView onRestore={handleRestore} />}
            {activeView === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
