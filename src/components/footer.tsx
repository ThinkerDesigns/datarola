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
              <li><Link href="#" className="hover:text-slate-300">Blog</Link></li>
              <li><Link href="#" className="hover:text-slate-300">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-slate-300">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-slate-300">support@datarola.com</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} DataRola. All rights reserved. Testing / Pre-Alpha.
          </p>
          <div className="flex items-center gap-4">
            {/* Twitter/X */}
            <a href="#" aria-label="Twitter" className="text-slate-600 hover:text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" className="text-slate-600 hover:text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
