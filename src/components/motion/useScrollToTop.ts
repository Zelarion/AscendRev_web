'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { usePathname } from 'next/navigation';
import type Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const REVENUE_IMPACT_HASH = '#revenue-impact';
const ANCHOR_SETTLE_TOLERANCE = 4;
const MAX_ANCHOR_CORRECTIONS = 3;

function getHashTarget(hash: string): HTMLElement | null {
  let targetId: string;
  try {
    targetId = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }

  return targetId ? document.getElementById(targetId) : null;
}

function getTargetScrollTop(target: HTMLElement): number {
  const scrollMarginTop = Number.parseFloat(getComputedStyle(target).scrollMarginTop);
  const margin = Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0;
  return target.getBoundingClientRect().top + window.scrollY - margin;
}

/**
 * Scroll to the element, then remeasure after the active ScrollTrigger pins
 * have had a chance to refresh. A pin may add substantial document height
 * while the first smooth scroll is already in flight, invalidating its initial
 * destination. A bounded correction lands on the element's final position.
 */
function scrollToHashTarget(
  lenisRef: RefObject<Lenis | null>,
  hash: string,
  options: { immediate?: boolean } = {}
): () => void {
  let cancelled = false;
  let firstFrame = 0;
  let secondFrame = 0;
  let corrections = 0;
  let pinNeedsRestore = false;

  const target = getHashTarget(hash);
  if (!target) return () => undefined;

  const gallery = hash === REVENUE_IMPACT_HASH
    ? document.getElementById('all-facilities-grid')
    : null;
  const facilitiesPin = gallery
    ? ScrollTrigger.getAll().find((trigger) => trigger.trigger === gallery)
    : undefined;
  if (hash === REVENUE_IMPACT_HASH) {
    window.dispatchEvent(new CustomEvent('ascendrev:anchor-navigation', {
      detail: { hash, phase: 'start' },
    }));
  }
  if (facilitiesPin) {
    facilitiesPin.disable();
    pinNeedsRestore = true;
  }

  const restorePin = (): boolean => {
    if (!pinNeedsRestore || !facilitiesPin) return false;
    pinNeedsRestore = false;
    facilitiesPin.enable(false, false);
    ScrollTrigger.refresh();
    return true;
  };

  const finishAnchorNavigation = (): void => {
    if (hash === REVENUE_IMPACT_HASH) {
      window.dispatchEvent(new CustomEvent('ascendrev:anchor-navigation', {
        detail: { hash, phase: 'end' },
      }));
    }
  };

  const settleAfterLayout = (): void => {
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (cancelled) return;

        const target = getHashTarget(hash);
        if (!target) {
          restorePin();
          finishAnchorNavigation();
          return;
        }

        const lenis = lenisRef.current;
        const currentScroll = lenis?.scroll ?? window.scrollY;
        const destination = getTargetScrollTop(target);
        if (restorePin()) {
          // Restoring the gallery's pin adds its runway back above this target.
          // Measure again after refresh, then correct while the gallery's
          // anchor-navigation bypass is still active.
          settleAfterLayout();
          return;
        }
        if (Math.abs(destination - currentScroll) <= ANCHOR_SETTLE_TOLERANCE) {
          finishAnchorNavigation();
          return;
        }
        if (corrections >= MAX_ANCHOR_CORRECTIONS) {
          finishAnchorNavigation();
          return;
        }

        corrections += 1;
        if (lenis) {
          lenis.scrollTo(target, {
            force: true,
            onComplete: settleAfterLayout,
          });
        } else {
          window.scrollTo({ top: destination, left: 0, behavior: 'auto' });
          settleAfterLayout();
        }
      });
    });
  };

  const lenis = lenisRef.current;
  if (lenis) {
    lenis.scrollTo(target, {
      force: true,
      immediate: options.immediate,
      onComplete: settleAfterLayout,
    });
  } else {
    window.scrollTo({ top: getTargetScrollTop(target), left: 0, behavior: 'auto' });
    if (restorePin()) settleAfterLayout();
    else finishAnchorNavigation();
  }

  return () => {
    cancelled = true;
    window.cancelAnimationFrame(firstFrame);
    window.cancelAnimationFrame(secondFrame);
    restorePin();
    finishAnchorNavigation();
  };
}

/**
 * Handles same-page hash navigation and resets scroll after client-side route
 * changes. Hash targets are remeasured after scroll-linked pins settle, so a
 * changing ScrollTrigger pin runway cannot leave the reader at a stale offset.
 */
export default function useScrollToTop(lenisRef: RefObject<Lenis | null>): void {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    const handleRequestedTop = (): void => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(0, {
          duration: reducedMotion ? 0 : 0.9,
          force: true,
        });
        return;
      }

      window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    };

    window.addEventListener('ascendrev:scroll-to-top', handleRequestedTop);
    return () => window.removeEventListener('ascendrev:scroll-to-top', handleRequestedTop);
  }, [lenisRef]);

  useEffect(() => {
    let cancelPendingScroll = (): void => undefined;

    const handleHashChange = (): void => {
      cancelPendingScroll();
      cancelPendingScroll = scrollToHashTarget(lenisRef, window.location.hash);
    };

    const handleAnchorClick = (event: MouseEvent): void => {
      if (
        event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
        || event.shiftKey || event.altKey
      ) return;

      const anchor = event.composedPath().find((node): node is HTMLAnchorElement =>
        node instanceof HTMLAnchorElement && Boolean(node.href)
      );
      if (
        !anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')
      ) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (
        targetUrl.origin !== currentUrl.origin
        || targetUrl.pathname !== currentUrl.pathname
        || targetUrl.hash !== REVENUE_IMPACT_HASH
      ) return;

      const target = getHashTarget(REVENUE_IMPACT_HASH);
      if (!target) return;

      // Keep this a same-document navigation: the header link intentionally
      // avoids a route reload, and Lenis' built-in one-shot anchor scroll is
      // disabled so this measured scroll is the only scroll owner.
      event.preventDefault();
      cancelPendingScroll();
      if (window.location.hash !== REVENUE_IMPACT_HASH) {
        const oldURL = window.location.href;
        window.history.pushState(null, '', `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
        window.dispatchEvent(new HashChangeEvent('hashchange', {
          oldURL,
          newURL: window.location.href,
        }));
        return;
      }

      cancelPendingScroll = scrollToHashTarget(lenisRef, REVENUE_IMPACT_HASH);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('click', handleAnchorClick, true);
    return () => {
      cancelPendingScroll();
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('click', handleAnchorClick, true);
    };
  }, [lenisRef]);

  useEffect(() => {
    const initialHash = window.location.hash;
    if (!initialHash) return;

    let cancelled = false;
    let hashChanged = false;
    let firstFrame = 0;
    let secondFrame = 0;
    let cancelInitialHashScroll = (): void => undefined;
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

      // Fragment navigation can run before hydration, fonts, and final
      // section layout settle. Correct it after the initial document load.
      // A later hash change cancels this correction rather than pulling the
      // reader back to the original target.
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (cancelled || hashChanged || window.location.hash !== initialHash) return;

          cancelInitialHashScroll = scrollToHashTarget(lenisRef, initialHash, {
            immediate: true,
          });
        });
      });
    });

    return () => {
      cancelled = true;
      cancelInitialHashScroll();
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.removeEventListener('hashchange', markHashChange);
    };
  }, [lenisRef]);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    let cancelled = false;
    let firstFrame = 0;
    let secondFrame = 0;
    let cancelAnchorScroll = (): void => undefined;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (cancelled) return;

        if (pathname === '/' && window.location.hash) {
          cancelAnchorScroll = scrollToHashTarget(lenisRef, window.location.hash);
          return;
        }

        const lenis = lenisRef.current;
        if (lenis) {
          lenis.scrollTo(0, { immediate: true, force: true });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnchorScroll();
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname, lenisRef]);
}
