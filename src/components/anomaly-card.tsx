interface AnomalyCardProps {
  metric: string;
  severity: 'critical' | 'warning';
  message: string;
  time: string;
}

export function AnomalyCard({ metric, severity, message, time }: AnomalyCardProps) {
  const colors = {
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500', text: 'text-red-400' },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-500', text: 'text-yellow-400' },
  };

  const c = colors[severity];

  return (
    <div className={`rounded-xl ${c.bg} border ${c.border} p-4`}>
      <div className="flex items-center gap-2">
        <span className={`${c.dot} h-2 w-2 rounded-full`} />
        <span className={`text-sm font-medium ${c.text}`}>{metric}</span>
        <span className="ml-auto text-[11px] text-slate-500">{time}</span>
      </div>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
    </div>
  );
}
