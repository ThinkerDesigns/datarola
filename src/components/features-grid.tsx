import { ConnectIcon, AskIcon } from '@/components/icons';

const features = [
  {
    title: 'Text-to-SQL',
    desc: 'Describe what you need in plain English. DataRola generates the right query and runs it against your connected data.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'Anomaly Detection',
    desc: 'Always-on monitoring that flags revenue drops, churn spikes, and inventory issues before they become problems.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
      </svg>
    ),
  },
  {
    title: 'Natural Language Answers',
    desc: "Every query result comes with a plain-English summary. No raw tables dumped on your lap — just the insight you need.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        <path d="M7 10h4" /><path d="M7 14h10" />
      </svg>
    ),
  },
  {
    title: 'Chat Interface',
    desc: 'Follow up, drill down, compare periods — all in a conversational UI. Like talking to your best analyst.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    ),
  },
  {
    title: 'Ollama + Anthropic Toggle',
    desc: 'Run locally via Ollama for zero-cost testing, or switch to Anthropic API for production-grade accuracy.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" /><path d="M12 17v4" />
      </svg>
    ),
  },
  {
    title: 'Connect Any Source',
    desc: 'Google Sheets, Excel, CSV, BigQuery, Snowflake, Redshift, PostgreSQL, MySQL — plus CRMs like HubSpot and Salesforce coming soon.',
    icon: <ConnectIcon />,
  },
  {
    title: 'Proactive Alerts',
    desc: 'Email (soon Slack/Teams) alerts when something needs attention. Get useful insights without ever typing a query.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a3.36 3.36 0 0 0 3.4 0" />
      </svg>
    ),
  },
  {
    title: 'Firebase Backend',
    desc: 'Auth, Firestore, Storage, and Cloud Functions — fast to iterate, generous free tier for the testing phase.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Built for small teams that move fast and need data without the overhead.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/5 bg-white/[0.01] p-6 transition-all hover:border-brand-500/30 hover:bg-brand-500/[0.04]"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                {f.icon}
              </div>
              <h3 className="text-base font-medium text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
