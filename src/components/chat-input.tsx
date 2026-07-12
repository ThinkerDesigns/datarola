'use client';

import { useState, useEffect } from 'react';
import { runQuery } from '@/lib/actions';
import { useAuth } from '@/lib/auth-context';
import { ResultChart } from './result-chart';
import { downloadCSV } from '@/lib/csv-export';
import { saveQuery, listSavedQueries, deleteSavedQuery } from '@/lib/saved-queries';
import type { SavedQuery } from '@/lib/saved-queries';

interface ChatInputProps {
  restoreQuery?: { question: string; sql?: string } | null;
}

export function ChatInput({ restoreQuery }: ChatInputProps) {
  const [queryText, setQueryText] = useState(restoreQuery?.question ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const { user } = useAuth();

  // When restoreQuery prop changes, fill the input
  useEffect(() => {
    if (restoreQuery?.question) {
      setQueryText(restoreQuery.question);
    }
  }, [restoreQuery]);

  useEffect(() => {
    if (user && showSaved) {
      listSavedQueries(user.uid).then(setSavedQueries);
    }
  }, [user, showSaved]);

  // Find first numeric column index for chart export
  const numericColIdx = (() => {
    if (!result || !(result.columns as string[])) return -1;
    const vals = result.values as unknown[][];
    if (!vals?.length) return -1;
    for (let ci = 0; ci < (result.columns as string[]).length; ci++) {
      if (typeof (vals[0] as unknown[])[ci] === 'number') return ci;
    }
    return -1;
  })();

  const hasNumericData = numericColIdx >= 0;

  const handleSend = async () => {
    if (!queryText.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await runQuery(user?.uid ?? 'dev-user-001', queryText);

      if ((data as any).error) {
        setError((data as any).error as string);
      } else {
        setResult(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Query failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    await saveQuery(user.uid, {
      question: queryText,
      sql: (result as any).sql as string,
      columns: result.columns as string[],
      rowCount: (result as any).rowCount as number,
    });
    const updated = await listSavedQueries(user.uid);
    setSavedQueries(updated);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4 space-y-3">
      {/* Saved queries dropdown */}
      {showSaved && user && savedQueries.length > 0 && (
        <div className="space-y-2 pb-2 border-b border-white/5">
          <p className="text-xs text-slate-500">Your saved queries:</p>
          {savedQueries.map((q) => (
            <div key={q.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 group">
              <button onClick={() => {
                setQueryText(q.question);
                setShowSaved(false);
              }} className="text-sm text-slate-300 hover:text-white truncate flex-1 text-left">
                {q.question}
              </button>
              <button onClick={() => deleteSavedQuery(user.uid, q.id).then(() => listSavedQueries(user.uid).then(setSavedQueries))}
                className="ml-2 text-xs text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chat history — only shown when there are actual results */}
      <div className="space-y-3 mb-2">
        {result && (
          // User question — shown alongside result
          <div className="flex gap-3">
            <div className="h-6 w-6 shrink-0 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-medium text-white">Y</div>
            <div className="rounded-lg bg-white/[0.05] px-3 py-2 text-sm text-slate-300 max-w-xl">
              {queryText}
            </div>
          </div>
        )}

        {/* AI response with real data */}
        {result && !error && (
          <div className="flex gap-3">
            <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-medium text-white">AI</div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-slate-300 max-w-xl space-y-2 flex-1">
              <p>Here&apos;s what the data shows:</p>

              {/* Chart if numeric data */}
              {hasNumericData && result.columns && (
                <ResultChart
                  columns={result.columns as string[]}
                  values={result.values as unknown[][]}
                  numericColumnIndex={numericColIdx}
                />
              )}

              {(result as any).sql && (
                <div className="rounded bg-black/20 px-2 py-1 font-mono text-xs text-slate-400">{(result as any).sql}</div>
              )}
              {(result as any).values && Array.isArray((result as any).values) && (result as any).values.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/5">
                      {Array.isArray(result.columns) && result.columns.map((c: string, i: number) => (
                        <th key={i} className="text-left py-1 pr-4 font-normal">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    {(result as any).values.slice(0, 5).map((row: unknown[], ri: number) => (
                      <tr key={ri} className="border-b border-white/5">
                        {row.map((v: unknown, ci: number) => (
                          <td key={ci} className="py-1 pr-4">{v != null ? String(v) : '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-400">No results for this query.</p>
              )}
              {(result as any).rowCount != null && (
                <p className="text-[11px] text-slate-500 pt-1">{(result as any).rowCount} rows returned</p>
              )}

              {/* Action buttons */}
              {hasNumericData && result.columns && (
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <button onClick={() => downloadCSV(result.columns as string[], result.values as unknown[][], 'datarola-result')}
                    className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400 hover:bg-white/10 transition-colors">
                    ⬇ CSV
                  </button>
                  <button onClick={handleSave}
                    className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400 hover:bg-white/10 transition-colors">
                    ★ Save
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex gap-3">
            <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-medium text-white">AI</div>
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400 max-w-xl">{error}</div>
          </div>
        )}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder='Ask a question, e.g. "Why did revenue drop last Tuesday?"'
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
        <button onClick={() => setShowSaved((s) => !s)}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-all">
          Saved ({savedQueries.length})
        </button>
        <button
          onClick={handleSend}
          disabled={!queryText.trim() || loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white transition-all disabled:opacity-30 hover:bg-brand-500">
          {loading ? 'Analyzing…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
