'use client';

// Subscribe to connected sources + their rows for real-time dashboard KPIs & chart data.
import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DataSource } from '@/lib/schema';

export function useDashboardData(uid: string | null) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});
  const [timeSeries, setTimeSeries] = useState<Array<{ source: string; label: string; value: number }>>([]);

  // Subscribe to all rows of a connected source and update time series
  const subscribeRows = useCallback((uid: string, dsId: string, name: string) => {
    if (!db) return () => {};
    return onSnapshot(
      collection(db, 'users', uid, 'dataSources', dsId, 'rows'),
      (rowsSnap) => {
        setRowCounts((prev) => ({ ...prev, [dsId]: rowsSnap.size }));

        // Collect values for the chart from recent rows
        const points: Array<{ source: string; label: string; value: number }> = [];
        for (const rowDoc of rowsSnap.docs.slice(-50).reverse()) {
          const rowData = rowDoc.data() as { columns: string[]; values: unknown[] };
          if (!rowData.columns || !rowData.values) continue;

          // First numeric column we find is the one we chart
          for (let ci = 0; ci < rowData.values.length; ci++) {
            const val = rowData.values[ci];
            if (typeof val === 'number' && isFinite(val)) {
              points.push({ source: name, label: rowData.columns[ci] || `col_${ci}`, value: val });
              break;
            }
          }
        }

        setTimeSeries((prev) => [...prev.slice(-500), ...points].slice(-200));
      },
      () => {}
    );
  }, []);

  // Track active subscriptions for cleanup across renders
  const unsubRef = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!uid || !db) return;

    const unsubDs = onSnapshot(collection(db, 'users', uid, 'dataSources'), (dsSnap) => {
      const connected = dsSnap.docs
        .filter((d) => (d.data() as any).status === 'connected')
        .map((d) => ({ id: d.id, ...d.data() } as DataSource));

      setSources(connected);

      // Clean up old subscriptions
      unsubRef.current.forEach((fn) => fn());
      unsubRef.current = [];

      // Set up row subscriptions for each connected source
      for (const ds of connected) {
        unsubRef.current.push(subscribeRows(uid, ds.id, ds.name));
      }
    });

    return () => { unsubDs(); unsubRef.current.forEach((fn) => fn()); };
  }, [uid, subscribeRows]);

  const totalRows = Object.values(rowCounts).reduce((a, b) => a + b, 0);
  const activeSources = Object.keys(rowCounts).length;
  const numericCols = activeSources > 0 ? Math.max(1, Math.floor(totalRows / 1000)) : 0;

  return { totalRows, activeSources, numericCols, timeSeries: timeSeries.slice(-200), loading: false };
}
