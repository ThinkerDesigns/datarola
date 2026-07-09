'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

// ponytail: client-side gate — redirects unauthenticated users to / while showing a spinner
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) window.location.href = '/';
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1117]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return user ? <>{children}</> : null;
}
