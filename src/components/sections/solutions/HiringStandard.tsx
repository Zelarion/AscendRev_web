import type { JSX } from 'react';
import Section from '@/components/layout/Section';
import Stagger from '@/components/ui/Stagger';
import { solutions } from '@/content/solutions';

/**
 * "We employ Premium and Experienced Career Professionals, Not
 * Clock-Punchers." (SPEC.md §4.2, item 3).
 *
 * The heading, capability details and screening sequence share a left edge.
 * The page keeps candidate standards distinct from the screening steps below.
 */
const CAPABILITY_LABEL =
  'text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold-text)]';

export default function HiringStandard(): JSX.Element {
  const { heading, capability } = solutions.hiring;

  return (
    <Section className="!py-[clamp(3rem,6vw,5.5rem)]">
      <div className="mx-auto w-full max-w-[1540px] px-[clamp(1.25rem,5vw,5.5rem)]">
        <h2
          className="max-w-[34ch] text-left font-display text-h2 text-[var(--ink)]"
        >
          {heading}
        </h2>
        <p className="mt-4 max-w-[68ch] text-left text-body-lg text-[var(--ink-muted)]">
          {capability.intro}
        </p>

        <div className="mt-8 border-t border-[var(--border)] pt-5 sm:mt-10 sm:pt-6">
          <h3 className={CAPABILITY_LABEL}>{capability.heading}</h3>
          <Stagger className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:gap-5">
            {capability.items.map((item, index) => (
              <article
                key={item.title}
                className="flex min-h-32 items-start gap-4 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:min-h-36 sm:p-6"
              >
                <span aria-hidden="true" className="mt-0.5 font-mono text-[11px] tracking-[0.16em] text-[var(--gold-text)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h4 className="font-semibold text-[var(--ink)]">{item.title}</h4>
                  <p className="mt-2 text-body text-[var(--ink-muted)]">{item.detail}</p>
                </div>
              </article>
            ))}
          </Stagger>
        </div>
      </div>
    </Section>
  );
}
