// ponytail: Scheduled anomaly detection — runs on cron trigger, scans latest rows for significant deviations.
import { NextRequest, NextResponse } from 'next/server';
import { getDocs, query, collection, orderBy, limit as fbLimit, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const _db = db;

// If the caller is a trusted cron source, skip auth check
function isTrustedCaller(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET ?? '';
  if (cronSecret) return authHeader === `Bearer ${cronSecret}`;
  // No secret configured — allow unauthenticated for local testing only
  return true;
}

// Basic statistics helpers
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const sqDiffs = values.map((v) => (v - m) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

async function detectAnomalies(uid: string, dsId: string): Promise<void> {
  if (!_db) return;

  const rowsCol = collection(_db, 'users', uid, 'dataSources', dsId, 'rows');
  // Fetch the last 50 rows for analysis
  const rowsSnap = await getDocs(query(rowsCol, orderBy('syncedAt', 'desc'), fbLimit(50)));

  if (rowsSnap.size < 3) return; // Need at least 3 data points

  // Collect all numeric columns from the first row's values
  const firstDoc = rowsSnap.docs[rowsSnap.docs.length - 1]; // oldest in this batch
  const firstData = firstDoc.data();
  const values = (firstData?.values as unknown[]) ?? [];
  if (values.length === 0) return;

  // Build column stats: for each index, collect all numeric values
  const colValues: number[][] = new Array(values.length).fill(null).map(() => []);
  rowsSnap.docs.forEach((d) => {
    const vals = d.data().values as unknown[];
    if (!vals) return;
    for (let i = 0; i < Math.min(vals.length, values.length); i++) {
      const n = Number(vals[i]);
      if (!isNaN(n) && isFinite(n)) colValues[i].push(n);
    }
  });

  // Check the latest row against each column's stats
  const latestDoc = rowsSnap.docs[0];
  const latestVals = latestDoc.data().values as unknown[];
  if (!latestVals) return;

  for (let i = 0; i < colValues[i]?.length && i < colValues.length; i++) {
    const m = mean(colValues[i]);
    const sd = stddev(colValues[i]);
    const latestVal = Number(latestVals[i]);

    if (isNaN(latestVal) || sd === 0) continue;

    const zScore = Math.abs(latestVal - m) / sd;
    // Flag deviations > 2 standard deviations
    if (zScore > 2) {
      await addDoc(collection(_db, 'users', uid, 'alerts'), {
        type: 'anomaly' as const,
        sourceId: dsId,
        columnIndex: i,
        value: latestVal,
        mean: Math.round(m * 100) / 100,
        stddev: Math.round(sd * 100) / 100,
        zScore: Math.round(zScore * 100) / 100,
        detectedAt: Date.now(),
        read: false,
      });
    }
  }
}

export async function GET(req: NextRequest) {
  if (!isTrustedCaller(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!_db) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  // Find all connected data sources
  const usersSnap = await getDocs(query(collection(_db, 'users')));
  let totalChecked = 0;
  let withAnomalies = 0;

  for (const userDoc of usersSnap.docs) {
    const dsSnap = await getDocs(query(collection(_db, 'users', userDoc.id, 'dataSources')));
    for (const dsDoc of dsSnap.docs) {
      const dsData = dsDoc.data();
      if (dsData.status !== 'connected') continue;

      try {
        await detectAnomalies(userDoc.id, dsDoc.id);
        totalChecked++;
      } catch { /* skip per-source errors */ }
    }
  }

  // For testing: return what we found
  return NextResponse.json({ totalChecked, message: 'Anomaly detection complete' });
}
