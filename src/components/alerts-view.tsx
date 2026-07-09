'use client';

interface Alert {
  id: string;
  metric: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  acknowledged: boolean;
}

const alerts: Alert[] = [
  { id: '1', metric: 'Daily Revenue', severity: 'critical', message: 'Revenue dropped 34% vs. same day last week. Most affected: subscription renewals.', time: '2h ago', acknowledged: false },
  { id: '2', metric: 'Sign-up Velocity', severity: 'warning', message: 'New signups 18% below weekday baseline. Pattern holds for 3 consecutive days.', time: '5h ago', acknowledged: false },
  { id: '3', metric: 'Support Ticket Volume', severity: 'info', message: 'Ticket volume up 22% — correlated with v2.4 release. Mostly login issues resolving naturally.', time: '8h ago', acknowledged: true },
  { id: '4', metric: 'API Error Rate', severity: 'warning', message: '5xx errors at 1.2% for 45 min window. Auto-resolved after scaling.', time: '1d ago', acknowledged: true },
];

const severityConfig = {
  critical: { bg: 'bg-red-500/8', border: 'border-red-500/15', label: 'Critical' },
  warning: { bg: 'bg-yellow-500/8', border: 'border-yellow-500/15', label: 'Warning' },
  info: { bg: 'bg-blue-500/8', border: 'border-blue-500/15', label: 'Info' },
};

export function AlertsView() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Alert History</h1>
          <p className="mt-0.5 text-sm text-slate-400">Anomaly detections and proactive insight flags.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full border border-white/10 px-2 py-1">Unread: 2</span>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const sc = severityConfig[alert.severity];
          return (
            <div key={alert.id} className={`rounded-xl border ${sc.border} ${sc.bg} px-5 py-4 flex items-start gap-4`}>
              <div className="shrink-0 mt-0.5">
                {alert.severity === 'critical' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-400"><path d="M12 9v4m-2.5 2h5M10.3 21a3.36 3.36 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : alert.severity === 'warning' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-yellow-400"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 0 2.5-2H9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" /><path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{alert.metric}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>{sc.label}</span>
                  {alert.acknowledged && <span className="text-[11px] text-slate-500">Acknowledged</span>}
                </div>
                <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-600">{alert.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
