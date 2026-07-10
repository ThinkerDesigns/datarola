'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDataSources } from '@/lib/use-data-sources';
import { ConnectSourceModal } from '@/components/connect-source-modal';
import { disconnectDataSource } from '@/lib/connectors/server-actions';
import type { DataSource, ConnectorType } from '@/lib/schema';

type ConnectionStatus = 'connected' | 'error' | 'syncing';

interface Connection {
  name: string;
  type: string;
  status: ConnectionStatus;
  lastSync: string;
  rows: string;
}

const statusColors = {
  connected: { dot: 'bg-emerald-500', text: 'text-emerald-400' },
  syncing: { dot: 'bg-brand-500', text: 'text-brand-400' },
  error: { dot: 'bg-red-500', text: 'text-red-400' },
};

const dsIconMap: Record<string, string> = {
  'google-sheets': 'GS',
  'csv-upload': 'CSV',
  'bigquery': 'BQ',
  'snowflake': 'SF',
  'postgresql': 'PG',
  'mysql': 'My',
  'redshift': 'RS',
  'airtable': 'AT',
};

export function ConnectionsView() {
  const [showModal, setShowModal] = useState(false);
  const [oauthSheetId, setOauthSheetId] = useState<string | null>(null);
  const [oauthName, setOauthName] = useState<string | null>(null);
  const [disconnectedIdx, setDisconnectedIdx] = useState<number | null>(null);
  const { user } = useAuth();
  const dataSources = useDataSources(user?.uid ?? null);

  // Detect OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === 'success') {
      setOauthSheetId(params.get('spreadsheetId'));
      setOauthName(params.get('name'));
      window.history.replaceState({}, '', '/connections');
    }
  }, []);

  // Sync disconnected banner auto-dismiss
  useEffect(() => {
    if (disconnectedIdx !== null) {
      const t = setTimeout(() => setDisconnectedIdx(null), 3000);
      return () => clearTimeout(t);
    }
  }, [disconnectedIdx]);

  const allConnections: Connection[] = dataSources.map((ds, i) => ({
    name: ds.name,
    type: ds.type,
    status: ds.status as ConnectionStatus,
    lastSync: 'just now',
    rows: ds.rowCount ? `~${ds.rowCount.toLocaleString()}` : '~0',
  }));

  const allAvailable: ConnectorType[] = ['airtable', 'bigquery', 'snowflake', 'postgresql', 'mysql', 'redshift'];

  const handleDisconnect = async (dsId: string, name: string) => {
    if (!user) return;
    try {
      await disconnectDataSource(user.uid, dsId);
      setDisconnectedIdx(dataSources.findIndex((d) => d.id === dsId));
    } catch (e) {
      console.error('Disconnect failed:', e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Data Sources</h1>
          <p className="mt-0.5 text-sm text-slate-400">Manage your connected spreadsheets, databases, and warehouses.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">
          + Connect Source
        </button>
      </div>

      {/* OAuth success banner */}
      {oauthSheetId && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-400 shrink-0"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p className="text-sm text-emerald-300">
              Connected to {oauthName ? `"${oauthName}"` : 'Google Sheet'} — sync will start shortly.
            </p>
          </div>
          <button onClick={() => setOauthSheetId(null)} className="text-xs text-emerald-400/60 hover:text-emerald-300">Dismiss</button>
        </div>
      )}

      {/* Disconnect success banner */}
      {disconnectedIdx !== null && (
        <div className="rounded-xl border border-slate-700 bg-white/[0.02] px-5 py-4 flex items-center justify-between">
          <p className="text-sm text-slate-300">Source disconnected.</p>
          <button onClick={() => setDisconnectedIdx(null)} className="text-xs text-slate-500 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Connected sources */}
      {allConnections.length > 0 ? (
        <div className="space-y-3">
          {allConnections.map((conn, i) => {
            const sc = statusColors[conn.status];
            return (
              <div key={i} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${conn.status === 'connected' ? 'bg-brand-600/20' : conn.status === 'error' ? 'bg-red-500/20' : 'bg-brand-600/20'}`}>
                    <span className="text-xs font-bold text-white">{dsIconMap[conn.type] || conn.type.slice(0, 3).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{conn.name}</p>
                    <p className="text-xs text-slate-500">{conn.type} &middot; {conn.rows} rows</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`flex items-center gap-1.5 text-xs ${sc.text}`}>
                    <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                    {conn.status}
                  </span>
                  <span className="text-xs text-slate-500">Synced {conn.lastSync}</span>
                  <button onClick={() => handleDisconnect(dataSources[i]?.id ?? '', conn.name)}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-600">
          Click "+ Connect Source" to add your first data source.
        </div>
      )}

      {/* Available connectors */}
      {allAvailable.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-slate-400">Available Connectors</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allAvailable.map((name) => (
              <button key={name} onClick={() => setShowModal(true)}
                className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-500 transition-all hover:border-slate-500 hover:text-slate-300">
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Connect source modal */}
      {showModal && (
        <ConnectSourceModal onClose={() => setShowModal(false)} onConnected={() => setShowModal(false)} />
      )}
    </div>
  );
}
