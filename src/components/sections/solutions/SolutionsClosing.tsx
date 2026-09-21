import type { JSX } from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Reveal from '@/components/ui/Reveal';
import { solutions } from '@/content/solutions';

/**
 * Closing navy band for `/solutions` (SPEC.md §4.2, item 4).
 *
 * Duplicated rather than shared with the Advantage closing band: this pass owns
 * `sections/solutions/**` and `sections/advantage/**` only, and
 * `sections/shared/` is assigned to the concurrent homepage builder. Two near
 * identical files is the honest cost of that boundary, and consolidating them
 * is a deliberate later pass, not something to do by reaching across it.
 *
 * Left aligned rather than centred, matching every other band on the site.
 */
export default function SolutionsClosing(): JSX.Element {
  const { heading, body, cta } = solutions.closing;

  return (
    <Section tone="navy" size="large">
      <Container>
        <Reveal>
          <h2 className="max-w-[22ch] font-display text-h2 text-white">{heading}</h2>
          <p className="mt-6 max-w-[62ch] text-body-lg text-[var(--steel-400)]">{body}</p>
          <div className="mt-10">
            <Button href={cta.href} size="lg">
              {cta.label}
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
