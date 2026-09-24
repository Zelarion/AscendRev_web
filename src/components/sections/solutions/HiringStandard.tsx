import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Stagger from '@/components/ui/Stagger';
import { solutions } from '@/content/solutions';

/**
 * "We employ Premium and Experienced Career Professionals, Not
 * Clock-Punchers." (SPEC.md §4.2, item 3).
 *
 * Client revision, 2026-09-24: the former explanatory paragraph under the
 * heading is deleted, not replaced, per the client's instruction. What
 * was a two-column "what we hire for / how we screen" sheet is now this
 * section (heading + a "Team Capability" label block) plus a separate
 * screening section (`Screening.tsx`) with its own heading, matching the
 * client's brief, which gives the two blocks distinct headings.
 *
 * Tracked mono label kept from the previous version of this section: genuine
 * labels naming what the list below is, which is the case DESIGN.md §2
 * permits the style for.
 */
const COLUMN_LABEL =
  'font-mono text-small font-medium uppercase tracking-[0.3em] text-[var(--ink)]';

export default function HiringStandard(): JSX.Element {
  const { heading, capability } = solutions.hiring;

  return (
    <Section>
      <Container>
        <h2 className="max-w-[20ch] font-display text-h2 text-[var(--ink)]">{heading}</h2>

        <div className="mt-9 sm:mt-12">
          <h3 className={COLUMN_LABEL}>{capability.heading}</h3>
          {/* Every row carries a top hairline including the first, so the
              group reads as a set with a rule above it rather than rows that
              happen to be separated. */}
          <Stagger className="mt-5 grid gap-x-8 sm:mt-7 md:grid-cols-2 md:gap-x-10 lg:gap-x-12">
            {capability.items.map((item) => (
              <p
                key={item}
                className="border-t border-[var(--border)] py-4 text-body text-[var(--ink-muted)] sm:py-5"
              >
                {item}
              </p>
            ))}
          </Stagger>
        </div>
      </Container>
    </Section>
  );
}
