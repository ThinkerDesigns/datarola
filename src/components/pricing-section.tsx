import Link from 'next/link';

const tiers = [
  {
    name: 'Free',
    desc: 'For individuals exploring the tool.',
    price: '$0',
    period: 'forever',
    features: ['1 connected data source', '20 queries / month', 'Basic anomaly detection', 'Email alerts', 'Text-to-SQL with Ollama'],
    cta: 'Start free',
    href: '/app',
    highlighted: false,
  },
  {
    name: 'Paid',
    desc: 'For teams that need more power.',
    price: 'TBD',
    period: 'per month',
    features: [
      'Unlimited data sources',
      'Unlimited queries',
      'Advanced anomaly detection',
      'Scheduled reports (daily / weekly)',
      'Proactive insight agent',
      'Email + Slack / Teams alerts',
      'Team collaboration',
      'Priority support',
    ],
    cta: 'Join waitlist',
    href: '#',
    highlighted: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Simple pricing that scales with you
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Start free. Upgrade when your team needs it. Pricing finalized during testing phase.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.highlighted
                  ? 'border-brand-500/40 bg-gradient-to-b from-brand-500/[0.08] to-transparent glow-brand'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-medium text-white">
                  Recommended
                </span>
              )}

              <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{tier.desc}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-sm text-slate-500">/{tier.period}</span>
              </div>

              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5 text-brand-400">
                      <path d="M4 9l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`mt-8 block text-center rounded-xl px-6 py-3 text-sm font-medium transition-all ${
                  tier.highlighted
                    ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/20'
                    : 'border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Stripe-powered checkout. Cancel anytime. All features listed for Paid tier confirmed during testing.
        </p>
      </div>
    </section>
  );
}
