// ponytail: Complete Google Sheets connection after user picks a sheet.
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

  if (!res.ok) {
    const errText = await res.text();
    console.error('[sheets] sync failed:', res.status, errText);
    // Still create the data source doc even without rows (user can reconnect later)
  }

  let rowCount = 0;
  if (res.ok) {
    const json = await res.json() as { values?: unknown[][] };
    const raw = json.values ?? [];
    rowCount = Math.max(0, raw.length - 1); // exclude header row
  }

  const dsId = `gs_${spreadsheetId}_${Date.now()}`;
  await setDoc(doc(db, 'users', uid, 'dataSources', dsId), {
    id: dsId, name: sheetName, type: 'google-sheets', status: rowCount > 0 ? 'connected' : 'error',
    createdAt: Date.now(), updatedAt: Date.now(), spreadsheetId, rowCount,
  });

  return NextResponse.json({ ok: true, dsId, rowCount });
}
