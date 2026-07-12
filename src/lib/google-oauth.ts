// ponytail: Google Sheets OAuth — server-side authorization URL + token exchange.
'use server';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/google-sheets/callback`;

// Scope needed to read Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

interface AuthUrlResult {
  authUrl: string;
}

interface TokenResult {
  accessToken: string;
  refreshToken: string;
  spreadsheetId: string;
  spreadsheetName: string;
}

export async function refreshAccessToken(uid: string): Promise<string> {
  if (!GOOGLE_CLIENT_SECRET) throw new Error('Google OAuth not configured');
  if (!db) throw new Error('Firebase not initialized');

  const tokenDoc = await getDoc(doc(db, 'users', uid, 'oauthTokens', 'google-sheets'));
  if (!tokenDoc.exists()) throw new Error('No Google Sheets tokens found. Re-authorize.');

  const data = tokenDoc.data() as { refreshToken: string };
  if (!data.refreshToken) throw new Error('No refresh token. Re-authorize.');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: data.refreshToken,
    }),
  });

  if (!res.ok) throw new Error('Failed to refresh Google token');

  const tokens = await res.json() as { access_token: string };
  // Update stored access token
  await setDoc(doc(db, 'users', uid, 'oauthTokens', 'google-sheets'), {
    accessToken: tokens.access_token,
    expiresAt: Date.now() + 3600000,
  }, { merge: true });

  return tokens.access_token;
}

export async function generateAuthUrl(uid: string): Promise<AuthUrlResult> {
  if (!GOOGLE_CLIENT_ID) throw new Error('Google OAuth not configured (set GOOGLE_CLIENT_ID)');

  const state = `${uid}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return { authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
}

export async function exchangeCodeForTokens(code: string, state: string): Promise<TokenResult> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth not configured');
  }

  const [uid] = state.split(':');
  if (!uid) throw new Error('Invalid OAuth state');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google OAuth token exchange failed: ${errText}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expiry_date?: number;
  };

  // Get spreadsheet info using Drive API (more reliable than Sheets API — drive.readonly scope works even when Sheets API isn't enabled on the project).
  let spreadsheetId = '';
  let spreadsheetName = 'Google Sheet';
  try {
    const driveRes = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application/vnd.google-apps.spreadsheet%27&pageSize=1&sortBy=createdTime&sortOrder=descending',
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    if (driveRes.ok) {
      const driveData = await driveRes.json() as { files?: Array<{ id: string; name: string }> };
      if (driveData.files?.[0]) {
        spreadsheetId = driveData.files[0].id;
        spreadsheetName = driveData.files[0].name || 'Google Sheet';
      }
    } else {
      const errText = await driveRes.text();
      console.error('[oauth] drive.files.list failed:', driveRes.status, errText);
    }
  } catch (err) {
    console.error('[oauth] drive.files.list exception:', err instanceof Error ? err.message : err);
  }

  // Store tokens in Firestore for future refresh
  if (db) {
    await setDoc(doc(db, 'users', uid, 'oauthTokens', 'google-sheets'), {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expiry_date ? Number(tokenData.expiry_date) * 1000 : Date.now() + 3600000,
      createdAt: Date.now(),
    }, { merge: true });
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    spreadsheetId,
    spreadsheetName: spreadsheetName || 'Google Sheet',
  };
}
