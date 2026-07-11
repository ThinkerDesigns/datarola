import { NextRequest, NextResponse } from 'next/server';

// Dev-mode: no backend needed. Onboarding saves to localStorage directly in the browser.
// In production with Firebase Admin SDK, this would write displayName to the user Firestore doc.
export async function POST(_req: NextRequest) {
  return NextResponse.json({ ok: true });
}
