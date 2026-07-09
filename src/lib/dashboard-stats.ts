'use server';

// Aggregate row data from user's connected sources for dashboard KPIs & charts.
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit as qLimit } from 'firebase/firestore';
import type { DataSource } from '@/lib/schema';

export interface DashboardStats {
  totalRows: number;
  sourcesConnected: number;
  sourceNames: Array<{ name: string; rows: number; columns: string[] }>;
  /** numericColumnIndex: which column index is numeric (first one found) */
  numericColumn: { index: number; label: string } | null;
  /** timeSeries data — last N synced rows' values for the first numeric column */
  timeSeries: Array<{ label: string; value: number }>;
}

export async function getDashboardStats(uid: string): Promise<DashboardStats> {
  if (!db) return emptyStats();

  const dsSnap = await getDocs(collection(db, 'users', uid, 'dataSources'));
  const connected = dsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as DataSource))
    .filter((s) => s.status === 'connected');

  let totalRows = 0;
  const sourceNames: Array<{ name: string; rows: number; columns: string[] }> = [];
  let numericColumn: { index: number; label: string } | null = null;
  const allTimeSeries: Array<{ label: string; value: number }> = [];

  for (const ds of connected.slice(0, 3)) {
    const rowsSnap = await getDocs(
      query(collection(db, 'users', uid, 'dataSources', ds.id, 'rows'),
           orderBy('syncedAt', 'asc'), qLimit(200))
    );
    const docCount = rowsSnap.docs.length;
    totalRows += docCount;

    let cols: string[] = [];
    for (const d of rowsSnap.docs) {
      const data = d.data();
      if (data.columns && data.values) {
        cols = data.columns as string[];
        // Find first numeric column
        if (!numericColumn) {
          for (let ci = 0; ci < (data.values as unknown[]).length; ci++) {
            const v = (data.values as unknown[])[ci];
            if (typeof v === 'number' && !isNaN(v)) {
              numericColumn = { index: ci, label: cols[ci] || `col_${ci}` };
              break;
            }
          }
        }
        // Collect time series values
        if (numericColumn) {
          const idx = cols.indexOf(numericColumn.label);
          if (idx >= 0 && typeof (data.values as unknown[])[idx] === 'number') {
            allTimeSeries.push({
              label: ds.name,
              value: Number((data.values as unknown[])[idx]),
            });
          }
        }
      }
    }

    sourceNames.push({ name: ds.name, rows: docCount, columns: cols });
  }

  return { totalRows, sourcesConnected: connected.length, sourceNames, numericColumn, timeSeries: allTimeSeries };
}

function emptyStats(): DashboardStats {
  return { totalRows: 0, sourcesConnected: 0, sourceNames: [], numericColumn: null, timeSeries: [] };
}
