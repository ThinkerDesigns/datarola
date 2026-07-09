'use client';

import { useState } from 'react';

export function ChatInput() {
  const [query, setQuery] = useState('');

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
        <div className="flex gap-3">
          <div className="h-6 w-6 shrink-0 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-medium text-white">AI</div>
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-slate-300 max-w-xl space-y-1.5">
            <p>Here&apos;s the breakdown by category:</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-white/5">
                  <th className="text-left py-1 pr-4 font-normal">Category</th>
                  <th className="text-right py-1 pr-4 font-normal">Revenue</th>
                  <th className="text-right py-1 font-normal">% of Total</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                <tr className="border-b border-white/5"><td className="py-1 pr-4">Subscriptions</td><td className="py-1 pr-4 text-right">$67,200</td><td className="py-1 text-right">52.3%</td></tr>
                <tr className="border-b border-white/5"><td className="py-1 pr-4">One-time purchases</td><td className="py-1 pr-4 text-right">$38,900</td><td className="py-1 text-right">30.3%</td></tr>
                <tr><td className="py-1 pr-4">Add-ons & upgrades</td><td className="py-1 pr-4 text-right">$22,350</td><td className="py-1 text-right">17.4%</td></tr>
              </tbody>
            </table>
            <p className="text-slate-400 pt-1">Subscriptions lead at 52.3%, up 8% from last month. One-time purchases declined slightly.</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder='Ask a question, e.g. "Why did revenue drop last Tuesday?"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
        />
        <button
          disabled={!query.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white transition-all disabled:opacity-30 hover:bg-brand-500"
        >
          Send
        </button>
      </div>
    </div>
  );
}
