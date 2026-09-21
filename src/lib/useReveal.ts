'use client';

import { useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';
import {
  DUR_SLOW,
  EASE_OUT_EXPO,
  isBelowRevealLine,
  prefersReducedMotion,
  REVEAL_START,
  REVEAL_Y,
  STAGGER_MAX_ITEMS,
  STAGGER_STEP,
} from '@/lib/motion';

interface UseRevealOptions {
  /** Seconds to hold before the reveal starts. */
  delay?: number;
  /**
   * When set, the hook reveals the element's direct children on a cascade
   * instead of the element itself. Past STAGGER_MAX_ITEMS the cascade is
   * dropped and every child reveals together, because a 60ms step across
   * twenty items is a waterfall, not a reveal (DESIGN.md §4).
   */
  stagger?: boolean;
}

/**
 * The scroll-reveal primitive shared by Reveal and Stagger: a 14px rise plus
 * an opacity fade, 600ms on ease-out-expo, fired once (DESIGN.md §4).
 *
 * Three things make this safe to put on server-rendered content, and all
 * three are requirements rather than refinements:
 *
 *  1. Nothing is ever hidden by a class or a style the server emits. The
 *     hidden state is written by GSAP, on the client, after hydration.
 *  2. An element already on screen when the hook runs is left completely
 *     alone (isBelowRevealLine). Hiding it to reveal it would be a blink, and
 *     the reveal is meant to enhance an already-visible default.
 *  3. Under `prefers-reduced-motion: reduce` the hook does nothing at all, so
 *     content stays exactly as rendered.
 *
 * With JavaScript disabled, none of this runs and the page is complete.
 *
 * `useGSAP` reverts every tween it created, and kills the ScrollTriggers with
 * them, when the component unmounts. That is why the cleanup here looks
 * absent: it is the hook's contract, not an omission.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {}
): RefObject<T | null> {
  const { delay = 0, stagger = false } = options;
  const ref = useRef<T | null>(null);

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      if (prefersReducedMotion()) return;

      registerMotion();

      // Staggering reveals the children; otherwise the element itself moves.
      const targets: Element[] = stagger ? Array.from(element.children) : [element];
      if (targets.length === 0) return;

      // Measured against the element, not each child, so a grid whose first
      // row is already on screen does not half-animate.
      if (!isBelowRevealLine(element)) return;

      const withinCap = targets.length <= STAGGER_MAX_ITEMS;

      gsap.fromTo(
        targets,
        { opacity: 0, y: REVEAL_Y },
        {
          opacity: 1,
          y: 0,
          duration: DUR_SLOW,
          ease: EASE_OUT_EXPO,
          delay,
          stagger: stagger && withinCap ? STAGGER_STEP : 0,
          // Clear the inline transform and opacity when the tween finishes so
          // the element goes back to being plain markup. Leaving a residual
          // `opacity: 1` and a transform behind would keep a compositor layer
          // alive on every revealed element for the life of the page.
          clearProps: 'opacity,transform',
          scrollTrigger: {
            trigger: element,
            start: REVEAL_START,
            once: true,
          },
        }
      );
    },
    { dependencies: [delay, stagger] }
  );

  return ref;
}
