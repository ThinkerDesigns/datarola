'use client';

import { type ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth-context';

export default function AuthProviderPage({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
