'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { usePathname } from 'next/navigation';
import type Lenis from 'lenis';

/**
 * Resets scroll to the top after a client-side route change. Full-document hash
 * links use the browser's native fragment navigation instead, so route reset
 * timing cannot discard their target.
 */
export default function useScrollToTop(lenisRef: RefObject<Lenis | null>): void {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const initialHash = window.location.hash;
    if (!initialHash) return;

    let cancelled = false;
    let hashChanged = false;
    let firstFrame = 0;
    let secondFrame = 0;
    const markHashChange = () => {
      hashChanged = true;
    };
    window.addEventListener('hashchange', markHashChange);

    const waitForLoad =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            window.addEventListener('load', () => resolve(), { once: true });
          });
    const waitForFonts = 'fonts' in document ? document.fonts.ready : Promise.resolve();

    void Promise.all([waitForLoad, waitForFonts]).then(() => {
      if (cancelled) return;

      // Native fragment navigation can run before hydration, fonts, and final
      // section layout settle. Correct it once after that first document load.
      // A later same-document hash click is left to the browser/Lenis anchor
      // behavior and must not be pulled back to the initial target.
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (cancelled || hashChanged || window.location.hash !== initialHash) return;

          let targetId: string;
          try {
            targetId = decodeURIComponent(initialHash.slice(1));
          } catch {
            return;
          }

          const target = document.getElementById(targetId);
          if (!target) return;

          const scrollMarginTop = Number.parseFloat(getComputedStyle(target).scrollMarginTop);
          const margin = Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0;
          const destination = target.getBoundingClientRect().top + window.scrollY - margin;
          const lenis = lenisRef.current;

          if (lenis) {
            lenis.scrollTo(destination, { immediate: true, force: true });
          } else {
            window.scrollTo({ top: destination, left: 0, behavior: 'auto' });
          }
        });
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.removeEventListener('hashchange', markHashChange);
    };
  }, [lenisRef]);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const frame = window.requestAnimationFrame(() => {
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname, lenisRef]);
}
