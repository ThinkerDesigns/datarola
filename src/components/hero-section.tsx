import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative min-h-[95vh] flex items-center justify-center bg-grid">
      {/* Radial gradient overlay */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-b from-brand-600/20 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center pt-24">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          Now in private beta — connect your first data source in 60 seconds
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-semibold tracking-tight leading-[1.1] sm:text-5xl md:text-6xl">
          Your team&apos;s data analyst,
          <br />
          <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-brand-500 bg-clip-text text-transparent animate-gradient">
            running on AI.
          </span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
          Connect your spreadsheets, databases, and warehouses. Ask business questions in plain English. Get instant answers, charts, and proactive anomaly alerts — no SQL required.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/app"
            className="w-full sm:w-auto rounded-xl bg-brand-600 px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-brand-600/20 transition-all hover:bg-brand-500 hover:shadow-brand-500/30 sm:text-lg"
          >
            Start for free →
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto rounded-xl border border-slate-700 px-8 py-3.5 text-base font-medium text-slate-300 transition-all hover:border-slate-500 hover:text-white sm:text-lg"
          >
            See how it works
          </a>
        </div>

        {/* Trust row */}
        <p className="mt-12 text-xs uppercase tracking-widest text-slate-600">
          Works with your tools
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
          {['Google Sheets', 'Excel', 'CSV', 'BigQuery', 'Snowflake', 'PostgreSQL', 'MySQL', 'Airtable'].map(
            (tool) => (
              <span key={tool} className="transition-colors hover:text-slate-300">
                {tool}
              </span>
            ),
          )}
        </div>

        {/* Mock dashboard preview */}
        <div className="mt-16 mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-2 glow-brand">
          <div className="rounded-xl border border-white/5 bg-black/80">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <div className="ml-4 flex-1 rounded-md bg-white/5 px-3 py-1 text-xs text-slate-500">
                app.datarola.com/dashboard
              </div>
            </div>
            {/* Fake dashboard content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-slate-700/50" />
                <div className="h-7 w-28 rounded-lg bg-brand-600/30" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-2">
                    <div className="h-3 w-16 rounded bg-slate-700/40" />
                    <div className="h-5 w-20 rounded bg-slate-600/40" />
                    <div className="h-2 w-full rounded bg-brand-500/20" />
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] h-36 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="h-3 w-48 mx-auto rounded bg-slate-700/30" />
                  <div className="h-3 w-36 mx-auto rounded bg-slate-700/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
