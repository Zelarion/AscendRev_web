'use client';

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';
import LoaderMotionMark from '@/components/ui/LoaderMotionMark';

type LoaderPhase = 'boot' | 'entering' | 'leaving';

const BOOT_STABILITY_MS = 80;
const ROUTE_STABILITY_MS = 60;
const BOOT_MAX_MS = 1200;
const ROUTE_SHOW_DELAY_MS = 200;
const ROUTE_MAX_MS = 1500;
/**
 * The longest the cover may stay up while a navigation has not arrived. The cover only lifts once
 * the address changes, so a navigation that stalls (slow mobile data), is cancelled (Back pressed
 * mid-load) or falls back to a full page load would otherwise leave it up for good.
 */
const ROUTE_STALL_MS = 4000;

/**
 * Wait for the requested route's React commit, parsed HTML, loaded stylesheets,
 * and a rendered/stable DOM. Images are intentionally excluded: the browser
 * continues loading them after visitors can start reading the page. `deadline`
 * is an absolute performance.now() time: once reached we release unconditionally,
 * so a running animation (Lenis, framer-motion) that keeps mutating attributes
 * can never stall readiness forever. Only childList mutations count toward
 * stability for the same reason — attribute churn from those animations must
 * not keep resetting the stability clock.
 */
function waitForPageReady(
  stabilityMs: number,
  deadline: number,
  signal: AbortSignal
): Promise<boolean> {
  return new Promise((resolve) => {
    let intervalId: number | null = null;
    let settled = false;
    let checkingLayout = false;
    let lastDomChangeAt = performance.now();
    const observer = new MutationObserver(() => {
      lastDomChangeAt = performance.now();
    });

    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      if (intervalId !== null) window.clearInterval(intervalId);
      signal.removeEventListener('abort', abort);
      resolve(ready);
    };

    const abort = () => finish(false);
    const check = () => {
      if (settled) return;
      if (signal.aborted) {
        finish(false);
        return;
      }
      if (performance.now() >= deadline) {
        finish(true);
        return;
      }

      if (document.readyState === 'loading' || checkingLayout) return;
      const main = document.querySelector<HTMLElement>('main#main');
      if (!main) return;

      const stylesPending = Array.from(
        document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')
      ).some((link) => !link.disabled && link.sheet === null);
      if (
        stylesPending
        || performance.now() - lastDomChangeAt < stabilityMs
      ) return;

      checkingLayout = true;
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        checkingLayout = false;
        const currentMain = document.querySelector<HTMLElement>('main#main');
        const currentStylesPending = Array.from(
          document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')
        ).some((link) => !link.disabled && link.sheet === null);
        if (
          !currentMain
          || currentStylesPending
          || performance.now() - lastDomChangeAt < stabilityMs
        ) return;

        currentMain.getBoundingClientRect();
        finish(!signal.aborted);
      }));
    };

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
    });
    signal.addEventListener('abort', abort, { once: true });
    intervalId = window.setInterval(check, 40);
    check();
  });
}

/** A server-rendered first-paint cover and route-transition cover. */
export default function PageLoader(): JSX.Element | null {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const targetPathname = useRef<string | null>(null);
  const targetUrl = useRef<string | null>(null);
  const transitionId = useRef(0);
  const transitionStartedAt = useRef(0);
  const readinessWaitStartedFor = useRef<number | null>(null);
  const readinessController = useRef<AbortController | null>(null);
  const queryPollTimer = useRef<number | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const showTimer = useRef<number | null>(null);
  const stallTimer = useRef<number | null>(null);
  const coverShown = useRef(false);
  const isBootTransition = useRef(true);
  const [phase, setPhase] = useState<LoaderPhase | null>('boot');

  const clearPendingTimers = useCallback(() => {
    readinessController.current?.abort();
    readinessController.current = null;
    if (queryPollTimer.current !== null) window.clearInterval(queryPollTimer.current);
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    if (showTimer.current !== null) window.clearTimeout(showTimer.current);
    if (stallTimer.current !== null) window.clearTimeout(stallTimer.current);
    queryPollTimer.current = null;
    leaveTimer.current = null;
    showTimer.current = null;
    stallTimer.current = null;
  }, []);

  const finishTransition = useCallback((id: number) => {
    if (transitionId.current !== id) return;
    if (showTimer.current !== null) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }
    if (stallTimer.current !== null) {
      window.clearTimeout(stallTimer.current);
      stallTimer.current = null;
    }
    leaveTimer.current = null;
    readinessWaitStartedFor.current = null;
    targetPathname.current = null;
    targetUrl.current = null;

    // Destination was ready before ROUTE_SHOW_DELAY_MS elapsed: the cover
    // never appeared, so there is nothing to animate away — just reset.
    if (!coverShown.current) {
      setPhase(null);
      return;
    }

    setPhase((current) => (current ? 'leaving' : null));
    leaveTimer.current = window.setTimeout(() => {
      if (transitionId.current !== id) return;
      leaveTimer.current = null;
      delete document.documentElement.dataset.ascendrevLoaderStartedAt;
      setPhase(null);
    }, 180);
  }, []);

  const beginTransition = useCallback(() => {
    clearPendingTimers();
    transitionId.current += 1;
    transitionStartedAt.current = performance.now();
    readinessWaitStartedFor.current = null;
    isBootTransition.current = false;
    coverShown.current = false;
    const id = transitionId.current;
    // Don't flash the cover for fast navigations: only show it once the
    // destination is still not ready after ROUTE_SHOW_DELAY_MS.
    showTimer.current = window.setTimeout(() => {
      showTimer.current = null;
      if (transitionId.current !== id) return;
      coverShown.current = true;
      setPhase('entering');
    }, ROUTE_SHOW_DELAY_MS);
    stallTimer.current = window.setTimeout(() => {
      stallTimer.current = null;
      finishTransition(id);
    }, ROUTE_STALL_MS);
    return id;
  }, [clearPendingTimers, finishTransition]);

  const waitForCurrentPage = useCallback((id: number) => {
    if (readinessWaitStartedFor.current === id) return;
    readinessWaitStartedFor.current = id;

    const controller = new AbortController();
    readinessController.current = controller;
    const stabilityMs = isBootTransition.current
      ? BOOT_STABILITY_MS
      : ROUTE_STABILITY_MS;
    const maxMs = isBootTransition.current ? BOOT_MAX_MS : ROUTE_MAX_MS;

    void waitForPageReady(
      stabilityMs,
      transitionStartedAt.current + maxMs,
      controller.signal
    ).then((ready) => {
      if (!ready || transitionId.current !== id) return;
      readinessController.current = null;
      finishTransition(id);
    });
  }, [finishTransition]);

  useEffect(() => {
    const loaderRoot = document.documentElement;
    if (loaderRoot.dataset.ascendrevLoader !== 'active') {
      setPhase(null);
      return;
    }

    transitionId.current += 1;
    isBootTransition.current = true;
    coverShown.current = true;
    const id = transitionId.current;
    const bootStartedAt = Number(loaderRoot.dataset.ascendrevLoaderStartedAt);
    transitionStartedAt.current = Number.isFinite(bootStartedAt)
      ? bootStartedAt
      : performance.now();
    waitForCurrentPage(id);

    return clearPendingTimers;
  }, [clearPendingTimers, waitForCurrentPage]);

  // A page restored from the browser's back/forward cache comes back exactly as it was left,
  // which can be mid-transition with the cover up and timers that will never fire. Start clean.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      clearPendingTimers();
      transitionId.current += 1;
      targetPathname.current = null;
      targetUrl.current = null;
      readinessWaitStartedFor.current = null;
      coverShown.current = false;
      previousPathname.current = window.location.pathname;
      delete document.documentElement.dataset.ascendrevLoader;
      delete document.documentElement.dataset.ascendrevLoaderStartedAt;
      setPhase(null);
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [clearPendingTimers]);

  useEffect(() => {
    if (phase === 'leaving') {
      delete document.documentElement.dataset.ascendrevLoader;
    }
  }, [phase]);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const matchingIntent = targetPathname.current === pathname;
    const id = matchingIntent ? transitionId.current : beginTransition();
    targetPathname.current = pathname;
    waitForCurrentPage(id);
  }, [beginTransition, pathname, waitForCurrentPage]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.target && anchor.target.toLowerCase() !== '_self') return;
      if (anchor.rel.split(/\s+/).includes('external')) return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (destination.origin !== window.location.origin) return;
      const current = new URL(window.location.href);
      if (destination.pathname === current.pathname && destination.search === current.search) return;

      const destinationUrl = `${destination.pathname}${destination.search}`;
      if (targetPathname.current === destination.pathname && targetUrl.current === destinationUrl) return;

      const id = beginTransition();
      targetPathname.current = destination.pathname;
      targetUrl.current = destinationUrl;

      if (destination.pathname === current.pathname) {
        queryPollTimer.current = window.setInterval(() => {
          const location = `${window.location.pathname}${window.location.search}`;
          if (location === targetUrl.current) {
            if (queryPollTimer.current !== null) window.clearInterval(queryPollTimer.current);
            queryPollTimer.current = null;
            waitForCurrentPage(id);
          }
        }, 80);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      clearPendingTimers();
    };
  }, [beginTransition, clearPendingTimers, waitForCurrentPage]);

  if (!phase) return null;

  return (
    <div
      className={`page-loader page-loader-${phase}`}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      aria-busy={phase !== 'leaving'}
    >
      <div className="loader-glow" aria-hidden="true" />
      <div className="loader-content">
        <LoaderMotionMark />
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  );
}
