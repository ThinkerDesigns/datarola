// ponytail: Airtable OAuth start — redirect user to Airtable's authorization page.
import { NextRequest, NextResponse } from 'next/server';

function base64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? 'dev';
  // These come from your Airtable OAuth app settings
  const clientId = process.env.AIRTABLE_CLIENT_ID ?? '';
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/airtable/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'AIRTABLE_CLIENT_ID not configured' },
      { status: 500 }
    );
  }

  const state = `${uid}:${Date.now()}`;

  // PKCE flow — Airtable requires code_challenge + code_challenge_method
  const codeVerifier = base64url(Buffer.from(crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')));
  const hash = crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  const codeChallenge = base64url(Buffer.from(hash));

  // Store verifier in HTTP-only cookie so callback can retrieve it
  const cookies = new Headers();
  cookies.append(
    'set-cookie',
    `airtable_pkce_verifier=${codeVerifier}; Path=/api/auth/airtable/callback; HttpOnly; SameSite=Lax; Max-Age=600`
  );

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: 'data.records:read,schema.bases:read,user.email:read',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const res = NextResponse.redirect(`https://airtable.com/oauth2/v1/authorize?${params}`);
  // Append the set-cookie header — NextResponse redirect constructor doesn't accept a Headers object.
  res.headers.set('set-cookie', `airtable_pkce_verifier=${codeVerifier}; Path=/api/auth/airtable/callback; HttpOnly; SameSite=Lax; Max-Age=600`);
  return res;
}
