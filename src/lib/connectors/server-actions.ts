'use server';

// ponytail: server actions for connector sync — called from the UI to trigger data pulls.
import { db } from '@/lib/firebase';
import type { DataSource } from '@/lib/schema';
import { doc, setDoc, deleteDoc, updateDoc, collection, addDoc, writeBatch, getDocs, query, where, limit } from 'firebase/firestore';
import { syncGoogleSheet } from './google-sheets';
import { parseCSVRaw } from './csv';

// Guard: all functions need db to be initialized
const _db = db ?? (() => { throw new Error('Firebase not configured'); })();

export async function connectDataSource(uid: string, config: Omit<DataSource, 'id'>) {
  const ds = { ...config, id: `ds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
  await setDoc(doc(_db, 'users', uid, 'dataSources', ds.id), ds);
  return ds;
}

export async function disconnectDataSource(uid: string, dsId: string) {
  await deleteDoc(doc(_db, 'users', uid, 'dataSources', dsId));
}

export async function syncSource(uid: string, dsId: string, providerConfig: Record<string, string>): Promise<{ rowCount: number }> {
  await updateDoc(doc(_db, 'users', uid, 'dataSources', dsId), { status: 'syncing', updatedAt: Date.now() });

  try {
    let columns: string[] = [];
    let rows: (string | number | boolean | null)[][] = [];

    if (providerConfig.type === 'google-sheets') {
      const sheetsResult = await syncGoogleSheet({
        uid,
        spreadsheetId: providerConfig.spreadsheetId!,
        range: providerConfig.range || 'A1:Z10000',
        accessToken: providerConfig.accessToken!,
      });
      columns = sheetsResult.columns;
      rows = sheetsResult.rows;
    }

    const rowsRef = collection(_db, 'users', uid, 'dataSources', dsId, 'rows');
    const batch = writeBatch(_db);

    for (const row of rows) {
      batch.set(doc(rowsRef), { columns, values: row, syncedAt: Date.now() });
    }

    await batch.commit();

    await updateDoc(doc(_db, 'users', uid, 'dataSources', dsId), {
      status: 'connected',
      updatedAt: Date.now(),
      rowCount: rows.length,
    });

    return { rowCount: rows.length };
  } catch (err) {
    console.error('Sync failed:', err);
    await updateDoc(doc(_db, 'users', uid, 'dataSources', dsId), { status: 'error', updatedAt: Date.now() });
    throw err;
  }
}

export async function uploadCSV(uid: string, fileName: string, fileContent: string, dsId?: string): Promise<DataSource> {
  const id = dsId ?? `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const parsed = parseCSVRaw(fileContent);

  await setDoc(doc(_db, 'users', uid, 'dataSources', id), {
    name: fileName,
    type: 'csv-upload' as const,
    status: 'connected' as const,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    rowCount: parsed.values.length,
  });

  for (const row of parsed.values) {
    await addDoc(collection(_db, 'users', uid, 'dataSources', id, 'rows'), {
      columns: parsed.columns,
      values: row,
      syncedAt: Date.now(),
    });
  }

  return { id, name: fileName, type: 'csv-upload', status: 'connected', createdAt: Date.now(), updatedAt: Date.now() };
}
