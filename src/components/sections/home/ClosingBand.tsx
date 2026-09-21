import type { JSX } from 'react';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import type { ClosingBandContent } from '@/content/home';

interface ClosingBandProps {
  content: ClosingBandContent;
}

/**
 * The closing band, on navy, at the hero's vertical rhythm.
 *
 * HOW IT KEEPS ITS DISTANCE FROM THE SECTION ABOVE IT
 *
 * DESIGN.md §1 puts the hero, the proof band, the closing CTA and the footer
 * on navy, which means this band, the industries section above it and the
 * footer below it are three navy surfaces in a row. Colour cannot do the
 * separating, so density does: the industries section is the densest thing on
 * the page (a tab strip, five panels, two lists each), and this is the
 * emptiest (one sentence at display size and a single button). The drop in
 * information per square inch is what tells the reader the argument is over.
 *
 * It is also the page's only single-column section. Everything above it is
 * some kind of two-column split, so the full-measure heading reads as a change
 * of register rather than as one more row.
 */
export default function ClosingBand({ content }: ClosingBandProps): JSX.Element {
  return (
    <Section
      tone="navy"
      size="large"
      // Measured: the industries band contributes 128px of bottom padding and
      // this band's "large" rhythm contributes 176px of top padding. Between
      // two bands of DIFFERENT tone that doubling is invisible, because the
      // colour change marks the boundary. Between two navy bands it is 304px
      // of empty navy with a hairline stranded in the middle of it. The top
      // padding is cut here and the bottom padding left alone, so the air sits
      // where it does work rather than where two sections happen to meet.
      className="border-t border-[var(--border-navy)] pt-[clamp(4rem,8vw,7rem)]"
    >
      <Container>
        <RevealOnScroll>
          {/* Short measure on purpose: the heading breaks into two or three
              lines of display serif, which is the whole visual event here. */}
          <h2 className="max-w-[18ch] font-display text-display text-white">{content.heading}</h2>
        </RevealOnScroll>

        <RevealOnScroll
          delayMs={80}
          className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
        >
          <p className="max-w-[54ch] text-body-lg text-white/86">{content.body}</p>
          {/* `shrink-0` keeps the label on one line once the row goes
              horizontal; a wrapped CTA is a broken CTA. */}
          <div className="shrink-0">
            <Button href={content.cta.href} variant="primary" size="lg">
              {content.cta.label}
            </Button>
          </div>
        </RevealOnScroll>
      </Container>
    </Section>
  );
}
