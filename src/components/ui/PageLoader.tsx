'use client';

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';
import LoaderMotionMark from '@/components/ui/LoaderMotionMark';

type LoaderPhase = 'boot' | 'entering' | 'leaving';

const MINIMUM_DISPLAY_MS = 350;
const ASSET_WAIT_CAP_MS = 8_000;
const ROUTE_COMMIT_CAP_MS = 6_000;
const ROUTE_ASSET_CAP_MS = ASSET_WAIT_CAP_MS + MINIMUM_DISPLAY_MS + 650;

function waitForImageElement(image: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      image.removeEventListener('load', finish);
      image.removeEventListener('error', finish);
      resolve();
    };

    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });

    if (typeof image.decode === 'function') {
      image.decode().then(finish, () => {
        if (image.complete) finish();
      });
    } else if (image.complete) {
      finish();
    }

    if (image.complete && typeof image.decode !== 'function') finish();
  });
}

function preloadUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const image = new Image();
    image.fetchPriority = 'low';
    image.decoding = 'async';

    const finish = () => {
      if (settled) return;
      settled = true;
      image.removeEventListener('load', handleLoad);
      image.removeEventListener('error', finish);
      resolve();
    };
    const handleLoad = () => {
      if (typeof image.decode === 'function') {
        image.decode().then(finish, finish);
      } else {
        finish();
      }
    };

    image.addEventListener('load', handleLoad, { once: true });
    image.addEventListener('error', finish, { once: true });
    image.src = url;

    if (image.complete) {
      if (image.naturalWidth > 0) handleLoad();
      else finish();
    }
  });
}

function extractCssUrls(backgroundImage: string): string[] {
  const urls: string[] = [];
  const expression = /url\(\s*(['"]?)(.*?)\1\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = expression.exec(backgroundImage)) !== null) {
    const value = match[2].trim();
    if (value) urls.push(value);
  }

  return urls;
}

/**
 * Promote native lazy images before the loader leaves, then settle visible and
 * deferred page imagery, CSS backgrounds, video posters, and document fonts.
 * A hard cap ensures a missing third-party asset can never trap the visitor.
 */
async function waitForPageAssets(): Promise<void> {
  const startedAt = performance.now();
  const assets: Promise<unknown>[] = [];
  const seenUrls = new Set<string>();

  for (const image of Array.from(document.images)) {
    if (!image.getAttribute('src') && !image.getAttribute('srcset')) continue;
    const wasLazy = image.loading === 'lazy';
    image.loading = 'eager';
    if (wasLazy && image.fetchPriority === 'auto') image.fetchPriority = 'low';
    assets.push(waitForImageElement(image));
  }

  const addUrl = (value: string) => {
    try {
      const url = new URL(value, document.baseURI);
      if (url.protocol === 'data:' || url.protocol === 'blob:') return;
      if (seenUrls.has(url.href)) return;
      seenUrls.add(url.href);
      assets.push(preloadUrl(url.href));
    } catch {
      // Ignore malformed optional decoration; the normal page remains usable.
    }
  };

  for (const element of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
    const styles = [
      window.getComputedStyle(element),
      window.getComputedStyle(element, '::before'),
      window.getComputedStyle(element, '::after'),
    ];

    for (const style of styles) {
      for (const url of extractCssUrls(style.backgroundImage)) addUrl(url);
    }
  }

  for (const video of Array.from(document.querySelectorAll<HTMLVideoElement>('video[poster]'))) {
    if (video.poster) addUrl(video.poster);
  }

  addUrl('/ascendrev-loader-logo-transparent.png');
  assets.push(document.fonts.ready.catch(() => undefined));

  let timeoutId: number | undefined;
  await Promise.race([
    Promise.allSettled(assets),
    new Promise<void>((resolve) => {
      const remaining = Math.max(0, ASSET_WAIT_CAP_MS - (performance.now() - startedAt));
      timeoutId = window.setTimeout(resolve, remaining);
    }),
  ]);
  if (timeoutId !== undefined) window.clearTimeout(timeoutId);
}

/**
 * First-load and route-transition cover. The boot overlay is server-rendered,
 * but an early head script activates it only when JavaScript is available.
 */
export default function PageLoader(): JSX.Element | null {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const targetPathname = useRef<string | null>(null);
  const targetUrl = useRef<string | null>(null);
  const transitionId = useRef(0);
  const transitionStartedAt = useRef(0);
  const assetWaitStartedFor = useRef<number | null>(null);
  const finishedTransitionFor = useRef<number | null>(null);
  const failsafeTimer = useRef<number | null>(null);
  const queryPollTimer = useRef<number | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const [phase, setPhase] = useState<LoaderPhase | null>('boot');

  const clearPendingTimers = useCallback(() => {
    if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current);
    if (queryPollTimer.current !== null) window.clearInterval(queryPollTimer.current);
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    failsafeTimer.current = null;
    queryPollTimer.current = null;
    leaveTimer.current = null;
  }, []);

  const finishTransition = useCallback((id: number) => {
    if (transitionId.current !== id) return;
    finishedTransitionFor.current = id;
    if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current);
    if (queryPollTimer.current !== null) window.clearInterval(queryPollTimer.current);
    failsafeTimer.current = null;
    queryPollTimer.current = null;
    targetPathname.current = null;
    targetUrl.current = null;
    setPhase((current) => (current ? 'leaving' : null));
    leaveTimer.current = window.setTimeout(() => {
      if (transitionId.current !== id) return;
      leaveTimer.current = null;
      setPhase(null);
    }, 300);
  }, []);

  const beginTransition = useCallback(() => {
    clearPendingTimers();
    transitionId.current += 1;
    transitionStartedAt.current = performance.now();
    assetWaitStartedFor.current = null;
    finishedTransitionFor.current = null;
    const id = transitionId.current;
    setPhase('entering');
    return id;
  }, [clearPendingTimers]);

  const waitForCurrentPage = useCallback((id: number) => {
    if (assetWaitStartedFor.current === id) return;
    assetWaitStartedFor.current = id;

    if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current);
    failsafeTimer.current = window.setTimeout(
      () => finishTransition(id),
      ROUTE_ASSET_CAP_MS
    );

    void waitForPageAssets().finally(() => {
      if (transitionId.current !== id || finishedTransitionFor.current === id) return;
      const elapsed = performance.now() - transitionStartedAt.current;
      const remaining = Math.max(0, MINIMUM_DISPLAY_MS - elapsed);
      leaveTimer.current = window.setTimeout(
        () => finishTransition(id),
        remaining
      );
    });
  }, [finishTransition]);

  useEffect(() => {
    transitionId.current += 1;
    const id = transitionId.current;
    transitionStartedAt.current = performance.now();
    waitForCurrentPage(id);
  }, [waitForCurrentPage]);

  useEffect(() => {
    if (phase === 'leaving') {
      delete document.documentElement.dataset.ascendrevLoader;
    }
  }, [phase]);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const id = targetPathname.current === null
      ? beginTransition()
      : transitionId.current;
    targetPathname.current = pathname;
    waitForCurrentPage(id);
  }, [beginTransition, pathname, waitForCurrentPage]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleClick = (event: MouseEvent) => {
      if (reduceMotion.matches || event.defaultPrevented || event.button !== 0) return;
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

      const id = beginTransition();
      targetPathname.current = destination.pathname;
      targetUrl.current = `${destination.pathname}${destination.search}`;

      // Keep stalled router transitions bounded; once the route commits, the
      // asset-specific bound allows its full eight-second load/decode window.
      failsafeTimer.current = window.setTimeout(() => finishTransition(id), ROUTE_COMMIT_CAP_MS);
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
  }, [beginTransition, clearPendingTimers, finishTransition, waitForCurrentPage]);

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
        <div className="loader-rail" aria-hidden="true">
          <span />
        </div>
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  );
}
