'use client';

// Drill-down into an anomaly: show contributing rows that triggered the alert.

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query as firestoreQuery, orderBy, limit as qLimit } from 'firebase/firestore';
import type { DataSource } from '@/lib/schema';

interface DrillDownProps {
  uid: string;
  dataSourceId: string; // which source has the anomaly
  metricLabel: string; // e.g. "Daily Revenue"
  severity: 'info' | 'warning' | 'critical';
  onClose: () => void;
}

export function AnomalyDrillDown({ uid, dataSourceId, metricLabel, severity, onClose }: DrillDownProps) {
  const [rows, setRows] = useState<Array<{ columns: string[]; values: unknown[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [numericIdx, setNumericIdx] = useState(-1);

  useEffect(() => {
    if (!uid || !db) return;
    const unsub = onSnapshot(
      firestoreQuery(collection(db, 'users', uid, 'dataSources', dataSourceId, 'rows'), orderBy('syncedAt', 'desc'), qLimit(20)),
      (snap) => {
        setRows(snap.docs.map((d) => d.data() as { columns: string[]; values: unknown[] }));
        // Find first numeric column if not already found
        if (numericIdx < 0 && snap.docs.length > 0) {
          const cols = snap.docs[0].data().columns as string[];
          const vals = snap.docs[0].data().values as unknown[];
          for (let ci = 0; ci < vals.length; ci++) {
            if (typeof vals[ci] === 'number') { setNumericIdx(ci); break; }
          }
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [uid, dataSourceId, numericIdx]);

  const severityColor = severity === 'critical' ? 'text-red-400' : severity === 'warning' ? 'text-amber-400' : 'text-blue-400';
  const severityBg = severity === 'critical' ? 'bg-red-500/10' : severity === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10';

  return (
    <div className={`rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-white">Anomaly Details: {metricLabel}</h4>
          <p className={`mt-0.5 text-xs ${severityColor}`}>Severity: {severity}</p>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors text-lg">✕</button>
      </div>

      {/* Summary stats */}
      {numericIdx >= 0 && rows.length > 0 && (
        <div className={`grid grid-cols-2 gap-3 rounded-lg ${severityBg} p-3`}>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Latest Value</p>
            <p className="text-lg font-semibold text-white">{formatValue(rows[rows.length - 1]?.values?.[numericIdx] ?? 0)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Avg (last 7)</p>
            <p className="text-lg font-semibold text-white">
              {formatValue(rows.slice(0, 7).reduce((sum, r) => sum + Number(r.values[numericIdx]), 0) / Math.min(rows.length, 7))}
            </p>
          </div>
        </div>
      )}

      {/* Contributing rows */}
      {loading ? (
        <div className="flex items-center justify-center py-8"><div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>
      ) : (
        <div>
          <p className="text-xs text-slate-500 mb-2">Contributing rows (most recent 20):</p>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-600">No data available for this source yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-white/5">
                    {rows[0]?.columns?.map((c, i) => (
                      <th key={i} className={`py-1.5 pr-4 font-normal whitespace-nowrap ${numericIdx === i ? `font-medium text-brand-400` : ''}`}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...rows].reverse().map((row, ri) => (
                    <tr key={ri} className="border-b border-white/5 hover:bg-white/[0.02]">
                      {row.columns.map((_, ci) => (
                        <td key={ci} className={`py-1.5 pr-4 whitespace-nowrap ${numericIdx === ci ? 'text-brand-300' : 'text-slate-300'}`}>
                          {row.values[ci] != null ? String(row.values[ci]) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatValue(v: unknown): string {
  const n = Number(v);
  if (isNaN(n)) return String(v ?? '—');
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(2)}k`;
  return `$${n.toFixed(2)}`;
}
