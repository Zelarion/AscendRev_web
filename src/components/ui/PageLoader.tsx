'use client';

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';
import LoaderMotionMark from '@/components/ui/LoaderMotionMark';

type LoaderPhase = 'boot' | 'entering' | 'leaving';

const BOOT_MINIMUM_DISPLAY_MS = 120;
const CACHED_BOOT_MINIMUM_DISPLAY_MS = 0;
// Route assets must settle before the cover leaves; no extra fixed dwell is
// added after they are ready.
const ROUTE_MINIMUM_DISPLAY_MS = 0;
const ASSET_WAIT_CAP_MS = 8_000;
const TRANSITION_HARD_CAP_MS = 10_000;
const ROUTE_COMMIT_CAP_MS = 6_000;
const COLD_DOM_STABILITY_MS = 180;
const WARM_DOM_STABILITY_MS = 40;

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
        // A decode rejection is terminal only once the fetch itself settled.
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
      if (typeof image.decode === 'function') image.decode().then(finish, finish);
      else finish();
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
 * Promote native lazy images before releasing the loader, then wait for current
 * and newly inserted images, CSS backgrounds, video posters and document fonts.
 * Warm routes use a shorter DOM quiet window, but never skip a pending asset.
 */
async function waitForPageAssets(stabilityMs: number): Promise<boolean> {
  const startedAt = performance.now();
  const deadlineAt = startedAt + ASSET_WAIT_CAP_MS;
  const pendingAssets = new Set<Promise<void>>();
  const seenUrls = new Set<string>();
  const imageSources = new WeakMap<HTMLImageElement, string>();
  let lastDomChangeAt = startedAt;

  const track = (asset: Promise<unknown>) => {
    const settledAsset = asset.then(() => undefined, () => undefined);
    pendingAssets.add(settledAsset);
    void settledAsset.then(() => pendingAssets.delete(settledAsset));
  };

  const trackFonts = () => {
    track(document.fonts.ready);
  };

  const scanImage = (image: HTMLImageElement) => {
    if (!image.getAttribute('src') && !image.getAttribute('srcset')) return;
    const sourceKey = `${image.getAttribute('src') ?? ''}\u0000${image.getAttribute('srcset') ?? ''}\u0000${image.getAttribute('sizes') ?? ''}`;
    if (imageSources.get(image) === sourceKey) return;
    imageSources.set(image, sourceKey);

    const wasLazy = image.loading === 'lazy';
    image.loading = 'eager';
    if (wasLazy && image.fetchPriority === 'auto') image.fetchPriority = 'low';
    track(waitForImageElement(image));
  };

  const addUrl = (value: string) => {
    try {
      const url = new URL(value, document.baseURI);
      if (url.protocol === 'data:' || url.protocol === 'blob:') return;
      if (seenUrls.has(url.href)) return;
      seenUrls.add(url.href);
      track(preloadUrl(url.href));
    } catch {
      // Ignore a malformed optional decoration; the page remains usable.
    }
  };

  const scanElement = (element: Element) => {
    if (element instanceof HTMLImageElement) scanImage(element);
    if (element instanceof HTMLSourceElement) {
      const image = element.parentElement?.querySelector('img');
      if (image) scanImage(image);
    }
    if (element instanceof HTMLVideoElement && element.poster) addUrl(element.poster);

    const styles = [
      window.getComputedStyle(element),
      window.getComputedStyle(element, '::before'),
      window.getComputedStyle(element, '::after'),
    ];

    for (const style of styles) {
      for (const url of extractCssUrls(style.backgroundImage)) addUrl(url);
    }
  };

  const scanTree = (root: Element) => {
    scanElement(root);
    for (const element of Array.from(root.querySelectorAll('*'))) scanElement(element);
  };

  const observer = new MutationObserver((mutations) => {
    lastDomChangeAt = performance.now();

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of Array.from(mutation.addedNodes)) {
          if (!(node instanceof Element)) continue;
          if (node instanceof HTMLStyleElement || (node instanceof HTMLLinkElement && node.rel === 'stylesheet')) {
            scanTree(document.documentElement);
            trackFonts();
          } else {
            scanTree(node);
          }
        }
        continue;
      }

      if (!(mutation.target instanceof Element)) continue;
      const target = mutation.target;
      const stylesheetChanged = target instanceof HTMLStyleElement
        || (target instanceof HTMLLinkElement && target.rel === 'stylesheet');
      if (stylesheetChanged) {
        scanTree(document.documentElement);
        trackFonts();
      } else {
        scanTree(target);
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'src', 'srcset', 'sizes', 'media', 'loading', 'poster', 'href', 'rel'],
  });
  scanTree(document.documentElement);
  addUrl('/ascendrev-loader-logo-transparent.png');
  trackFonts();

  let timeoutId: number | undefined;
  let stabilityPollId: number | undefined;
  const pageAssetsSettled = new Promise<boolean>((resolve) => {
    const checkForStability = () => {
      if (pendingAssets.size === 0 && performance.now() - lastDomChangeAt >= stabilityMs) {
        resolve(true);
        return;
      }
      stabilityPollId = window.setTimeout(checkForStability, 25);
    };
    checkForStability();
  });

  const assetsSettled = await Promise.race([
    pageAssetsSettled,
    new Promise<boolean>((resolve) => {
      const remaining = Math.max(0, deadlineAt - performance.now());
      timeoutId = window.setTimeout(() => resolve(false), remaining);
    }),
  ]);

  observer.disconnect();
  if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  if (stabilityPollId !== undefined) window.clearTimeout(stabilityPollId);
  return assetsSettled;
}

/**
 * A server-rendered first-paint cover and route-transition cover. The early
 * head bootstrap owns the initial ten-second lease, so failed hydration still
 * releases the server-rendered overlay.
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
  const isBootTransition = useRef(true);
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

    const timeUntilHardCap = TRANSITION_HARD_CAP_MS
      - (performance.now() - transitionStartedAt.current);
    if (timeUntilHardCap <= 300) {
      delete document.documentElement.dataset.ascendrevLoader;
      delete document.documentElement.dataset.ascendrevLoaderStartedAt;
      delete document.documentElement.dataset.ascendrevLoaderFast;
      setPhase(null);
      return;
    }

    const warmTransition = document.documentElement.dataset.ascendrevLoaderFast === 'true';
    const leaveDuration = warmTransition ? 70 : 180;
    setPhase((current) => (current ? 'leaving' : null));
    leaveTimer.current = window.setTimeout(() => {
      if (transitionId.current !== id) return;
      leaveTimer.current = null;
      delete document.documentElement.dataset.ascendrevLoaderFast;
      delete document.documentElement.dataset.ascendrevLoaderStartedAt;
      setPhase(null);
    }, leaveDuration);
  }, []);

  const beginTransition = useCallback(() => {
    clearPendingTimers();
    transitionId.current += 1;
    transitionStartedAt.current = performance.now();
    assetWaitStartedFor.current = null;
    finishedTransitionFor.current = null;
    isBootTransition.current = false;
    delete document.documentElement.dataset.ascendrevLoaderFast;
    const id = transitionId.current;
    setPhase('entering');
    return id;
  }, [clearPendingTimers]);

  const waitForCurrentPage = useCallback((id: number) => {
    if (assetWaitStartedFor.current === id) return;
    assetWaitStartedFor.current = id;

    if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current);
    const remainingHardCap = Math.max(
      0,
      TRANSITION_HARD_CAP_MS - (performance.now() - transitionStartedAt.current)
    );
    failsafeTimer.current = window.setTimeout(
      () => finishTransition(id),
      remainingHardCap
    );

    let warmTransition = document.documentElement.dataset.ascendrevLoaderFast === 'true';
    if (!isBootTransition.current) {
      try {
        warmTransition = sessionStorage.getItem('ascendrev-loader-visited') === '1';
      } catch {
        warmTransition = false;
      }
    }

    void waitForPageAssets(warmTransition ? WARM_DOM_STABILITY_MS : COLD_DOM_STABILITY_MS)
      .catch(() => false)
      .then((assetsSettled) => {
        if (transitionId.current !== id || finishedTransitionFor.current === id) return;
        if (isBootTransition.current && assetsSettled) {
          try {
            sessionStorage.setItem('ascendrev-loader-visited', '1');
          } catch {
            // The loader still works when browser storage is unavailable.
          }
        }
        if (!isBootTransition.current && assetsSettled) {
          // This only shortens the fade after every scanned asset has settled.
          // Uncached images, fonts and CSS art continue to hold the cover.
          document.documentElement.dataset.ascendrevLoaderFast = 'true';
        }
      })
      .finally(() => {
        if (transitionId.current !== id || finishedTransitionFor.current === id) return;
        const elapsed = performance.now() - transitionStartedAt.current;
        const fastBoot = isBootTransition.current
          && document.documentElement.dataset.ascendrevLoaderFast === 'true';
        const minimumDisplay = isBootTransition.current
          ? (fastBoot ? CACHED_BOOT_MINIMUM_DISPLAY_MS : BOOT_MINIMUM_DISPLAY_MS)
          : ROUTE_MINIMUM_DISPLAY_MS;
        const remaining = Math.max(0, minimumDisplay - elapsed);
        leaveTimer.current = window.setTimeout(() => finishTransition(id), remaining);
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
    const id = transitionId.current;
    const bootStartedAt = Number(loaderRoot.dataset.ascendrevLoaderStartedAt);
    transitionStartedAt.current = Number.isFinite(bootStartedAt)
      ? bootStartedAt
      : performance.now();
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
      // Same-page anchors (including Revenue Impact) scroll normally and do
      // not start a second loading cover.
      if (destination.pathname === current.pathname && destination.search === current.search) return;

      const destinationUrl = `${destination.pathname}${destination.search}`;
      if (targetPathname.current === destination.pathname && targetUrl.current === destinationUrl) return;

      const id = beginTransition();
      targetPathname.current = destination.pathname;
      targetUrl.current = destinationUrl;
      failsafeTimer.current = window.setTimeout(
        () => finishTransition(id),
        ROUTE_COMMIT_CAP_MS
      );

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
        <span className="sr-only">Loading page</span>
      </div>
    </div>
  );
}