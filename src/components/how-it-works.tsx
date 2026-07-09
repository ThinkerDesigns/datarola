import { ConnectIcon, AskIcon, AnswerIcon } from '@/components/icons';

const steps = [
  {
    icon: <ConnectIcon />,
    title: 'Connect your data',
    desc: 'Link Google Sheets, Excel files, CSVs, or any database — BigQuery, Snowflake, PostgreSQL, MySQL, Airtable — in one click.',
  },
  {
    icon: <AskIcon />,
    title: 'Ask questions in plain English',
    desc: 'No SQL. No dashboards to configure. Just type what you want to know, like "Why did revenue drop last Tuesday?"',
  },
  {
    icon: <AnswerIcon />,
    title: 'Get answers + proactive alerts',
    desc: 'Instant summaries, charts, and anomaly flags — before you even have to ask. DataRola watches your data so you don&apos;t have to.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Three steps to your first insight
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            From connected data to actionable answer in under a minute.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-brand-500/30 hover:bg-brand-500/[0.03]">
              {/* Step number */}
              <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {i + 1}
              </span>

              <div className="mt-2 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                {step.icon}
              </div>

              <h3 className="text-lg font-medium text-white">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Arrow connectors between steps */}
        <div className="hidden md:block relative -mx-8">
          <div className="absolute top-[130px] left-[25%] w-1/6 border-t-2 border-dashed border-slate-700 rotate-[30deg] origin-bottom-left" />
          <div className="absolute top-[130px] right-[25%] w-1/6 border-t-2 border-dashed border-slate-700 -rotate-[30deg] origin-bottom-right" />
        </div>
      </div>
    </section>
  );
}
