import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="7" fill="url(#foot-logo)" />
                <path d="M8 10h4l3 6 3-6h4" stroke="#0a0e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="foot-logo" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="#338dfc" /><stop offset="1" stopColor="#59b1ff" />
                  </linearGradient>
                </defs>
              </svg>
              DataRola
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              AI-powered data analyst for small teams. Connect your data, ask questions, get insights.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="#how-it-works" className="hover:text-slate-300">How it works</Link></li>
              <li><Link href="#features" className="hover:text-slate-300">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-slate-300">Pricing</Link></li>
              <li><Link href="/app" className="hover:text-slate-300">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Connectors</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Google Sheets</li>
              <li>BigQuery</li>
              <li>Snowflake</li>
              <li>PostgreSQL / MySQL</li>
              <li>Airtable</li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="mailto:support@datarola.com" className="hover:text-slate-300">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} DataRola. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
