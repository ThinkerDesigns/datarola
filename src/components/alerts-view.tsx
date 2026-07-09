'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDataSources } from '@/lib/use-data-sources';
import { AnomalyDrillDown } from './anomaly-drilldown';

interface Alert {
  id: string;
  metric: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  acknowledged: boolean;
  dsId?: string; // optional source ID for drill-down
}

// Anomaly detection — simple half-split Z-score comparison on numeric columns.
type RowSet = Array<{ columns: string[]; values: unknown[] }>;

function detectAnomalies(rowsByDs: Map<string, RowSet>): Alert[] {
  const alerts: Alert[] = [];

  for (const [dsId, rows] of rowsByDs) {
    if (rows.length < 10) continue; // need at least 10 data points

    // Find first numeric column
    let numIdx = -1;
    for (let ci = 0; ci < rows[0].values.length; ci++) {
      if (typeof rows[0].values[ci] === 'number') { numIdx = ci; break; }
    }
    if (numIdx < 0) continue;

    const mid = Math.floor(rows.length / 2);
    const firstHalf = rows.slice(0, mid);
    const secondHalf = rows.slice(mid);

    // Compare means of consecutive windows for anomaly detection
    const windowSize = Math.min(5, Math.floor(firstHalf.length / 2));
    for (let i = firstHalf.length - windowSize; i < firstHalf.length; i++) {
      const rowIdx = mid + i - (firstHalf.length - windowSize);
      const rRow = rows[rowIdx] as RowSet[number];
      if (!rRow) continue;
      const rVal = Number(rRow.values[numIdx] ?? 0);
      let mVal = 0;
      for (let wi = 0; wi < windowSize; wi++) {
        mVal += Number(firstHalf[wi].values[numIdx] ?? 0);
      }
      mVal /= windowSize;
      const prevMean = mVal || 1;

      // If recent value is >50% below historical mean → critical
      if (prevMean > 0 && rVal < prevMean * 0.5) {
        alerts.push({
          id: `anom_${dsId}_${i}`,
          metric: rRow.columns?.[numIdx] ?? 'Unknown Metric',
          severity: 'critical',
          message: `Dropped to ${formatValue(rVal)} — down ${((1 - rVal / prevMean) * 100).toFixed(0)}% from the average of $${formatValue(prevMean)}.`,
          time: `${rows.length - i} rows ago`,
          acknowledged: false,
          dsId,
        });
      } else if (prevMean > 0 && rVal < prevMean * 0.7) {
        alerts.push({
          id: `anom_${dsId}_${i}`,
          metric: rRow.columns?.[numIdx] ?? 'Unknown Metric',
          severity: 'warning',
          message: `Trending down to $${formatValue(rVal)} — ${((1 - rVal / prevMean) * 100).toFixed(0)}% below the average of $${formatValue(prevMean)}.`,
          time: `${rows.length - i} rows ago`,
          acknowledged: false,
          dsId,
        });
      }
    }
  }

  return alerts;
}

function formatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(2)}k`;
  return v.toFixed(2);
}

const severityConfig = {
  critical: { bg: 'bg-red-500/8', border: 'border-red-500/15' },
  warning: { bg: 'bg-yellow-500/8', border: 'border-yellow-500/15' },
  info: { bg: 'bg-blue-500/8', border: 'border-blue-500/15' },
};

const severityIcon = (severity: string) => {
  if (severity === 'critical') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-400"><path d="M12 9v4m-2.5 2h5M10.3 21a3.36 3.36 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  if (severity === 'warning') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 0 2.5-2H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" /><path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
  );
};

export function AlertsView() {
  const [drillDown, setDrillDown] = useState<{ metric: string; severity: 'critical' | 'warning' | 'info'; dsId: string } | null>(null);
  const { user } = useAuth();
  const sources = useDataSources(user?.uid ?? null);

  // For now, use mock alerts — in production these come from scheduled anomaly scans
  const alerts: Alert[] = [
    ...detectAnomalies(new Map()), // placeholder — real data flows through onSnapshot hooks
    { id: '1', metric: 'Daily Revenue', severity: 'critical', message: 'Revenue dropped 34% vs. same day last week. Most affected: subscription renewals.', time: '2h ago', acknowledged: false },
    { id: '2', metric: 'Sign-up Velocity', severity: 'warning', message: 'New signups 18% below weekday baseline. Pattern holds for 3 consecutive days.', time: '5h ago', acknowledged: false },
    { id: '3', metric: 'Support Ticket Volume', severity: 'info', message: 'Ticket volume up 22% — correlated with v2.4 release. Mostly login issues resolving naturally.', time: '8h ago', acknowledged: true },
    { id: '4', metric: 'API Error Rate', severity: 'warning', message: '5xx errors at 1.2% for 45 min window. Auto-resolved after scaling.', time: '1d ago', acknowledged: true },
  ];

  const unreadCount = alerts.filter((a) => !a.acknowledged).length;

  if (drillDown) {
    return (
      <div className="max-w-4xl">
        <button onClick={() => setDrillDown(null)} className="text-sm text-slate-500 hover:text-white transition-colors mb-4 block">← Back to alerts</button>
        <AnomalyDrillDown
          uid={user?.uid ?? ''}
          dataSourceId={drillDown.dsId || 'ds_placeholder'}
          metricLabel={drillDown.metric}
          severity={drillDown.severity}
          onClose={() => setDrillDown(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Alert History</h1>
          <p className="mt-0.5 text-sm text-slate-400">Anomaly detections and proactive insight flags.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {unreadCount > 0 && (
            <span className="rounded-full border border-white/10 px-2 py-1">Unread: {unreadCount}</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-600">
            No anomalies detected yet. Connect data to start monitoring.
          </div>
        ) : (
          alerts.map((alert) => {
            const sc = severityConfig[alert.severity];
            return (
              <button key={alert.id} onClick={() => alert.dsId && setDrillDown({ metric: alert.metric, severity: alert.severity, dsId: alert.dsId })}
                className={`w-full text-left rounded-xl border ${sc.border} ${sc.bg} px-5 py-4 flex items-start gap-4 hover:border-white/10 transition-colors ${alert.dsId ? 'cursor-pointer' : ''}`}>
                <div className="shrink-0 mt-0.5">{severityIcon(alert.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{alert.metric}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{alert.severity}</span>
                    {alert.acknowledged && <span className="text-[11px] text-slate-500">Acknowledged</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-600">{alert.time}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
