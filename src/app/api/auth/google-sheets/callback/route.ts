// ponytail: Google Sheets OAuth callback — exchanges code for tokens, redirects to spreadsheet picker.
import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exchangeCodeForTokens } from '@/lib/google-oauth';

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

    // Store OAuth tokens for later refresh
    if (db) {
      await setDoc(doc(db, 'users', uid, 'oauthTokens', 'google-sheets'), {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt || Date.now() + 3600000,
        createdAt: Date.now(),
      }, { merge: true });
    }

    // Redirect to spreadsheet picker — let user choose which sheet(s) to connect
    return NextResponse.redirect(new URL(`/connections/google-sheets-pick?uid=${uid}`, req.url));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'OAuth callback failed';
    console.error('Google Sheets OAuth callback error:', msg);
    return NextResponse.redirect(new URL(`/connections?oauth=error&detail=${encodeURIComponent(msg)}`, req.url));
  }
}
