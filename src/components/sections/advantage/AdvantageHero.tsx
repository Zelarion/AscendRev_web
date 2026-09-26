import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { advantage } from '@/content/advantage';

/**
 * Compact navy hero for `/advantage` (SPEC.md §4.3, item 1).
 *
 * Static for the same reason as the Solutions hero: it is above the fold, so
 * the scroll primitives skip it by design, and the load entrance belongs to
 * the homepage. Duplicated from the Solutions hero rather than shared, because
 * `sections/shared/` is another builder's file in this pass.
 */
export default function AdvantageHero(): JSX.Element {
  const { headline, subheadline } = advantage.hero;

  return (
    <Section
      tone="light"
      className="!pt-[calc(var(--header-height)+2.5rem)] !pb-[clamp(2rem,4vw,3rem)] lg:!pt-[calc(var(--header-height)+3rem)]"
    >
      <Container>
        <h1 className="font-display text-h1 text-[var(--navy-900)] lg:whitespace-nowrap">{headline}</h1>
        <p className="mt-4 max-w-[58ch] text-body-lg text-[var(--steel-400)] lg:max-w-none">{subheadline}</p>
      </Container>
    </Section>
  );
}
