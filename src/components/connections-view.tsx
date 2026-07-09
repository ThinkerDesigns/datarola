'use client';

type ConnectionStatus = 'connected' | 'error' | 'syncing';

interface Connection {
  name: string;
  type: string;
  status: ConnectionStatus;
  lastSync: string;
  rows: string;
}

const connections: Connection[] = [
  { name: 'Q2 Revenue (Google Sheets)', type: 'Google Sheets', status: 'connected', lastSync: '2 min ago', rows: '~12,400' },
  { name: 'User Analytics (BigQuery)', type: 'BigQuery', status: 'connected', lastSync: '15 min ago', rows: '~1.2M' },
  { name: 'Inventory Snapshot (CSV)', type: 'CSV Upload', status: 'syncing', lastSync: '—', rows: '~3,800' },
  { name: 'Support Tickets (Airtable)', type: 'Airtable', status: 'error', lastSync: '2 days ago', rows: '~8,100' },
];

const statusColors = {
  connected: { dot: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  syncing: { dot: 'bg-brand-500', text: 'text-brand-400', bg: 'bg-brand-500/10' },
  error: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
};

export function ConnectionsView() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Data Sources</h1>
          <p className="mt-0.5 text-sm text-slate-400">Manage your connected spreadsheets, databases, and warehouses.</p>
        </div>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
          + Connect Source
        </button>
      </div>

      {/* Connection cards */}
      <div className="space-y-3">
        {connections.map((conn) => {
          const sc = statusColors[conn.status];
          return (
            <div key={conn.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 hover:border-white/10">
              <div className="flex items-center gap-4">
                {/* Type icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${sc.bg}`}>
                  <span className="text-sm font-bold text-white">{conn.type[0]}</span>
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
                <button className="text-xs text-slate-500 hover:text-white transition-colors">Disconnect</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available connectors */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-slate-400">Available Connectors</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {['Redshift', 'Snowflake', 'PostgreSQL', 'MySQL', 'HubSpot', 'Salesforce'].map((name) => (
            <button key={name} className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm font-medium text-slate-500 transition-all hover:border-slate-500 hover:text-slate-300">
              + {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
