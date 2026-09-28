import type { ReactNode } from 'react';
import { CountUp } from '@/components/motion';
import { advantage } from '@/content/advantage';

/**
 * Rio Vidal's career metrics, surfaced near the end of the home page.
 * The rendered values are present in the HTML before JavaScript runs; CountUp
 * only animates the three single values when they enter the viewport.
 */
export default function CareerStatsSection() {
  const [presidentsClub, dollarRecognition, dealsAnnually] =
    advantage.leadership.commercialStats;
  if (!presidentsClub || !dollarRecognition || !dealsAnnually) return null;

  return (
    <section
      aria-labelledby="career-stats-heading"
      className="border-y border-white/10 bg-[var(--navy-900)] px-[var(--site-gutter)] py-[clamp(3.5rem,8vw,6.5rem)] text-white"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-2xl">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold-300)]">
            Rio Vidal | Co-Founder and President
          </p>
          <h2
            id="career-stats-heading"
            className="mt-3 font-display text-h2 text-white"
          >
            {advantage.leadership.recordHeading}
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-px bg-white/20 sm:grid-cols-2 xl:grid-cols-4">
          <article className="bg-[var(--navy-900)] p-5 sm:p-6 lg:p-7 xl:p-6 2xl:p-8">
            <p className="ar-type-career-stat font-display text-[var(--gold-300)]">
              <CountUp value={1} prefix="CAD $" suffix="B+" />
            </p>
            <h3 className="mt-4 min-h-[2.6em] font-display text-h3 leading-tight text-white sm:mt-5">
              Revenue generated
            </h3>
          </article>

          <MetricCard
            stat={presidentsClub}
            number={<CountUp value={2} suffix="X" />}
          />
          <MetricCard
            stat={dollarRecognition}
            number={<CountUp value={100} prefix="$" suffix="M+" />}
          />
          <MetricCard
            stat={dealsAnnually}
            number={
              <span className="inline-flex items-baseline gap-[0.12em]">
                <CountUp value={60} />
                <span aria-hidden="true">–</span>
                <CountUp value={80} />
              </span>
            }
          />
        </div>

      </div>
    </section>
  );
}

function MetricCard({
  stat,
  number,
}: {
  stat: (typeof advantage.leadership.commercialStats)[number];
  number: ReactNode;
}) {
  const label = stat.label.replace(/^\S+\s+/, '');

  return (
    <article className="bg-[var(--navy-900)] p-5 sm:p-6 lg:p-7 xl:p-6 2xl:p-8">
      <p className="ar-type-career-stat font-display text-[var(--gold-300)]">
        {number}
      </p>
      <h3 className="mt-4 min-h-[2.6em] font-display text-h3 leading-tight text-white sm:mt-5">
        {label}
      </h3>
      <p className="mt-2 font-sans text-sm leading-6 text-white/75">
        {stat.description}
      </p>
    </article>
  );
}
