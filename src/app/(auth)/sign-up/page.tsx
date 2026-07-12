'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuthProviderPage from '@/app/auth-provider-page';

export default function SignUpPage() {
  return (
    <AuthProviderPage>
      <SignUpForm />
    </AuthProviderPage>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      router.push('/app');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create account.';
      if (msg.includes('email-already-in-use')) {
        setError('An account with that email already exists. Try signing in instead.');
      } else if (msg.includes('weak-password') || msg.includes('password-min')) {
        setError('Password must be at least 6 characters long.');
      } else if (msg.includes('invalid-email')) {
        setError('That is not a valid email address.');
      } else if (msg.includes('Firebase not configured') || msg.includes('not enabled')) {
        setError(`Firebase error: ${msg}. Make sure Email/Password auth is enabled in your Firebase Console.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Use your email to get started.</p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Already have an account?{' '}
          <a href="/sign-in" className="text-brand-400 hover:text-brand-300">Sign in</a>
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
