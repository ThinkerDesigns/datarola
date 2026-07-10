// ponytail: Client-side Firestore writes for CSV/XLSX uploads — avoids server-side Firebase SDK issue.
'use client';

import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import type { DataSource } from '@/lib/schema';

const PROJECT_ID = typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '') : '';

function getBaseUrl(): string {
  if (!PROJECT_ID) return '';
  return `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
}

/** Write a data source document and all rows to Firestore from the client side, using fetch. */
export async function writeCSVToFirestore(
  uid: string,
  fileName: string,
  columns: string[],
  values: (string | number | boolean | null)[][],
  dsId?: string,
): Promise<DataSource> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new Error('Firebase not configured');

  const id = dsId ?? `csv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Use Firestore REST API with user's ID token for auth
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Get the current Firebase Auth ID token if available (production mode)
  const getIdToken = () => {
    // Check if there's a Firebase Auth instance on window
    const authState = (window as any).__FIREBASE_AUTH__;
    return authState?.currentUser?.getIdToken?.() ?? Promise.resolve(null);
  };

  const token = await getIdToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Write data source doc
  const dsUrl = `${baseUrl}/users/${uid}/dataSources/${id}`;
  await fetch(dsUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      fields: {
        name: { stringValue: fileName },
        type: { stringValue: 'csv-upload' },
        status: { stringValue: 'connected' },
        createdAt: { integerValue: String(Date.now()) },
        updatedAt: { integerValue: String(Date.now()) },
        rowCount: { integerValue: String(values.length) },
      },
    }),
  });

  // Write each row
  const rowsUrl = `${baseUrl}/users/${uid}/dataSources/${id}/rows`;
  for (const row of values) {
    await fetch(rowsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: {
          columns: {
            arrayValue: {
              values: columns.map((c) => ({ stringValue: c })),
            },
          },
          values: {
            arrayValue: {
              values: row.map((v) => {
                if (v == null) return { nullValue: 0 };
                if (typeof v === 'number') {
                  return Number.isInteger(v)
                    ? { integerValue: String(v) }
                    : { doubleValue: String(v) };
                }
                return { stringValue: String(v) };
              }),
            },
          },
          syncedAt: { integerValue: String(Date.now()) },
        },
      }),
    });
  }

  return { id, name: fileName, type: 'csv-upload', status: 'connected', createdAt: Date.now(), updatedAt: Date.now() };
}
