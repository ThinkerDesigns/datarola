// ponytail: Airtable OAuth callback — exchanges code for token, discovers base/tables, syncs data.
import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { syncAirtable } from '@/lib/connectors/external';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';
  const error = url.searchParams.get('error');

  if (error || !code) {
    const uid = state.split(':')[0] ?? 'dev';
    return NextResponse.redirect(new URL('/connections?oauth=error', req.url));
  }

  try {
    const clientId = process.env.AIRTABLE_CLIENT_ID ?? '';
    const clientSecret = process.env.AIRTABLE_CLIENT_SECRET ?? '';
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/airtable/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Airtable OAuth credentials not configured');
    }

    // Exchange authorization code for access token
    const tokenRes = await fetch('https://airtable.com/oauth2/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) throw new Error(`Airtable token exchange failed: ${await tokenRes.text()}`);
    const tokens = await tokenRes.json() as { access_token: string; error?: string };

    if (tokens.error) throw new Error(`Airtable error: ${tokens.error}`);

    const [uid] = state.split(':');

    // Discover accessible bases — Airtable can have multiple, pick the first
    const basesRes = await fetch('https://api.airtable.com/v0/meta/connections/bases', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!basesRes.ok) throw new Error(`Airtable base discovery failed: ${await basesRes.text()}`);
    const basesData = await basesRes.json() as { bases: Array<{ id: string; name: string }> };
    if (!basesData.bases?.length) throw new Error('No accessible Airtable bases found');
    const baseId = basesData.bases[0].id;
    const baseName = basesData.bases[0].name;

    // Discover tables in the base — pick the first one
    const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${encodeURIComponent(baseId)}/tables`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!tablesRes.ok) throw new Error(`Airtable table discovery failed: ${await tablesRes.text()}`);
    const tablesData = await tablesRes.json() as { tables: Array<{ id: string; name: string }> };
    if (!tablesData.tables?.length) throw new Error('No tables found in selected base');
    const tableName = tablesData.tables[0].name;

    // Create data source doc with syncing status
    if (db) {
      const dsId = `airtable_${baseId}_${Date.now()}`;
      await setDoc(doc(db, 'users', uid, 'dataSources', dsId), {
        id: dsId,
        name: `${baseName} — ${tableName}`,
        type: 'airtable' as const,
        status: 'syncing' as const,
        baseId,
        tableName,
        accessToken: tokens.access_token,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Sync rows immediately
      const sheetResult = await syncAirtable({
        accessToken: tokens.access_token,
        baseId,
        tableName,
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
    }

    return NextResponse.redirect(new URL(`/connections?oauth=success&name=${encodeURIComponent(baseName)}&baseId=${encodeURIComponent(baseId)}`, req.url));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Airtable OAuth callback failed';
    console.error('Airtable OAuth error:', msg);
    return NextResponse.redirect(new URL(`/connections?oauth=error&detail=${encodeURIComponent(msg)}`, req.url));
  }
}
