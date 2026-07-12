'use client';

import AuthProviderPage from '@/app/auth-provider-page';
import { ConnectionsView } from '@/components/connections-view';

export default function ConnectionsPage() {
  return (
    <AuthProviderPage>
      <div className="mx-auto max-w-4xl p-6">
        {/* Back to dashboard */}
        <button
          onClick={() => window.location.href = '/app'}
          className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1 mb-4"
        >
          ← Dashboard
        </button>
        <ConnectionsView />
      </div>
    </AuthProviderPage>
  );
}
