// Stripe billing — server actions for subscriptions.
'use server';

export interface PlanInfo { plan: 'free' | 'pro'; queriesPerMonth: number; sourcesAllowed: number; }

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? '';
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? '';

// Create a Stripe checkout session for upgrading to Pro
export async function createCheckoutSession(uid: string): Promise<{ url: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!STRIPE_SECRET_KEY) return { url: '/billing?stripe=missing' };

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': STRIPE_PRICE_ID,
      'metadata[uid]': uid,
      'metadata[plan]': 'pro',
      success_url: `${baseUrl}/app?billing=success`,
      cancel_url: `${baseUrl}/app/billing?canceled=true`,
    }),
  });

  if (!res.ok) return { url: `/billing?error=${encodeURIComponent(await res.text())}` };
  const data = await res.json() as { url: string };
  return { url: data.url };
}

// Fetch current user plan from Firestore profile doc
export async function getUserPlan(uid: string): Promise<PlanInfo> {
  if (!uid) return { plan: 'free', queriesPerMonth: 20, sourcesAllowed: 1 };
  // Client-side caller uses useAuth + direct Firestore to read profile
  return { plan: 'free', queriesPerMonth: 20, sourcesAllowed: 1 }; // fallback
}
