'use client';

import { useRef, type JSX, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';
import { prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';

/**
 * How a layer behaves while the scene is pinned. Declared on the child with
 * `data-scrub`, so a section written as server-rendered markup can take part
 * without becoming a client component itself:
 *
 *   <ScrubScene>
 *     <p data-scrub="out-left">…</p>
 *     <figure data-scrub="in">…</figure>
 *   </ScrubScene>
 */
type ScrubLayer =
  /** Leaves toward the left edge as the scene plays out. */
  | 'out-left'
  /** Leaves toward the right edge. The pair reads as the scene parting. */
  | 'out-right'
  /** Fades and settles into place over the first half of the scene. */
  | 'in'
  /** Drifts upward at a fraction of scroll speed, for a background layer. */
  | 'parallax';

const TRAVEL_PERCENT = 120;
const PARALLAX_Y = -12; // percent of the element's own height

interface ScrubSceneProps {
  children: ReactNode;
  /**
   * How far the reader scrolls, in viewport heights, while the scene is
   * pinned. 1.5 means the scene holds for one and a half screens of scroll.
   */
  length?: number;
  /**
   * Seconds of catch-up between the scroll position and the animation. The
   * default is the inertial feel from the reference implementation: the scene
   * follows the wheel rather than being welded to it.
   */
  scrub?: number;
  className?: string;
}

/**
 * Pins a section to the viewport and plays its layers out against scroll
 * position rather than against a clock.
 *
 * Pinning is the most intrusive thing on this page, so it fails safe in three
 * directions. Under reduced motion nothing is pinned at all and the section
 * scrolls past like any other. With JavaScript off there is no pin and no
 * transform, and the section reads top to bottom. And the layers are declared
 * by attribute, so the markup inside is ordinary, complete, visible content
 * whether or not this component ever runs.
 *
 * Only `transform` and `opacity` are animated, per DESIGN.md §4.
 */
export default function ScrubScene({
  children,
  length = 1.5,
  scrub = 0.8,
  className,
}: ScrubSceneProps): JSX.Element {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = scope.current;
      if (!element) return;
      if (prefersReducedMotion()) return;

      registerMotion();

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: element,
          start: 'top top',
          // A function rather than a fixed string so the distance is
          // recalculated on every refresh; `invalidateOnRefresh` makes that
          // happen on resize and orientation change instead of stranding the
          // pin at a desktop height on a rotated phone.
          end: () => `+=${window.innerHeight * length}`,
          pin: true,
          scrub,
          invalidateOnRefresh: true,
        },
      });

      // A scene uses whichever layers it needs. Adding a tween for a selector
      // that matches nothing is not an error, but GSAP logs a "target not
      // found" warning for each one, which would fill the console on every
      // page that uses this component.
      const layer = (kind: ScrubLayer): string | null => {
        const selector = `[data-scrub="${kind}"]`;
        return element.querySelector(selector) ? selector : null;
      };

      // Every tween is positioned at 0 so the layers share the scene's full
      // scroll range and the composition moves as one thing rather than as a
      // sequence of separate events.
      const at = 0;
      const outLeft = layer('out-left');
      const outRight = layer('out-right');
      const parallax = layer('parallax');
      const arriving = layer('in');

      if (outLeft) {
        timeline.to(outLeft, { xPercent: -TRAVEL_PERCENT, opacity: 0, ease: 'none' }, at);
      }
      if (outRight) {
        timeline.to(outRight, { xPercent: TRAVEL_PERCENT, opacity: 0, ease: 'none' }, at);
      }
      if (parallax) {
        timeline.to(parallax, { yPercent: PARALLAX_Y, ease: 'none' }, at);
      }
      if (arriving) {
        // Resolves over the first half of the scene, so it is settled and
        // readable while the reader is still inside the pin.
        timeline.fromTo(
          arriving,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, ease: 'none', duration: 0.5 },
          at
        );
      }
    },
    { scope, dependencies: [length, scrub] }
  );

  return (
    // `overflow-hidden` keeps the departing layers from widening the document
    // and adding a horizontal scrollbar while the scene plays.
    <div ref={scope} className={cn('relative overflow-hidden', className)}>
      {children}
    </div>
  );
}

export type { ScrubLayer };
