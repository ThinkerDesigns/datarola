'use client';

import { useState } from 'react';

export function SettingsView() {
  const [modelProvider, setModelProvider] = useState<'ollama' | 'anthropic'>('ollama');
  const [alertEmail, setAlertEmail] = useState('alice@company.com');
  const [alertsEnabled, setAlertsEnabled] = useState(true);

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
          Switch between local Ollama (free, offline) and Anthropic API (higher accuracy). Change takes effect on your next query. Test both during this testing phase to compare quality and cost.
        </p>
        <div className="flex items-center gap-3">
          {(['ollama', 'anthropic'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setModelProvider(p)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                modelProvider === p
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'bg-white/[0.03] text-slate-500 border border-white/5 hover:text-slate-300'
              }`}
            >
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
          <button
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`relative h-[22px] w-[44px] rounded-full transition-colors ${alertsEnabled ? 'bg-brand-600' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white transition-transform ${alertsEnabled ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
          </button>
        </div>
        {alertsEnabled && (
          <input
            type="email"
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50"
            placeholder="alert-email@company.com"
          />
        )}
      </div>

      {/* Account */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-sm font-medium text-white">Account</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Plan</p>
            <p className="text-xs text-slate-500">Free tier — 1 source, 20 queries/mo</p>
          </div>
          <button className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors">Upgrade</button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Connected sources</p>
            <p className="text-xs text-slate-500">2 of 1 used</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-6 space-y-3">
        <h3 className="text-sm font-medium text-red-400">Danger Zone</h3>
        <button className="text-xs text-red-400/70 hover:text-red-400 transition-colors">Delete account and all data</button>
      </div>
    </div>
  );
}
