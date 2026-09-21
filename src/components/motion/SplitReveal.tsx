'use client';

import { useRef, type JSX, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';
import { EASE_OUT_EXPO, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';

interface SplitRevealProps {
  /** Content that arrives from the left. */
  left: ReactNode;
  /** Content that arrives from the right. */
  right: ReactNode;
  /** Seconds to hold before the entrance starts. */
  delay?: number;
  /** Lands on the wrapping element, so the caller owns the layout. */
  className?: string;
}

/** Distance each pane travels, as a percentage of its own width. Past 100 the
 * pane is fully clear of its own box before the wrapper's overflow clips it. */
const TRAVEL_PERCENT = 120;
const ENTRANCE_DURATION = 1.1;

/**
 * The split hero entrance: two panes converge from opposite edges into place.
 *
 * This is a load entrance, not a scroll reveal, so it cannot use the
 * below-the-fold guard the scroll primitives rely on. It honours DESIGN.md §4
 * a different way: `gsap.from` inside `useGSAP` runs in a layout effect, which
 * fires after the DOM is committed but before the browser paints. The panes
 * are never painted in their final position and then yanked offscreen; the
 * reader's first frame already shows them arriving. With JavaScript off, or
 * under reduced motion, no tween is created and the panes render exactly where
 * the server put them.
 *
 * `overflow-hidden` on the wrapper is load-bearing: without it the offscreen
 * panes widen the document and the page grows a horizontal scrollbar for the
 * length of the entrance.
 */
export default function SplitReveal({
  left,
  right,
  delay = 0,
  className,
}: SplitRevealProps): JSX.Element {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      registerMotion();

      const shared = {
        opacity: 0,
        duration: ENTRANCE_DURATION,
        ease: EASE_OUT_EXPO,
        // Drop the inline transform and opacity once the entrance finishes, so
        // the panes go back to being plain markup instead of holding a
        // compositor layer open for the life of the page.
        clearProps: 'opacity,transform',
      };

      gsap
        .timeline({ delay })
        .from('[data-split-pane="left"]', { ...shared, xPercent: -TRAVEL_PERCENT }, 0)
        .from('[data-split-pane="right"]', { ...shared, xPercent: TRAVEL_PERCENT }, 0);
    },
    // `scope` limits the two selector strings to this component's own subtree,
    // so a second SplitReveal elsewhere on the page cannot be animated by this
    // one's timeline.
    { scope, dependencies: [delay] }
  );

  return (
    <div ref={scope} className={cn('overflow-hidden', className)}>
      <div data-split-pane="left">{left}</div>
      <div data-split-pane="right">{right}</div>
    </div>
  );
}
