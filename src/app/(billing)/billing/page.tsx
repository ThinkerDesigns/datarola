'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/lib/stripe';

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async () => {
    setError('');
    setLoading(true);
    try {
      const { url } = await createCheckoutSession();
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
          <h1 className="text-2xl font-semibold text-white">Upgrade your plan</h1>
          <p className="mt-2 text-sm text-slate-500">Unlock more data sources and queries.</p>
        </div>

        <div className="space-y-4">
          {/* Free plan */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
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
          <div className="rounded-xl border border-brand-500/30 bg-brand-600/[0.08] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Pro</p>
                <p className="text-xs text-slate-400">For teams that need more</p>
              </div>
              <span className="rounded-full bg-brand-600 px-3 py-1 text-xs text-white">$29/mo</span>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-400">
              <li>• 10 data sources</li>
              <li>• 200 queries/month</li>
              <li>• All connectors (BigQuery, Snowflake, PostgreSQL, etc.)</li>
              <li>• Anomaly alerts via email</li>
            </ul>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        {success ? (
          <p className="text-center text-sm text-emerald-400">Upgrade successful! Welcome to Pro.</p>
        ) : (
          <button onClick={handleUpgrade} disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {loading ? 'Processing…' : 'Upgrade to Pro'}
          </button>
        )}

        <p className="text-center text-xs text-slate-600">Cancel anytime. No hidden fees.</p>
      </div>
    </div>
  );
}
