// ponytail: Google Sheets OAuth callback — exchanges the code for tokens, creates a data source.
import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exchangeCodeForTokens } from '@/lib/google-oauth';
import { syncGoogleSheet } from '@/lib/connectors/google-sheets';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const error = url.searchParams.get('error');

  if (error || !code) {
    const uid = state.split(':')[0] ?? 'dev';
    return NextResponse.redirect(new URL(`/connections?oauth=error`, req.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code, state);
    const [uid] = state.split(':');

    // Create data source doc with the spreadsheet info (status=syncing until rows are stored)
    if (db) {
      const dsId = `gs_${tokens.spreadsheetId}_${Date.now()}`;
      await setDoc(doc(db, 'users', uid, 'dataSources', dsId), {
        id: dsId,
        name: tokens.spreadsheetName || 'Google Sheet',
        type: 'google-sheets',
        status: 'syncing' as const,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        spreadsheetId: tokens.spreadsheetId,
      });

      // Sync rows immediately
      const sheetResult = await syncGoogleSheet({
        uid,
        spreadsheetId: tokens.spreadsheetId,
        range: 'A1:Z10000',
        accessToken: tokens.accessToken,
      });

      if (sheetResult.columns.length > 0) {
        const rowsRef = collection(db, 'users', uid, 'dataSources', dsId, 'rows');
        const batch = writeBatch(db);
        for (const row of sheetResult.rows) {
          batch.set(doc(rowsRef), { columns: sheetResult.columns, values: row, syncedAt: Date.now() });
        }
        await batch.commit();

        await setDoc(doc(db, 'users', uid, 'dataSources', dsId), {
          rowCount: sheetResult.rowCount,
          status: 'connected' as const,
          updatedAt: Date.now(),
        }, { merge: true });
      }

      // Store refresh token for re-auth
      await setDoc(doc(db, 'users', uid, 'oauthTokens', 'google-sheets'), {
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + 3600000, // will refresh on next sync
        createdAt: Date.now(),
      }, { merge: true });
    }

    return NextResponse.redirect(new URL(`/connections?oauth=success&spreadsheetId=${encodeURIComponent(tokens.spreadsheetId)}&name=${encodeURIComponent(tokens.spreadsheetName || '')}`, req.url));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'OAuth callback failed';
    console.error('Google Sheets OAuth callback error:', msg);
    return NextResponse.redirect(new URL(`/connections?oauth=error&detail=${encodeURIComponent(msg)}`, req.url));
  }
}
