import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { WordReveal } from '@/components/motion';
import Stagger from '@/components/ui/Stagger';
import { solutions } from '@/content/solutions';
import { stateTransitionStyle } from '@/lib/motion';
import GlyphIcon, { GLYPH_ACCENT_CYCLE } from './GlyphIcon';

/**
 * The nine-function grid (SPEC.md §4.2, item 2).
 *
 * Client revision, 2026-09-24: the per-service description paragraph is
 * removed. A card here is now a small icon plus its label, nothing else, so
 * the grid runs 3-wide on desktop rather than the old 2-wide layout — a
 * tighter grid to match the shorter content, not a stretched-out list.
 * DESIGN.md §3's card rules (1px border, 10px radius, no shadow) still apply.
 */
export default function ServiceGrid(): JSX.Element {
  const { heading, intro, items } = solutions.services;

  return (
    <Section className="!pt-6 !pb-8">
      <Container className="max-w-none wide-nav:px-10">
        {/* The one word-by-word reveal on this page. It resolves under the
            reader's own scroll, which is the cause-and-effect DESIGN.md §4
            asks motion to express; used on every heading it would just be a
            page-wide tic. */}
        {/* No `text-[var(--ink)]` here. WordReveal passes className through
            `cn`, which runs tailwind-merge, and tailwind-merge cannot tell
            whether the arbitrary value in `text-[var(--ink)]` is a colour or a
            font size. It resolves the ambiguity by treating it as a font size
            and dropping `text-h2`, which silently renders the heading at body
            size. The colour is inherited from Section's light tone anyway, so
            the fix is to not ask for it twice. */}
        <WordReveal as="h2" className="max-w-none font-display text-h2 md:whitespace-nowrap">
          {heading}
        </WordReveal>

        <p className="mt-4 text-body-lg text-[var(--ink-muted)] sm:mt-6">
          {intro}
        </p>

        <Stagger className="mt-9 grid gap-3 sm:mt-12 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-5">
          {items.map((item, index) => (
            <article
              key={item.id}
              // Hover deepens the hairline (DESIGN.md §4). No shadow bloom.
              className="flex min-h-[76px] items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-[border-color] hover:border-[var(--border-strong)] sm:min-h-[88px] sm:gap-4 sm:p-5"
              style={stateTransitionStyle}
            >
              <GlyphIcon
                glyph={item.glyph}
                accent={GLYPH_ACCENT_CYCLE[index % GLYPH_ACCENT_CYCLE.length]}
              />
              <h3 className="text-body font-medium text-[var(--ink)] min-[115rem]:whitespace-nowrap">
                {item.label}
              </h3>
            </article>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
