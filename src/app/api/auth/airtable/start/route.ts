// ponytail: Airtable OAuth start — redirect user to Airtable's authorization page.
import { NextRequest, NextResponse } from 'next/server';

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
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: 'data.records:read,schema.bases:read,user.email:read',
  });

  return NextResponse.redirect(`https://airtable.com/oauth2/v1/authorize?${params}`);
}
