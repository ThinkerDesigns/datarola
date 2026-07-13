'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { useDataSources } from '@/lib/use-data-sources';
import { useDashboardData } from '@/lib/use-dashboard-data';
import { KpiCard } from './kpi-card';
import { AnomalyCard } from './anomaly-card';
import { ChatInput } from './chat-input';

interface DashboardViewProps {
  restoreQuery?: { question: string; sql?: string } | null;
}

export function DashboardView({ restoreQuery }: DashboardViewProps) {
  const { user } = useAuth();
  const sources = useDataSources(user?.uid ?? null);
  const connected = sources.filter((s) => s.status === 'connected');
  const stats = useDashboardData(user?.uid ?? null);

  // Format time series for Recharts: index → value
  const chartData = useMemo(
    () => stats.timeSeries.map((pt, i) => ({ id: String(i), value: pt.value })),
    [stats.timeSeries]
  );

  const hasNumericData = connected.length > 0 && chartData.length > 0;
  const syncing = sources.filter((s) => s.status === 'syncing');
  const errors = sources.filter((s) => s.status === 'error');

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          {connected.length > 0 ? (
            <>
              Connected to{' '}
              {connected.map((s, i) => (
                <span key={s.id} className="text-brand-400">
                  {i > 0 ? ', ' : ''}{s.name}
                </span>
              ))}
            </>
          ) : (
            <span className="text-slate-500">No data sources connected. Add one in Connections.</span>
          )}
        </p>
      </div>

      {/* Connection health */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/8 px-4 py-3 text-xs text-red-300">
          {errors.map((s) => s.name).join(', ')} — connection failed. Reconnect in Data Sources.
        </div>
      )}
      {syncing.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-500/20 bg-brand-500/8 px-4 py-3 text-xs text-brand-300">
          <span className="h-2 w-2 animate-spin rounded-full border-[1.5px] border-b-transparent border-t-brand-300" />
          Syncing {syncing.length} source{syncing.length > 1 ? 's' : ''}…
        </div>
      )}

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total Rows" value={formatNumber(stats.totalRows)} change={`${stats.activeSources} source${stats.activeSources !== 1 ? 's' : ''}`} up />
        <KpiCard label="Active Sources" value={String(stats.activeSources)} change={`${connected.map((s) => s.name).join(', ') || '—'}`} up />
        <KpiCard label="Numeric Columns" value={stats.numericCols > 0 ? String(stats.numericCols) : '—'} change={stats.numericCols > 0 ? 'From your data' : 'Connect a source'} up={stats.numericCols > 0} />
      </div>

      {/* Chart + anomalies */}
      <div className="grid gap-6 lg:grid-cols-3">
        {hasNumericData ? (
          <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h3 className="text-sm font-medium text-slate-300">Values Over Time</h3>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                  <XAxis dataKey="id" tick={{ fontSize: 11, fill: '#94a3b8' }} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={formatValue} />
                  <Tooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #ffffff10', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(value, name) => [formatValue(Number(value)), name]} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#chartGradient)" strokeWidth={2}
                    activeDot={{ r: 4, stroke: '#3b82f6', fill: '#0d1117' }} />
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-5 flex items-center justify-center">
            {connected.length > 0 ? (
              <p className="text-sm text-slate-600">No numeric columns found in your connected data.</p>
            ) : (
              <p className="text-sm text-slate-600">Connect a data source to see your metrics and charts.</p>
            )}
          </div>
        )}

        {/* Anomaly alerts */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Recent Anomalies</h3>
          {stats.totalRows > 10 ? (
            <p className="text-xs text-slate-600">Anomaly detection will appear once you have enough data points.</p>
          ) : (
            <p className="text-xs text-slate-700">Connect a data source to start detecting anomalies.</p>
          )}
        </div>
      </div>

      {/* Chat */}
      <ChatInput restoreQuery={restoreQuery} />
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(v >= 100 ? 0 : 1)}k`;
  return v.toFixed(1);
}
