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

function HandleRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (hasNavigatedRef.current) return;
    if (!user) return;
    hasNavigatedRef.current = true;

    // After sign-in/sign-up: go to onboarding.
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    if (path === '/sign-in' || path === '/sign-up') {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  return null;
}
