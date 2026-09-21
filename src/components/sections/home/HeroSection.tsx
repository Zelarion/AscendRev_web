import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import HeroMedia from '@/components/sections/home/HeroMedia';
import {
  HERO_CTA_DELAY_MS,
  HERO_LINE_STAGGER_MS,
  HERO_SUPPORT_DELAY_MS,
} from '@/components/sections/shared/motionTokens';
import type { HeroContent } from '@/content/home';

interface HeroSectionProps {
  content: HeroContent;
}

/**
 * Splits the headline into the sentences it is already written as, so each one
 * can be masked and raised on its own.
 *
 * The approved headline is three short declaratives ("Lower Costs. Higher
 * Efficiencies. Accelerate Revenue."), and the entrance is built out of that
 * structure rather than out of hardcoded line breaks. If the copy is later
 * revised into a single sentence this returns one line and the hero becomes a
 * single mask reveal, which is a smaller entrance rather than a broken one.
 */
function toSentences(headline: string): string[] {
  const sentences = headline.match(/[^.!?]+[.!?]*/g);
  if (!sentences) return [headline];
  return sentences.map((sentence) => sentence.trim()).filter(Boolean);
}

/**
 * The hero: night footage of a business district under a navy scrim, with the
 * headline anchored low and left over it.
 *
 * COMPOSITION
 *
 * The copy sits at the bottom of the frame rather than centred in it, for two
 * reasons that happen to agree. It is the part of the scrim that is darkest,
 * which is what makes white type over city lights safe (see `HeroMedia` for
 * the measured figures). And a centred block of type over full-bleed video is
 * the first thing anyone builds for a hero like this, which by PRODUCT.md's
 * standard makes it the wrong answer for a company trying not to look like its
 * competitors.
 *
 * ENTRANCE
 *
 * Three masked lines rise 500ms apart, the supporting paragraph fades up at
 * 500ms, and the buttons arrive at 1300ms. The long wait on the buttons is
 * deliberate: by then the reader has finished the headline, so the call to
 * action arrives as the next thing to look at rather than as competition for
 * the sentence above it.
 *
 * The whole entrance is CSS (see `SectionCraftStyles`), so it plays before the
 * bundle loads, plays with JavaScript disabled, and switches off entirely
 * under `prefers-reduced-motion: reduce` rather than playing quickly.
 */
export default function HeroSection({ content }: HeroSectionProps): JSX.Element {
  const lines = toSentences(content.headline);

  return (
    <section
      // Not the shared `Section` component: this one is a media frame with its
      // own clipping context and vertical rhythm, and none of Section's
      // padding survives. `data-tone` is set by hand because globals.css keys
      // the lighter focus ring on navy surfaces off exactly this attribute.
      data-tone="navy"
      // `svh` rather than `dvh`: the dynamic unit changes as a mobile browser
      // hides its address bar, which would resize the hero mid-scroll. The
      // header is `sticky` and therefore in flow, so its 5rem is subtracted
      // here to keep the hero inside the first viewport.
      // The lower bound of each clamp is set by the smallest common phone
      // (375x667), where the approved subheadline runs to eight lines and the
      // padding is the only thing between the CTA and the fold. The upper
      // bounds are the hero rhythm from DESIGN.md §3 and are what actually
      // applies from tablet up.
      className="relative isolate flex min-h-[calc(100svh-5rem)] w-full flex-col justify-end overflow-hidden bg-[var(--navy-800)] pb-[clamp(2.5rem,8vw,6rem)] pt-[clamp(3rem,14vw,9rem)] text-white"
    >
      <HeroMedia />

      <Container className="relative">
        <h1 className="max-w-[16ch] font-display text-display">
          {lines.map((line, index) => (
            /*
             * Two elements per line and both are load-bearing. The outer one
             * clips, the inner one moves; a single element cannot do both
             * because a transform on the clipping box moves the mask with the
             * content. `pb-[0.12em]` gives the descenders room, since an
             * overflow-hidden box cropped to the line box would shear the tail
             * off a "g" or a "y".
             */
            <span key={line} className="block overflow-hidden pb-[0.12em]">
              <span
                className="ar-line-rise block"
                style={{ animationDelay: `${index * HERO_LINE_STAGGER_MS}ms` }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        {/*
         * One size down below 480px. The approved subheadline is three
         * sentences, which is eight lines at body-lg on a 375px screen and is
         * the single reason the CTA was falling past the fold there. Dropping
         * to the body size recovers two of those lines without touching a word
         * of copy, and the larger size still applies everywhere it fits.
         */}
        <p
          className="ar-fade-rise mt-6 max-w-[52ch] text-body text-white/88 sm:mt-8 sm:text-body-lg"
          style={{ animationDelay: `${HERO_SUPPORT_DELAY_MS}ms` }}
        >
          {content.subheadline}
        </p>

        <div
          className="ar-fade-rise mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4"
          style={{ animationDelay: `${HERO_CTA_DELAY_MS}ms` }}
        >
          <Button href={content.primaryCta.href} variant="primary" size="lg">
            {content.primaryCta.label}
          </Button>
          <Button href={content.secondaryCta.href} variant="secondary" size="lg">
            {content.secondaryCta.label}
          </Button>
        </div>
      </Container>
    </section>
  );
}
