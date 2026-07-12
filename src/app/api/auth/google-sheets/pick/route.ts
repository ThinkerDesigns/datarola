'use server';

// ponytail: Returns list of available spreadsheets for the given uid using stored OAuth token.

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? 'dev';

  if (!db) {
    return NextResponse.json({ spreadsheets: [] }, { status: 500 });
  }

  const tokenDoc = await getDoc(doc(db, 'users', uid, 'oauthTokens', 'google-sheets'));
  if (!tokenDoc.exists()) {
    return NextResponse.json({ error: 'No OAuth token found. Please re-authorize.', spreadsheets: [] }, { status: 400 });
  }

  const data = tokenDoc.data() as { accessToken: string };
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application/vnd.google-apps.spreadsheet%27&pageSize=50&sortBy=createdTime&sortOrder=descending',
    { headers: { Authorization: `Bearer ${data.accessToken}` } }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('[oauth] drive.files.list failed:', res.status, errText);
    return NextResponse.json({ error: 'Failed to list spreadsheets', spreadsheets: [] }, { status: res.status });
  }

  const json = await res.json() as { files?: Array<{ id: string; name: string }> };
  return NextResponse.json({ spreadsheets: json.files ?? [] });
}
