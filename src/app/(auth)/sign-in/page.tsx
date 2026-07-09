'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AuthProviderPage from '@/app/auth-provider-page';

export default function SignInPage() {
  return (
    <AuthProviderPage>
      <SignInForm />
    </AuthProviderPage>
  );
}

function SignInForm() {
  const [email, setEmail] = useState('alice@company.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Only redirect to /app when we're already past auth pages — prevents instant redirect on auth-pageload
  useEffect(() => {
    if (!loading && user && pathname !== '/sign-in' && pathname !== '/sign-up') {
      router.push('/app');
    }
  }, [user, loading, router, pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      if (msg.includes('no user') || msg.includes('user-not-found')) {
        setError('No account found. Create one below.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign-in cancelled');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your DataRola account.</p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        <button
          onClick={handleGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white hover:bg-white/[0.08] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c.97 0 1.89-.31 2.68-.85l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-xs text-slate-600">or</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
            className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required
            className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50 placeholder:text-slate-600" />
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50 transition-colors">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}<a href="/sign-up" className="text-brand-400 hover:text-brand-300">Create one</a>
        </p>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
