'use client';

import AuthProviderPage from '@/app/auth-provider-page';
import { AppShell } from '@/components/app-shell';

export default function AppPage() {
  return (
    <AuthProviderPage>
      <AppShell />
    </AuthProviderPage>
  );
}
