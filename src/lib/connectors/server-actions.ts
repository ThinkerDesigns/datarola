'use server';

// ponytail: server actions for connector sync — called from the UI to trigger data pulls.
import { db } from '@/lib/firebase';
import type { DataSource, ConnectorType } from '@/lib/schema';
import { doc, setDoc, deleteDoc, updateDoc, collection, addDoc, writeBatch, getDocs, query, where, limit } from 'firebase/firestore';
import { syncGoogleSheet } from './google-sheets';
import { parseCSVRaw } from './csv';
import { refreshAccessToken } from '@/lib/google-oauth';
import { syncBigQuery, syncSnowflake, syncAirtable } from './external';

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

    switch (providerConfig.type as ConnectorType) {
      case 'google-sheets': {
        let accessToken = providerConfig.accessToken;
        if (!accessToken) {
          try { accessToken = await refreshAccessToken(uid); } catch { /* fall through */ }
        }
        if (!accessToken) throw new Error('Missing access token for Google Sheets.');
        const sheetsResult = await syncGoogleSheet({ uid, spreadsheetId: providerConfig.spreadsheetId!, range: providerConfig.range || 'A1:Z10000', accessToken });
        columns = sheetsResult.columns;
        rows = sheetsResult.rows;
        break;
      }
      case 'bigquery': {
        const bqResult = await syncBigQuery({ projectId: providerConfig.projectId!, accessToken: providerConfig.accessToken!, query: providerConfig.query! });
        columns = bqResult.columns;
        rows = bqResult.rows;
        break;
      }
      case 'snowflake': {
        const sfResult = await syncSnowflake({ account: providerConfig.account!, user: providerConfig.user!, password: providerConfig.password!, database: providerConfig.database!, schema: providerConfig.schema!, warehouse: providerConfig.warehouse!, query: providerConfig.query! });
        columns = sfResult.columns;
        rows = sfResult.rows;
        break;
      }
      case 'airtable': {
        const atResult = await syncAirtable({ accessToken: providerConfig.accessToken!, baseId: providerConfig.baseId!, tableName: providerConfig.tableName! });
        columns = atResult.columns;
        rows = atResult.rows;
        break;
      }
      case 'postgresql':
      case 'mysql':
      case 'redshift':
        throw new Error('SQL database connectors (PostgreSQL, MySQL, Redshift) are not yet implemented. Use Google Sheets or CSV upload for now.');
      default:
        throw new Error(`Unknown connector type: ${providerConfig.type}`);
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
    name: fileName, type: 'csv-upload' as const, status: 'connected' as const,
    createdAt: Date.now(), updatedAt: Date.now(), rowCount: parsed.values.length,
  });
  for (const row of parsed.values) {
    await addDoc(collection(_db, 'users', uid, 'dataSources', id, 'rows'), {
      columns: parsed.columns, values: row, syncedAt: Date.now(),
    });
  }
  return { id, name: fileName, type: 'csv-upload', status: 'connected', createdAt: Date.now(), updatedAt: Date.now() };
}

export async function uploadRows(uid: string, fileName: string, columns: string[], values: (string | number | boolean | null)[][], dsId?: string): Promise<DataSource> {
  const id = dsId ?? `rows_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(_db, 'users', uid, 'dataSources', id), {
    name: fileName, type: 'csv-upload' as const, status: 'connected' as const,
    createdAt: Date.now(), updatedAt: Date.now(), rowCount: values.length,
  });
  for (const row of values) {
    await addDoc(collection(_db, 'users', uid, 'dataSources', id, 'rows'), {
      columns, values: row, syncedAt: Date.now(),
    });
  }
  return { id, name: fileName, type: 'csv-upload', status: 'connected', createdAt: Date.now(), updatedAt: Date.now() };
}
