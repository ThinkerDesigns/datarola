// Anomaly detection: analyzes synced data for statistically significant deviations.
// Runs as a scheduled task (e.g., via Firebase Functions cron or a timer trigger).

import { db } from '@/lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, orderBy, limit as firestoreLimit } from 'firebase/firestore';

interface AnomalyAlert {
  metric: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  sourceId: string;
}

// Compute basic statistics for a column's values
function stats(values: (number | null)[]): { mean: number; stddev: number; min: number; max: number } {
  const valid = values.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) return { mean: 0, stddev: 0, min: 0, max: 0 };

  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance = valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length;
  return {
    mean,
    stddev: Math.sqrt(variance),
    min: Math.min(...valid),
    max: Math.max(...valid),
  };
}

// Detect anomalies using Z-score method. Values with |z| > threshold are anomalous.
function zScoreCheck(
  currentValues: (string | number | boolean | null)[],
  baselineMean: number,
  baselineStddev: number,
  threshold: number = 2,
): { anomaly: boolean; zScore: number; deviationPct: number } | null {
  const validValue = currentValues.find((v): v is number => typeof v === 'number' && !isNaN(v));
  if (validValue == null || baselineStddev === 0) return null;

  const zScore = (validValue - baselineMean) / baselineStddev;
  const deviationPct = ((validValue - baselineMean) / baselineMean) * 100;

  if (Math.abs(zScore) > threshold) {
    return { anomaly: true, zScore, deviationPct };
  }
  return null;
}

// Main detection function — scans all synced data sources for anomalies
export async function detectAnomalies(uid: string): Promise<AnomalyAlert[]> {
  if (!db) return [];

  const alerts: AnomalyAlert[] = [];

  // Get all user's data sources
  const sourcesSnap = await getDocs(collection(db, 'users', uid, 'dataSources'));
  const sources = sourcesSnap.docs.filter((d) => d.data()?.status === 'connected');

  for (const source of sources) {
    const sourceData = source.data();
    if (!sourceData?.rowCount || sourceData.rowCount < 10) continue; // Need enough data

    // Fetch synced rows for this source (limit to recent 500 for performance)
    const rowsQuery = query(collection(db, 'users', uid, 'dataSources', source.id, 'rows'), orderBy('syncedAt', 'desc'), firestoreLimit(500));
    const rowsSnap = await getDocs(rowsQuery);

    if (rowsSnap.docs.length === 0) continue;

    // Group rows by first column value (common pattern: date/category grouped data)
    const groupStats = new Map<string, { sum: number; count: number }>();

    for (const doc of rowsSnap.docs) {
      const data = doc.data();
      if (!data?.columns || !data?.values?.[0]) continue;

      // Find numeric columns (skip text-only first column used as group key)
      for (let i = 1; i < data.columns.length && i < data.values[0].length; i++) {
        const val = data.values[0][i];
        if (typeof val === 'number') {
          // Group by first text column
          const groupKey = String(data.values[0][0]);
          const existing = groupStats.get(groupKey) || { sum: 0, count: 0 };
          groupStats.set(groupKey, { sum: existing.sum + val, count: existing.count + 1 });
        }
      }
    }

    // Calculate baseline from historical data (first N rows as historical, rest as current)
    const groups = Array.from(groupStats.entries());
    if (groups.length < 3) continue;

    const mid = Math.floor(groups.length / 2);
    const historical = groups.slice(0, mid);
    const current = groups.slice(mid);

    // Compute baseline stats from first half
    const baselineMean = historical.reduce((a, g) => a + (g[1].sum / g[1].count), 0) / Math.max(historical.length, 1);

    // Check each current group against baseline
    for (const [groupKey, stat] of current) {
      const currentValue = stat.sum / stat.count;
      const deviationPct = ((currentValue - baselineMean) / baselineMean) * 100;

      if (Math.abs(deviationPct) > 25) { // 25% deviation threshold
        alerts.push({
          metric: `${(source.data() as any)?.name ?? source.id} — ${groupKey}`,
          severity: Math.abs(deviationPct) > 40 ? 'critical' : 'warning',
          message: `Value ${deviationPct > 0 ? 'up' : 'down'} ${Math.abs(deviationPct).toFixed(1)}% from baseline. ${currentValue.toFixed(2)} vs expected ~${baselineMean.toFixed(2)}.`,
          sourceId: source.id,
        });
      }
    }
  }

  // Save alerts to Firestore (dedup: only add new ones not seen in last 24h)
  for (const alert of alerts) {
    const key = `${alert.sourceId}:${alert.metric}`;
    await setDoc(doc(db, 'users', uid, 'alerts', key), {
      ...alert,
      createdAt: Date.now(),
      acknowledged: false,
    }, { merge: true });
  }

  return alerts;
}
