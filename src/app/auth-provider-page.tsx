'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AuthProvider } from '@/lib/auth-context';

export default function AuthProviderPage({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HandleRedirect />
      {children}
    </AuthProvider>
  );
}

/** After Google OAuth redirect returns, detect the new user and navigate to onboarding. */
function HandleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (hasNavigatedRef.current) return;
    if (!user) return;

    // Fresh user just arrived — this handles the post-OAuth-redirect flow.
    // After sign-in/sign-up pages: go to onboarding.
    // After direct /app access with existing session: stay on app.
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path === '/sign-in' || path === '/sign-up') {
      hasNavigatedRef.current = true;
      console.log('[auth] redirect back from Google, navigating to /onboarding');
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  return null;
}
