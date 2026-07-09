'use client';

// Saved queries library — browse, restore, and delete saved queries.

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listSavedQueries, deleteSavedQuery } from '@/lib/saved-queries';
import type { SavedQuery } from '@/lib/saved-queries';

export function SavedQueriesView({ onRestore }: { onRestore: (question: string, sql?: string) => void }) {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    listSavedQueries(user.uid).then((q) => { setQueries(q); setLoading(false); });
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
  }

  if (queries.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-slate-500 text-sm">No saved queries yet.</p>
        <p className="text-slate-600 text-xs mt-1">Click "Save Query" on any query result to store it here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold text-white">Saved Queries</h2>
      {queries.map((q) => (
        <div key={q.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 group hover:border-white/10 transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{q.question}</p>
              {q.sql && (
                <pre className="mt-1.5 text-[10px] text-slate-500 font-mono overflow-x-auto max-h-12">{q.sql}</pre>
              )}
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-600">
                <span>{new Date(q.savedAt).toLocaleDateString()}</span>
                <span>{q.rowCount} rows</span>
                {q.columns && <span>{q.columns.length} cols</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onRestore(q.question, q.sql)}
                className="rounded bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500 transition-colors">
                Restore
              </button>
              <button onClick={() => deleteSavedQuery(user?.uid ?? '', q.id).then(() => listSavedQueries(user?.uid ?? '').then(setQueries))}
                className="rounded bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
