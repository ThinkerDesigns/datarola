'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut as fbSignOut } from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import { useDataSources } from '@/lib/use-data-sources';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';

export function SettingsView() {
  const [modelProvider, setModelProvider] = useState<'ollama' | 'anthropic'>('ollama');
  const [alertEmail, setAlertEmail] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const { user } = useAuth();
  const dataSources = useDataSources(user?.uid ?? null);

  // Read user profile from Firestore
  useEffect(() => {
    if (user && db) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          setPlan((d.plan === 'pro' ? 'pro' : 'free') as 'free' | 'pro');
          setAlertEmail((d.alertEmail as string) ?? '');
          setAlertsEnabled(!!d.alertsEnabled);
        }
      });
    }
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user || !db) return;
    await updateDoc(doc(db, 'users', user.uid), {
      alertEmail, alertsEnabled, modelProvider: modelProvider === 'ollama' ? 'ollama' : 'anthropic',
      updatedAt: Date.now(),
    });
  };

  const handleDeleteAccount = async () => {
    if (!user || !auth) return;
    if (window.confirm('This will permanently delete your account and all data. Are you sure?')) {
      await fbSignOut(auth);
      window.location.href = '/';
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/billing';
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-400">Model provider, alerts, and account options.</p>
      </div>

      {/* Model Provider */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white">Model Provider</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Switch between local Ollama (free, offline) and Anthropic API (higher accuracy). Change takes effect on your next query.
        </p>
        <div className="flex items-center gap-3">
          {(['ollama', 'anthropic'] as const).map((p) => (
            <button key={p} onClick={() => setModelProvider(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${modelProvider === p ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'bg-white/[0.03] text-slate-500 border border-white/5 hover:text-slate-300'}`}>
              {p === 'ollama' ? 'Ollama (local)' : 'Anthropic API'}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Settings */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white">Alerts</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Email alerts for anomalies</p>
            <p className="text-xs text-slate-500">Get notified when DataRola detects significant changes.</p>
          </div>
          <button onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`relative h-[22px] w-[44px] rounded-full transition-colors ${alertsEnabled ? 'bg-brand-600' : 'bg-slate-700'}`}>
            <span className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white transition-transform ${alertsEnabled ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
          </button>
        </div>
        {alertsEnabled && (
          <input type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600"
            placeholder="alert-email@company.com" />
        )}
      </div>

      {/* Plan & Usage */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white">Plan & Usage</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Current plan</p>
            <p className="text-xs text-slate-500">{plan === 'pro' ? 'Pro — all features unlocked' : 'Free tier — 1 source, 20 queries/mo'}</p>
          </div>
          {plan === 'free' ? (
            <button onClick={handleUpgrade} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500 transition-colors">Upgrade</button>
          ) : (
            <span className="rounded-full bg-brand-600/20 px-3 py-1 text-xs font-medium text-brand-400">Pro</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Connected sources</p>
            <p className="text-xs text-slate-500">{dataSources.length} of {plan === 'pro' ? 10 : 1} used</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-6 space-y-3">
        <h3 className="text-sm font-medium text-red-400">Danger Zone</h3>
        <p className="text-xs text-slate-500">Deleting your account is permanent and cannot be undone.</p>
        <button onClick={handleDeleteAccount} className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">Delete account and all data</button>
      </div>

      <div className="flex justify-end pt-2">
        <button onClick={handleSaveSettings} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 transition-colors">Save settings</button>
      </div>
    </div>
  );
}
