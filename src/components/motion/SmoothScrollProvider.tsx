'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { registerMotion } from '@/components/motion/registerMotion';
import { prefersReducedMotion } from '@/lib/motion';

/** Marks <html> while Lenis owns the scroll, so globals.css can stand down its
 * own `scroll-behavior: smooth` instead of fighting for the same wheel event. */
const LENIS_ACTIVE_CLASS = 'has-lenis-scroll';

/**
 * Tuned to match the reference implementation this technique comes from.
 * `autoRaf: false` is the load-bearing one: Lenis must not run its own
 * requestAnimationFrame loop, because ScrollTrigger needs Lenis to have
 * already updated for the current frame before it reads any scroll position.
 * One ticker, one order of operations, no tearing between the two libraries.
 */
const LENIS_OPTIONS = {
  autoRaf: false,
  duration: 1.15,
  lerp: 0.08,
  wheelMultiplier: 0.92,
  /** Touch devices keep their native scroll physics. Smoothing a touch scroll
   * fights the platform's own inertia and reads as lag on a phone. */
  syncTouch: false,
  /** In-page anchors (`/#industries` from the nav) land below the sticky
   * header rather than underneath it. The header is h-20, which is 80px. */
  anchors: { offset: 80 },
} as const;

interface SmoothScrollProviderProps {
  children: ReactNode;
}

/**
 * Drives Lenis from `gsap.ticker` so smooth scrolling and every ScrollTrigger
 * on the page share a single frame loop. Mount once, high in the tree,
 * wrapping the page. It renders its children and no DOM of its own.
 *
 * Under `prefers-reduced-motion: reduce` Lenis is not created and the browser's
 * own scrolling is used untouched. That is not a degraded mode. A reader who
 * asked for reduced motion is asking for the scroll to go exactly where they
 * put it, and smooth scrolling is the single most nausea-inducing effect on a
 * marketing page. ScrollTrigger still works on native scroll, so the
 * primitives that survive reduced motion keep working.
 *
 * ON BUNDLE COST, because this is the obvious thing to try to fix and both
 * obvious fixes were measured and do not work. Mounting this in the root
 * layout puts GSAP and ScrollTrigger, about 59KB gzipped between them, into
 * the initial script set of every route, including /privacy and /terms, which
 * animate nothing. Deferring the libraries with `import()` inside the effect
 * does not remove them, and neither does `next/dynamic` with `ssr: false`:
 * Next 15's App Router hoists the async chunk graph of a root-layout client
 * component into a `<script async>` tag on every page either way. The lever
 * that would actually work is mounting this per page rather than in the root
 * layout, which is a layout decision rather than a change to this file. See
 * the build report.
 */
export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      document.documentElement.classList.remove(LENIS_ACTIVE_CLASS);
      return;
    }

    registerMotion();
    document.documentElement.classList.add(LENIS_ACTIVE_CLASS);

    const lenis = new Lenis(LENIS_OPTIONS);
    lenisRef.current = lenis;

    // gsap.ticker reports seconds; Lenis.raf expects milliseconds.
    const tick = (time: number) => lenis.raf(time * 1000);

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);

    // GSAP's lag smoothing skips ahead after a long frame to keep wall-clock
    // time honest. That is right for a timeline and wrong for a scroll
    // position: it makes Lenis jump past where the reader actually is.
    gsap.ticker.lagSmoothing(0);

    // Trigger positions are measured from layout, and layout is not final on
    // the frame this runs: fonts are still swapping in and images are still
    // reserving their boxes. The next frame catches the first settle; the load
    // listener and the font promise catch the rest.
    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    const handleLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', handleLoad);

    // next/font loads with `display: swap`, so the fallback face renders first
    // and every measurement taken before the swap is wrong by a line or two.
    // `document.fonts.ready` is the moment that stops being true.
    let disposed = false;
    if ('fonts' in document) {
      void document.fonts.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
      });
    }

    // Anything that opens over the page locks body scroll the ordinary way,
    // with `overflow: hidden` on <body> (the mobile nav sheet in Header does
    // exactly this). That stops native scrolling but not Lenis, which listens
    // for wheel and touch events on the window and would keep sliding the page
    // along behind the open sheet.
    //
    // Watching the lock rather than exporting a stop/start pair keeps the
    // coupling one-way: a component that opens an overlay does not have to know
    // a smooth-scroll library exists, and one that forgets to call the pair
    // cannot leave the page scrolling underneath itself.
    const syncScrollLock = () => {
      if (document.body.style.overflow === 'hidden') {
        lenis.stop();
      } else {
        lenis.start();
      }
    };
    syncScrollLock();
    const lockObserver = new MutationObserver(syncScrollLock);
    lockObserver.observe(document.body, { attributeFilter: ['style'] });

    return () => {
      disposed = true;
      lockObserver.disconnect();
      window.cancelAnimationFrame(refreshFrame);
      window.removeEventListener('load', handleLoad);
      lenis.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove(LENIS_ACTIVE_CLASS);
      // Hand the measurements back to native scroll before anything else reads
      // them.
      ScrollTrigger.refresh();
    };
  }, []);

  // A client-side route change swaps the whole page body, so every trigger
  // position measured against the old page is stale. Lenis also caches the
  // document height and would otherwise stop short of the new page's bottom.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const lenis = lenisRef.current;
      if (!lenis) return; // reduced motion: there is nothing to resize
      lenis.resize();
      ScrollTrigger.refresh();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return children;
}
