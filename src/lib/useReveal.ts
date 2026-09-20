'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

interface UseRevealOptions {
  /** Fraction of the element that must be visible before it fires. */
  threshold?: number;
  /** IntersectionObserver rootMargin. Negative bottom margin fires the
   * reveal slightly before the element reaches the very bottom edge of the
   * viewport, which reads as more responsive on fast scroll. */
  rootMargin?: string;
}

interface UseRevealResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  /** True once the element has intersected (or immediately, under reduced
   * motion / no-IntersectionObserver environments). Fires once and never
   * resets. */
  isRevealed: boolean;
  /** Live `prefers-reduced-motion: reduce` state, exposed so callers can
   * choose an instant-vs-animated presentation rather than just a
   * hidden-vs-visible one (e.g. stat counters skip the count-up entirely). */
  prefersReducedMotion: boolean;
}

/**
 * Scroll-reveal primitive shared by Reveal and Stagger. Fires once via
 * IntersectionObserver and always respects
 * `window.matchMedia('(prefers-reduced-motion: reduce)')` — when the user
 * has that preference, `isRevealed` resolves to `true` immediately instead
 * of waiting on intersection, so the caller's "hidden" state is never
 * applied at all.
 *
 * This hook only decides *whether* an enhancement should run. It does not
 * decide the element's default visibility — callers (Reveal, Stagger) are
 * responsible for shipping visible-by-default markup per DESIGN.md §4.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {}
): UseRevealResult<T> {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = options;
  const ref = useRef<T | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // addEventListener is the modern API; Safari < 14 needs addListener, but
    // the App Router's target browser matrix (per SPEC.md's Lighthouse/axe
    // gates) does not require that fallback.
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsRevealed(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      // No observer support: fail open to visible rather than never firing.
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect(); // fires once
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion, threshold, rootMargin]);

  return { ref, isRevealed, prefersReducedMotion };
}
