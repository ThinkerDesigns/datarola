// ponytail: Stripe webhook — receives subscription events and updates user plan in Firestore.
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// ponytail: require webhook secret at startup — if missing, the endpoint is completely non-functional (fail loud).
if (!WEBHOOK_SECRET) {
  console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set. Webhook verification cannot run.');
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  // ponytail: signature verification is ALWAYS required — never skip it, even in dev
  if (!WEBHOOK_SECRET || !sig) return NextResponse.json({ error: 'Missing webhook secret or signature header' }, { status: 403 });

  const [tsStr, ...sigParts] = sig.split(',');
  const timestamp = tsStr?.replace('t=', '');
  const expectedSig = sigParts.find((p) => p.startsWith('v1='))?.replace('v1=', '');
  if (!timestamp || !expectedSig) return NextResponse.json({ error: 'Invalid signature header format' }, { status: 400 });

  const crypto = await import('node:crypto');
  const payload = `${timestamp}.${body}`;
  const hash = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
  if (hash !== expectedSig) return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = (event.type as string) ?? '';
  const obj = (event.data?.object ?? {}) as Record<string, unknown>;
  // Stripe metadata is nested under object.metadata
  const meta = (obj.metadata ?? {}) as Record<string, string>;
  const uid = meta.uid;

  if (!db || !uid) return NextResponse.json({ received: true });

  const profileRef = doc(db, 'users', uid, 'profile');

  try {
    switch (eventType) {
      case 'invoice.payment_succeeded':
      case 'subscription.created':
        await setDoc(profileRef, {
          plan: meta.plan || 'pro' as const,
          stripeSubscriptionId: (obj.id as string) ?? '',
          updatedAt: Date.now(),
        }, { merge: true });
        break;

      case 'invoice.payment_failed':
        await setDoc(profileRef, {
          planError: 'Payment failed' as const,
          updatedAt: Date.now(),
        }, { merge: true });
        break;

      case 'customer.subscription.deleted':
        await setDoc(profileRef, {
          plan: 'free' as const,
          stripeSubscriptionId: '',
          updatedAt: Date.now(),
        }, { merge: true });
        break;
    }
  } catch (err) {
    console.error('Stripe webhook error:', err);
  }

  return NextResponse.json({ received: true });
}
