'use client';

import { useState } from 'react';
import { runQuery } from '@/lib/actions';
import { useAuth } from '@/lib/auth-context';

export function ChatInput() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await runQuery(user?.uid ?? 'dev-user-001', query);

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

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-4">
      {/* Mock previous conversation */}
      <div className="space-y-3 mb-4">
        <div className="flex gap-3">
          <div className="h-6 w-6 shrink-0 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-medium text-white">A</div>
          <div className="rounded-lg bg-white/[0.05] px-3 py-2 text-sm text-slate-300 max-w-xl">
            Show me revenue by product category for last month
          </div>
        </div>

        {/* AI response with real data */}
        {result && !error && (
          <div className="flex gap-3">
            <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-medium text-white">AI</div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-slate-300 max-w-xl space-y-1.5">
              <p>Here&apos;s what the data shows:</p>
              {(result as any).sql && (
                <div className="rounded bg-black/20 px-2 py-1 font-mono text-xs text-slate-400">{(result as any).sql}</div>
              )}
              {(result as any).values && Array.isArray((result as any).values) && (result as any).values.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/5">
                      {Array.isArray((result as any).columns) && (result as any).columns.map((c: string, i: number) => (
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

      {/* Input */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder='Ask a question, e.g. "Why did revenue drop last Tuesday?"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!query.trim() || loading}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white transition-all disabled:opacity-30 hover:bg-brand-500">
          {loading ? 'Analyzing…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
