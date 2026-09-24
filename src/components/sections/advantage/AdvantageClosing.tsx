import type { JSX } from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Reveal from '@/components/ui/Reveal';
import { advantage } from '@/content/advantage';

/**
 * Closing navy band for `/advantage` (SPEC.md §4.3, item 4).
 *
 * Structurally identical to the Solutions closing band and duplicated on
 * purpose: `sections/shared/` is owned by the concurrent homepage builder in
 * this pass, so the two live side by side until a consolidation pass can lift
 * them deliberately.
 */
export default function AdvantageClosing(): JSX.Element {
  const { heading, body, cta } = advantage.closing;

  return (
    <Section tone="light" size="large">
      <Container>
        <Reveal>
          <h2 className="max-w-[22ch] font-display text-h2 text-[var(--navy-900)]">{heading}</h2>
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
