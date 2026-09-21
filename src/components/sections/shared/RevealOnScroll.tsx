'use client';

import { createElement, useEffect, useRef, type JSX, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';
import {
  EASE_REVEAL,
  REVEAL_DISTANCE_PX,
  REVEAL_DURATION_MS,
  REVEAL_LINE_FRACTION,
  REVEAL_STAGGER_MS,
} from '@/components/sections/shared/motionTokens';

type RevealElement = 'div' | 'section' | 'ul' | 'ol' | 'li' | 'p' | 'header';

interface RevealOnScrollProps {
  children: ReactNode;
  as?: RevealElement;
  /** Milliseconds to hold before this element's own entrance starts. */
  delayMs?: number;
  /**
   * Cascade the element's direct children instead of moving the element
   * itself. Use it on the list, not on each item.
   */
  stagger?: boolean;
  className?: string;
}

/**
 * The scroll entrance used by every homepage section: a 48px rise and an
 * opacity fade over 700ms on EASE_REVEAL, fired once, optionally cascading
 * direct children 80ms apart.
 *
 * WHY THIS IS NOT `src/components/ui/Reveal.tsx`
 *
 * `Reveal` implements DESIGN.md §4's 14px / 600ms / ease-out-expo entrance via
 * GSAP. This implements the section brief's 48px / 700ms / EASE_REVEAL
 * entrance via plain CSS transitions. See the note at the top of
 * `motionTokens.ts`: the two specifications disagree and the disagreement is
 * flagged rather than silently resolved. This component adds no animation
 * library; it writes three inline style properties and removes them again.
 *
 * Three properties make this safe to put on server-rendered content, and all
 * three are requirements rather than refinements:
 *
 *  1. Nothing is ever hidden by the server. The markup ships complete and
 *     visible, and the hidden state is written on the client after mount. With
 *     JavaScript disabled, a failed bundle, or a headless render, the section
 *     is simply there.
 *  2. An element already at or above the reveal line when this runs is left
 *     untouched. Hiding something the reader is already looking at in order to
 *     animate it back in is a blink, not an entrance.
 *  3. Under `prefers-reduced-motion: reduce` it returns before touching
 *     anything, so content stays exactly as rendered rather than animating
 *     quickly.
 */
export default function RevealOnScroll({
  children,
  as = 'div',
  delayMs = 0,
  stagger = false,
  className,
}: RevealOnScrollProps): JSX.Element {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (prefersReducedMotion()) return;

    const targets: HTMLElement[] = stagger
      ? (Array.from(element.children).filter(
          (child): child is HTMLElement => child instanceof HTMLElement
        ) as HTMLElement[])
      : [element];
    if (targets.length === 0) return;

    // Measured against the wrapper rather than each child, so a list whose
    // first row is already on screen does not half-animate.
    if (element.getBoundingClientRect().top <= window.innerHeight * REVEAL_LINE_FRACTION) {
      return;
    }

    targets.forEach((target, index) => {
      target.style.opacity = '0';
      target.style.transform = `translateY(${REVEAL_DISTANCE_PX}px)`;
      target.style.transitionProperty = 'opacity, transform';
      target.style.transitionDuration = `${REVEAL_DURATION_MS}ms`;
      target.style.transitionTimingFunction = EASE_REVEAL;
      target.style.transitionDelay = `${delayMs + (stagger ? index * REVEAL_STAGGER_MS : 0)}ms`;
      target.style.willChange = 'opacity, transform';
    });

    /**
     * Hand the element back to plain markup once it has arrived. Leaving the
     * inline `opacity: 1`, the transform and `will-change` in place would hold
     * a compositor layer open on every revealed element for the life of the
     * page, which on this page is five sections' worth of them.
     */
    const settle = (target: HTMLElement) => {
      target.style.removeProperty('opacity');
      target.style.removeProperty('transform');
      target.style.removeProperty('transition-property');
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-timing-function');
      target.style.removeProperty('transition-delay');
      target.style.removeProperty('will-change');
    };

    const settleTimers: number[] = [];

    const play = () => {
      targets.forEach((target, index) => {
        target.style.opacity = '1';
        target.style.transform = 'translateY(0)';
        const total = delayMs + (stagger ? index * REVEAL_STAGGER_MS : 0) + REVEAL_DURATION_MS;
        // `transitionend` is the obvious hook and is unreliable here: it does
        // not fire if the tab is hidden for the whole transition, which would
        // strand the element at `opacity: 0`. A timer always fires.
        settleTimers.push(window.setTimeout(() => settle(target), total + 50));
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        play();
      },
      // Pulls the trigger line up to REVEAL_LINE_FRACTION of the viewport, so
      // the entrance fires at the same place the guard above measures.
      { rootMargin: `0px 0px -${Math.round((1 - REVEAL_LINE_FRACTION) * 100)}% 0px` }
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      settleTimers.forEach(window.clearTimeout);
      // An unmount mid-transition (a route change) must not leave the element
      // invisible in a cached tree.
      targets.forEach(settle);
    };
  }, [delayMs, stagger]);

  return createElement(as, { ref, className: cn(className) }, children);
}
