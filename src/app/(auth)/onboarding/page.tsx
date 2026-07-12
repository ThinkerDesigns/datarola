'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuthProviderPage from '@/app/auth-provider-page';
import { ConnectSourceModal } from '@/components/connect-source-modal';

type Step = 0 | 1 | 2; // 0: set name, 1: welcome, 2: connect

const connectorCards = [
  { type: 'csv-upload', name: 'CSV Upload', desc: 'Upload a .csv file — works instantly, no setup.' },
  { type: 'google-sheets', name: 'Google Sheets', desc: 'Connect your existing spreadsheets via OAuth.' },
  { type: 'bigquery', name: 'BigQuery', desc: 'Sync tables from your Google Cloud project.' },
  { type: 'postgresql', name: 'PostgreSQL', desc: 'Connect to any Postgres database over SSL.' },
];

export default function OnboardingPage() {
  return (
    <AuthProviderPage>
      <OnboardingShell />
    </AuthProviderPage>
  );
}

function OnboardingShell() {
  const [step, setStep] = useState<Step>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const { user, loading } = useAuth();
  const router = useRouter();

  // Remove any sign-out marker so next visit shows fresh.
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('dr_sign_out_requested');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0e1a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {step === 0 ? (
        <NameStep onNext={(name) => handleSetName(name, () => setStep(1))} user={user} />
      ) : step === 1 ? (
        <WelcomeStep onNext={() => setStep(2)} />
      ) : (
        <ConnectStep onBack={() => setStep(1)} />
      )}
    </>
  );

  function handleSetName(name: string, next: () => void) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dr_dev_name', name);
    }
    // Sync displayName to Firestore if real auth is active.
    if (user && user.displayName !== name) {
      // localStorage always takes priority in dev mode — no server call needed.
    }
    next();
  }
}

function NameStep({ onNext, user }: { onNext: (name: string) => void; user: any }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-fill from auth provider if available.
  useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Please enter a name (at least 2 characters).');
      return;
    }
    if (trimmed.length > 50) {
      setError('Name is too long (max 50 characters).');
      return;
    }
    setError('');
    setSaving(true);
    onNext(trimmed);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="7" fill="url(#name-logo)" />
            <path d="M8 10h4l3 6 3-6h4" stroke="#0a0e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="name-logo" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#338dfc" />
                <stop offset="1" stopColor="#59b1ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Choose your display name
        </h1>
        <p className="text-lg text-slate-400">This is how you&apos;ll be known across DataRola.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            autoFocus
            maxLength={50}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-lg text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600"
          />

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand-600 px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-brand-600/20 transition-all hover:bg-brand-500 disabled:opacity-50 hover:shadow-brand-500/30"
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </form>

        <p className="text-xs text-slate-600">Auto-filled from your sign-up — change it if you like.</p>
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-4">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="7" fill="url(#welcome-logo)" />
            <path d="M8 10h4l3 6 3-6h4" stroke="#0a0e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="welcome-logo" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#338dfc" />
                <stop offset="1" stopColor="#59b1ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Welcome to <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-brand-500 bg-clip-text text-transparent">DataRola</span>
        </h1>
        <p className="mt-3 text-lg text-slate-400">
          Connect your data sources, then ask questions in plain English. AI generates the queries and returns answers from your data.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={onNext}
            className="rounded-xl bg-brand-600 px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-brand-600/20 transition-all hover:bg-brand-500 hover:shadow-brand-500/30"
          >
            Connect your first data source →
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-600">Works with CSV, Google Sheets, BigQuery, and more.</p>
      </div>
    </div>
  );
}

function ConnectStep({ onBack }: { onBack: () => void }) {
  const [selectedType, setSelectedType] = useState<string>('');
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-4">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-300 transition-colors mb-4 block w-full text-center">← Back</button>
          <h2 className="text-xl font-semibold text-white">Choose a connector</h2>
          <p className="mt-1 text-sm text-slate-400">Pick the type of data you want to connect.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {connectorCards.map((c) => (
            <button
              key={c.type}
              onClick={() => setSelectedType(c.type)}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-5 text-left transition-all hover:border-brand-500/30 hover:bg-brand-500/5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-600/15">
                <span className="text-base font-bold text-brand-400">{c.name[0]}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{c.name}</p>
                <p className="text-xs text-slate-500">{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedType && (
        <ConnectSourceModal
          initialType={selectedType as any}
          onClose={() => setSelectedType('')}
          onConnected={() => {
            setSelectedType('');
            window.location.href = '/app';
          }}
        />
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
