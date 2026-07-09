interface KpiCardProps {
  label: string;
  value: string;
  change: string;
  up: boolean;
}

export function KpiCard({ label, value, change, up }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={up ? 'text-emerald-400' : 'text-red-400'}>
          {up ? (
            <path d="M7 11V3M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M7 3v8m-3-5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        <span className={`text-sm font-medium ${up ? 'text-emerald-400' : 'text-red-400'}`}>{change}</span>
        <span className="text-xs text-slate-500">vs last month</span>
      </div>
    </div>
  );
}
