'use client';

import { createElement, Fragment, useMemo, useRef, type JSX } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';
import { isBelowRevealLine, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';

type WordRevealElement = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

interface WordRevealProps {
  /**
   * Plain text. Not ReactNode: the component has to split on word boundaries,
   * and it can only do that honestly if it owns the string. Passing markup
   * would mean either flattening it or animating around it, and both lie about
   * what the reader sees.
   */
  children: string;
  as?: WordRevealElement;
  className?: string;
}

/** Resting opacity of a word that has not been reached yet. Dim, never absent:
 * the whole line stays legible while it resolves. */
const DIM_OPACITY = 0.2;
/** Seconds of scroll-position catch-up. Low enough that the words track the
 * wheel rather than trailing behind it. */
const SCRUB = 0.3;
const WORD_STAGGER = 0.1;

/**
 * Raises a line of text word by word as it scrolls through the viewport.
 *
 * Every word ships in the server-rendered HTML as its own <span>, fully
 * opaque. The dimming is applied by GSAP after hydration, and only when the
 * line is still below the fold, so a reader with no JavaScript, a failed
 * bundle, or reduced motion set sees an ordinary, complete heading. The
 * inter-word spaces are real text nodes rather than CSS gaps, so the line
 * copies, wraps, and reads to a screen reader exactly as written.
 *
 * Scrubbed rather than played: the words resolve under the reader's own
 * scroll, which is the cause-and-effect DESIGN.md §4 asks motion to express.
 */
export default function WordReveal({
  children,
  as = 'h2',
  className,
}: WordRevealProps): JSX.Element {
  const scope = useRef<HTMLElement>(null);

  // Split once per string rather than on every render. Collapsing runs of
  // whitespace keeps a hand-wrapped source string from producing empty spans.
  const words = useMemo(() => children.trim().split(/\s+/), [children]);

  useGSAP(
    () => {
      const element = scope.current;
      if (!element) return;
      if (prefersReducedMotion()) return;
      if (!isBelowRevealLine(element)) return;

      registerMotion();

      gsap.fromTo(
        '[data-word]',
        { opacity: DIM_OPACITY },
        {
          opacity: 1,
          stagger: WORD_STAGGER,
          ease: 'none', // scrubbed motion is driven by the scroll, not by a curve
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'top 45%',
            scrub: SCRUB,
          },
        }
      );
    },
    { scope, dependencies: [words] }
  );

  return createElement(
    as,
    { ref: scope, className: cn(className) },
    words.map((word, index) => (
      // The words of a fixed heading never reorder, so the index is a stable
      // identity here; the string itself is not, because a heading can repeat
      // a word.
      //
      // The separating space sits OUTSIDE the span deliberately. A trailing
      // space inside an inline-block is collapsed by the layout engine, which
      // would run every word of the heading together.
      <Fragment key={index}>
        <span data-word className="inline-block">
          {word}
        </span>
        {index < words.length - 1 ? ' ' : null}
      </Fragment>
    ))
  );
}
