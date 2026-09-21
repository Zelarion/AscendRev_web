import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { solutions } from '@/content/solutions';

/**
 * Compact navy hero for `/solutions` (SPEC.md §4.2, item 1).
 *
 * Deliberately static. It sits above the fold, so every scroll primitive in
 * this codebase would skip it anyway (`isBelowRevealLine`), and DESIGN.md
 * reserves the dramatic entrance for the homepage hero. An interior hero that
 * animates on load competes with the page it is introducing.
 *
 * `size="default"` rather than `size="large"`: "compact" in the spec means the
 * standard band rhythm, not the hero rhythm the homepage uses.
 */
export default function SolutionsHero(): JSX.Element {
  const { headline, subheadline } = solutions.hero;

  return (
    <Section tone="navy">
      <Container>
        {/* 22ch lands this 62-character headline on three lines at the display
            ceiling and two lines below it, which is what keeps the band
            compact. `text-wrap: balance` (globals.css) evens the rag. */}
        <h1 className="max-w-[22ch] font-display text-h1 text-white">{headline}</h1>
        <p className="mt-8 max-w-[58ch] text-body-lg text-[var(--steel-400)]">{subheadline}</p>
      </Container>
    </Section>
  );
}
