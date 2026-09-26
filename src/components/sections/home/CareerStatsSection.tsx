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
            Rio Vidal | Co-Founder and President
          </p>
          <h2
            id="career-stats-heading"
            className="mt-3 font-display text-h2 text-[var(--navy-800)]"
          >
            {advantage.leadership.recordHeading}
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          <article className="bg-[var(--surface)] p-6 sm:p-8">
            <p className="ar-type-career-stat font-display text-h2 text-[var(--navy-800)]">
              <CountUp value={1} prefix="Over CAD" suffix="B" />
            </p>
            <h3 className="mt-4 font-display text-h3 text-[var(--text-primary)] sm:mt-5">
              Revenue generated throughout his career
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
    <article className="bg-[var(--surface)] p-6 sm:p-8">
      <p className="ar-type-career-stat font-display text-h2 text-[var(--navy-800)]">
        {number}
      </p>
      <h3 className="mt-4 font-display text-h3 text-[var(--text-primary)] sm:mt-5">
        {label}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
        {stat.description}
      </p>
    </article>
  );
}
