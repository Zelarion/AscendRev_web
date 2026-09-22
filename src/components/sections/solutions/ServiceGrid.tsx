import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { WordReveal } from '@/components/motion';
import Stagger from '@/components/ui/Stagger';
import { solutions } from '@/content/solutions';
import { stateTransitionStyle } from '@/lib/motion';

/**
 * The eight-function grid (SPEC.md §4.2, item 2).
 *
 * This is the one place on the site where an identical card grid is the honest
 * affordance: eight peer services, no ranking between them, each one a thing
 * the reader might be shopping for. DESIGN.md §3 still constrains how the card
 * looks, 1px border, 10px radius, no shadow, generous padding, and forbids
 * nesting anything card-shaped inside it. A card here is a heading and a
 * paragraph, nothing else.
 *
 * The layout is intentionally 1 column on mobile and 2 columns from tablet
 * through desktop, so the eight services resolve into a clean 2 × 4 editorial grid.
 */
export default function ServiceGrid(): JSX.Element {
  const { heading, intro, items } = solutions.services;

  return (
    <Section>
      <Container>
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
        <WordReveal as="h2" className="max-w-[24ch] font-display text-h2">
          {heading}
        </WordReveal>

        <p className="mt-6 max-w-[68ch] text-body-lg text-[var(--ink-muted)]">{intro}</p>

        <Stagger className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              // Hover deepens the hairline and lifts the card 2px (DESIGN.md
              // §4). No shadow bloom, and the transform is dropped under
              // reduced motion so the border still answers the pointer while
              // nothing travels.
              className="rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-8 transition-[transform,border-color] hover:-translate-y-[2px] hover:border-[var(--border-strong)] motion-reduce:hover:translate-y-0"
              style={stateTransitionStyle}
            >
              <h3 className="text-h3 text-[var(--ink)]">{item.title}</h3>
              <p className="mt-3 text-body text-[var(--ink-muted)]">{item.body}</p>
            </article>
          ))}
        </Stagger>
      </Container>
    </Section>
  );
}
