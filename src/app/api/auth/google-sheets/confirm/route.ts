// ponytail: Complete Google Sheets connection — creates data source doc and syncs rows.
import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, collection, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  if (!db) return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });

  const body = await req.json();
  const uid = body.uid;
  const spreadsheetId = body.spreadsheetId;
  const sheetName = body.name || 'Google Sheet';

  if (!uid || !spreadsheetId) {
    return NextResponse.json({ error: 'Missing uid or spreadsheetId' }, { status: 400 });
  }

  // Read OAuth token from Firestore
  const tokenDoc = await getDoc(doc(db, 'users', uid, 'oauthTokens', 'google-sheets'));
  if (!tokenDoc.exists()) {
    return NextResponse.json({ error: 'No OAuth token found. Re-authorize.' }, { status: 400 });
  }

  const accessToken = (tokenDoc.data() as { accessToken?: string }).accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: 'No access token available' }, { status: 400 });
  }

  // Sync sheet values
  const range = body.range ?? 'A1:Z10000';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);

  let columns: string[] = [];
  let rowCount = 0;
  if (res.ok) {
    const json = await res.json() as { values?: unknown[][] };
    const raw = json.values ?? [];
    if (raw.length > 0) {
      columns = (raw[0] as string[]).map(c => c?.toString() ?? '');
      rowCount = Math.max(0, raw.length - 1); // exclude header row

      // Write rows to Firestore
      const dsId = `gs_${spreadsheetId}_${Date.now()}`;
      await setDoc(doc(db, 'users', uid, 'dataSources', dsId), {
        id: dsId, name: sheetName, type: 'google-sheets', status: rowCount > 0 ? 'connected' : 'syncing',
        createdAt: Date.now(), updatedAt: Date.now(), spreadsheetId, rowCount, columnCount: columns.length,
      });

      if (columns.length > 0) {
        const rowsRef = collection(db, 'users', uid, 'dataSources', dsId, 'rows');
        const batch = writeBatch(db);
        for (const row of raw.slice(1)) {
          batch.set(doc(rowsRef), { columns, values: row, syncedAt: Date.now() });
        }
        await batch.commit();
      }
    }
  }

  return NextResponse.json({ ok: true, dsId: `gs_${spreadsheetId}_${Date.now()}`, rowCount, columns });
}
