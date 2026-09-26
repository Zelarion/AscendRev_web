import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Stagger from '@/components/ui/Stagger';
import { solutions } from '@/content/solutions';
import GlyphIcon, { GLYPH_ACCENT_CYCLE } from './GlyphIcon';

/**
 * "How we screen our Team members" (SPEC.md §4.2, item 4).
 *
 * Client revision, 2026-09-24: split out of the old combined
 * hiring/screening block (`HiringStandard.tsx`) because the client's brief
 * gives this its own heading and its own six icon-plus-label steps, the same
 * subtle line-icon-in-geometric-container treatment as the nine-service grid.
 *
 * The blueprint CTA now sits beneath the solutions closing headline.
 */
export default function Screening(): JSX.Element {
  const { heading, items } = solutions.screening;

  return (
    <Section className="lg:!py-16">
      <Container>
        <h2 className="max-w-none font-display text-h2 text-[var(--ink)] lg:whitespace-nowrap">{heading}</h2>

        <Stagger className="mt-8 grid gap-3 sm:mt-12 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex min-h-[76px] items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:min-h-[88px] sm:gap-4 sm:p-5"
            >
              <GlyphIcon
                glyph={item.glyph}
                accent={GLYPH_ACCENT_CYCLE[index % GLYPH_ACCENT_CYCLE.length]}
              />
              <p className="text-body font-medium text-[var(--ink)]">{item.label}</p>
            </div>
          ))}
        </Stagger>

      </Container>
    </Section>
  );
}
