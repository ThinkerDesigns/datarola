'use client';

import { ChatInput } from './chat-input';
import { KpiCard } from './kpi-card';
import { AnomalyCard } from './anomaly-card';

const kpis = [
  { label: 'Revenue (MTD)', value: '$128,450', change: '+12.3%', up: true },
  { label: 'Active Users', value: '4,891', change: '+5.7%', up: true },
  { label: 'Churn Rate', value: '2.1%', change: '-0.4%', up: false },
];

const anomalies = [
  {
    metric: 'Daily Revenue',
    severity: 'critical' as const,
    message: 'Revenue dropped 34% compared to the same day last week. Most affected category: subscriptions.',
    time: '2 hours ago',
  },
  {
    metric: 'Sign-up Velocity',
    severity: 'warning' as const,
    message: 'New signups trending 18% below baseline for this weekday pattern.',
    time: '5 hours ago',
  },
];

export function DashboardView() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          Connected to <span className="text-brand-400">Google Sheets — Q2 Revenue</span> and{' '}
          <span className="text-brand-400">BigQuery — Analytics</span>
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Chart area + anomalies */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <h3 className="text-sm font-medium text-slate-300">Revenue Trend</h3>
          <div className="mt-4 flex h-[260px] items-end gap-1.5">
            {Array.from({ length: 30 }, (_, i) => {
              const h = 30 + Math.random() * 70;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-brand-600/40 to-brand-500/20 transition-all hover:from-brand-500/50 hover:to-brand-400/30"
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Anomaly alerts */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-300">Recent Anomalies</h3>
          {anomalies.map((a, i) => (
            <AnomalyCard key={i} {...a} />
          ))}
        </div>
      </div>

      {/* Chat */}
      <ChatInput />
    </div>
  );
}
