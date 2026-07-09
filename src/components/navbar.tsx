import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="28" height="28" rx="7" fill="url(#nav-logo)" />
            <path d="M8 10h4l3 6 3-6h4" stroke="#0a0e1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="nav-logo" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#338dfc" />
                <stop offset="1" stopColor="#59b1ff" />
              </linearGradient>
            </defs>
          </svg>
          DataRola
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="#how-it-works" className="text-sm text-slate-400 transition-colors hover:text-white">How it works</Link>
          <Link href="#features" className="text-sm text-slate-400 transition-colors hover:text-white">Features</Link>
          <Link href="#pricing" className="text-sm text-slate-400 transition-colors hover:text-white">Pricing</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden rounded-lg px-4 py-2 text-sm text-slate-300 transition-colors hover:text-white md:block">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-500"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
