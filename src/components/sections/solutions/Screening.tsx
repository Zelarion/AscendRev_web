import type { JSX } from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Reveal from '@/components/ui/Reveal';
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
 * The CTA remains at the end of the hiring/screening flow, directly above
 * the closing band.
 */
export default function Screening(): JSX.Element {
  const { heading, items, cta } = solutions.screening;

  return (
    <Section>
      <Container>
        <h2 className="max-w-[20ch] font-display text-h2 text-[var(--ink)]">{heading}</h2>

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

        <Reveal className="mt-10 flex flex-col gap-6 border-t border-[var(--border)] pt-7 sm:mt-14 sm:gap-8 sm:pt-9 md:flex-row md:items-center md:justify-between md:gap-12">
          <Button
            href={cta.href}
            size="lg"
            className="self-start border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.2)] transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_28px_rgba(197,151,49,0.28)] active:translate-y-0 md:self-auto"
          >
            {cta.label}
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}
