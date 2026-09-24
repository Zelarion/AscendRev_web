import type { JSX } from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Reveal from '@/components/ui/Reveal';
import { solutions } from '@/content/solutions';

/**
 * Closing band for `/solutions` (SPEC.md §4.2, item 4), on the page's white
 * surface with semantic dark ink.
 *
 * The background photo this band used to carry was hotlinked from a
 * third-party stock photo host, an external dependency the client does not
 * want. No client-supplied replacement photo exists, so the band uses the
 * page's solid semantic surface rather than an invented image.
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
    <Section size="large">
      <Container>
        <Reveal>
          <h2 className="max-w-[22ch] font-display text-h2 text-[var(--ink)]">{heading}</h2>
          <p className="mt-6 max-w-[62ch] text-body-lg text-[var(--ink-muted)]">{body}</p>
          <div className="mt-10">
            <Button
              href={cta.href}
              size="lg"
              className="border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.2)] transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_28px_rgba(197,151,49,0.28)] active:translate-y-0"
            >
              {cta.label}
            </Button>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
