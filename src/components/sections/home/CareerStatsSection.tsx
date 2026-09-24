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
      className="border-t border-[var(--line)] bg-[var(--surface)] px-[clamp(1.25rem,5vw,4rem)] py-12 sm:py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--green-600)]">
            Rio Vidal
          </p>
          <h2
            id="career-stats-heading"
            className="mt-3 font-display text-[clamp(2rem,4vw,3.5rem)] leading-[1.08] text-[var(--navy-800)]"
          >
            {advantage.leadership.recordHeading}
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          <article className="bg-[var(--surface)] p-5 sm:col-span-2 sm:p-7 xl:col-span-1">
            <p className="font-display text-4xl leading-none text-[var(--navy-800)] sm:text-5xl">
              <CountUp value={1} prefix="Over 1BCAD Revenue generated throughout his career" />
            </p>
            <h3 className="mt-5 text-sm font-semibold text-[var(--text-primary)]">
              B2B revenue generated
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Over CAD$1B across his career.
            </p>
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

        {/* <p className="mt-5 max-w-3xl text-xs leading-5 text-[var(--text-muted)]">
          {advantage.leadership.attribution}
        </p> */}
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
    <article className="bg-[var(--surface)] p-6 sm:p-8">
      <p className="font-display text-[clamp(2.15rem,6vw,3rem)] leading-none text-[var(--navy-800)]">
        {number}
      </p>
      <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)] sm:mt-5">
        {label}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
        {stat.description}
      </p>
    </article>
  );
}
