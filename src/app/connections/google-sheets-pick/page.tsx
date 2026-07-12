'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db as firebaseDb } from '@/lib/firebase';

interface SheetInfo { id: string; name: string };

export default function GoogleSheetsPicker() {
  const [spreadsheets, setSpreadsheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectingName, setConnectingName] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid') || '';

  useEffect(() => {
    fetch('/api/auth/google-sheets/pick?uid=' + encodeURIComponent(uid))
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSpreadsheets(data.spreadsheets ?? []);
      })
      .catch(() => setError('Failed to load spreadsheets'))
      .finally(() => setLoading(false));
  }, [uid]);

  const handleConnect = async (sheet: SheetInfo) => {
    setConnectingId(sheet.id);
    setConnectingName(sheet.name);
    try {
      if (!firebaseDb) throw new Error('Firebase not configured');
      const dsId = `gs_${sheet.id}_${Date.now()}`;

      // Create data source doc
      await setDoc(doc(firebaseDb, 'users', uid, 'dataSources', dsId), {
        id: dsId, name: sheet.name, type: 'google-sheets', status: 'syncing' as const,
        createdAt: Date.now(), updatedAt: Date.now(), spreadsheetId: sheet.id,
      });

      // Sync rows
      await fetch('/api/auth/google-sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, spreadsheetId: sheet.id, name: sheet.name }),
      });

      await setDoc(doc(firebaseDb, 'users', uid, 'dataSources', dsId), {
        status: 'connected' as const, updatedAt: Date.now(),
      }, { merge: true });

      router.push(`/connections?oauth=success&spreadsheetId=${encodeURIComponent(sheet.id)}&name=${encodeURIComponent(sheet.name)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnectingId(null);
      setConnectingName('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1">
        ← Back
      </button>

      <div>
        <h2 className="text-xl font-semibold text-white">Choose a Google Sheet</h2>
        <p className="mt-1 text-sm text-slate-400">Select which spreadsheet to connect.</p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      {spreadsheets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-white/[0.02] px-6 py-12 text-center">
          <p className="text-sm text-slate-500">No spreadsheets found.</p>
          <p className="text-xs text-slate-600 mt-1">Make sure you have at least one Google Sheet and that the Google Drive API is enabled on your Cloud project.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {spreadsheets.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => handleConnect(sheet)}
              disabled={connectingId !== null}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-5 py-5 text-left transition-all hover:border-brand-500/30 hover:bg-brand-500/5 disabled:opacity-50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#E8A800"><path d="M3.13 3.69C2.62 3.24 2.37 2.58 2.62 2.02s.9-9.28 9.57-9.28h-.52c1.94 0 3.56 1.54 3.56 3.56v.52c0 .55.45 1 1 1s1-.45 1-1V.17c0-2.02 1.61-3.56 3.56-3.56h-.52C20.93-8.6 12.63-.62 12.63 1.34v20.07c0 .55-.45 1-1 1s-1-.45-1-1V1.34c0-1.96-1.62-3.5-3.56-3.5h.52c-8.67 0-9.06 8.35-8.39 9.74z"/></svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{sheet.name || 'Untitled'}</p>
                <p className="text-xs text-slate-500">{sheet.id.slice(0, 12)}…</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {connectingId && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-500/20 bg-brand-500/8 px-5 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          <p className="text-sm text-brand-300">Connecting &ldquo;{connectingName}&rdquo;…</p>
        </div>
      )}
    </div>
  );
}
