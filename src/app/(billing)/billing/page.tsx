'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { createCheckoutSession } from '@/lib/stripe';

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro'>('free');

  const { user } = useAuth();

  useEffect(() => {
    if (user && db) {
      getDoc(doc(db, 'users', user.uid, 'profile')).then((snap) => {
        if (snap.exists()) setPlan((snap.data() as any).plan ?? 'free');
      });
    }
  }, [user]);

  const handleUpgrade = async () => {
    setError('');
    setLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');
      const { url } = await createCheckoutSession(user.uid);
      if (url.startsWith('/billing')) {
        setError(url.includes('missing') ? 'Stripe not configured yet.' : 'Billing error. Please try again.');
      } else {
        window.location.href = url; // Redirect to Stripe Checkout
      }
    } catch {
      setError('Could not start checkout. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-4">
      <div className="w-full max-w-md space-y-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">Billing</h1>
          <p className="mt-2 text-sm text-slate-500">Your plan: <span className="text-brand-400 font-medium capitalize">{plan}</span></p>
        </div>

        <div className="space-y-4">
          {/* Free plan */}
          <div className={`rounded-xl border p-6 ${plan === 'free' ? 'border-brand-500/40 bg-brand-600/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Free</p>
                <p className="text-xs text-slate-500">For trying out DataRola</p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">$0/mo</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
              <li>• 1 data source</li>
              <li>• 20 queries/month</li>
              <li>• Google Sheets & CSV support</li>
            </ul>
          </div>

          {/* Pro plan */}
          <div className={`rounded-xl border p-6 ${plan === 'pro' ? 'border-brand-500/40 bg-brand-600/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Pro</p>
                <p className="text-xs text-slate-400">For teams that need more</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${plan === 'pro' ? 'bg-brand-600 text-white' : 'bg-brand-900/50 text-brand-400'}`}>
                {plan === 'pro' ? 'Active' : '$29/mo'}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
              <li>• 10 data sources</li>
              <li>• 200 queries/month</li>
            <li>• Advanced connectors (BigQuery, Snowflake, PostgreSQL)</li>
              <li>• All connectors (BigQuery, Snowflake, PostgreSQL, etc.)</li>
              <li>• Anomaly alerts via email</li>
            </ul>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        {plan === 'free' ? (
          <button onClick={handleUpgrade} disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {loading ? 'Processing…' : 'Upgrade to Pro'}
          </button>
        ) : (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-center">
            <p className="text-sm text-emerald-300">You're on Pro. Manage your subscription in the <a href="#" className="underline">Stripe portal</a>.</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-600">Cancel anytime. No hidden fees.</p>
      </div>
    </div>
  );
}
