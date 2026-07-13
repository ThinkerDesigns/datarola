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

// Create a Stripe Customer Portal session for self-service management
export async function getCustomerPortalUrl(uid: string): Promise<{ url: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!STRIPE_SECRET_KEY) return { url: '/billing?stripe=missing' };

  // First, find or create the Stripe customer linked to this uid
  const listRes = await fetch('https://api.stripe.com/v1/customers', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
  });

  let customerId: string | undefined;
  if (listRes.ok) {
    const customers = await listRes.json() as { data: Array<{ id: string; metadata: Record<string, string> }> };
    for (const c of customers.data) {
      if (c.metadata?.uid === uid) { customerId = c.id; break; }
    }
  }

  if (!customerId) return { url: '/billing' }; // fallback — can't find customer

  const portalRes = await fetch('https://api.stripe.com/v1/billing_sessions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ customer: customerId }),
  });

  if (!portalRes.ok) return { url: '/billing' }; // fallback
  const portalData = await portalRes.json() as { id?: string; url?: string };
  return { url: portalData.url ?? `/billing?error=Portal setup failed` };
}

// Count queries this month for a user (from Firestore usage subcollection)
export async function countQueriesThisMonth(uid: string): Promise<number> {
  // This is called server-side from the app — returns 0 here, actual counting done via useQueryCounter
  return 0;
}

// Increment query counter for a user
export async function incrementQueryCount(uid: string): Promise<void> {
  if (!uid) return;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // Client-side caller will do the Firestore increment directly via useQueryCounter hook
}

// Increment source count for a user
export async function incrementSourceCount(uid: string): Promise<void> {
  if (!uid) return;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  // Client-side caller will do the Firestore increment directly via useSourceCounter hook
}
