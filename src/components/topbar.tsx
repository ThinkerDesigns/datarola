'use client';

interface TopBarProps {
  modelProvider: 'ollama' | 'anthropic';
  onModelToggle: () => void;
}

export function TopBar({ modelProvider, onModelToggle }: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-white/5 bg-[#0d1117] px-6 py-3">
      {/* Model provider toggle */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium ${modelProvider === 'ollama' ? 'text-brand-400' : 'text-slate-500'}`}>Ollama</span>
        <button
          onClick={onModelToggle}
          className="relative h-[22px] w-[44px] rounded-full bg-slate-700 transition-colors hover:bg-slate-600"
          aria-label={`Switch to ${modelProvider === 'ollama' ? 'Anthropic' : 'Ollama'}`}
        >
          <span
            className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white transition-transform ${
              modelProvider === 'anthropic' ? 'translate-x-[22px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
        <span className={`text-xs font-medium ${modelProvider === 'anthropic' ? 'text-brand-400' : 'text-slate-500'}`}>
          Anthropic API
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Usage badge */}
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          <span>7 / 20 queries used</span>
        </div>

        {/* New connection button */}
        <button className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-brand-500">
          + New Query
        </button>
      </div>
    </header>
  );
}
