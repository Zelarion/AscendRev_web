'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { usePathname } from 'next/navigation';
import type Lenis from 'lenis';

const HEADER_OFFSET = 80;
const CROSS_ROUTE_ANCHOR_DELAY_MS = 140;
const CROSS_ROUTE_ANCHOR_DURATION_SECONDS = 1.6;
const PENDING_ROUTE_ANCHOR_KEY = 'ascendrev:pending-route-anchor';

interface PendingRouteAnchor {
  pathname: string;
  hash: string;
  createdAt: number;
}

function consumePendingRouteAnchor(pathname: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_ROUTE_ANCHOR_KEY);
    if (!raw) return null;

    window.sessionStorage.removeItem(PENDING_ROUTE_ANCHOR_KEY);
    const pending = JSON.parse(raw) as Partial<PendingRouteAnchor>;
    if (
      pending.pathname !== pathname ||
      typeof pending.hash !== 'string' ||
      !pending.hash.startsWith('#') ||
      typeof pending.createdAt !== 'number' ||
      Date.now() - pending.createdAt > 15_000
    ) return null;

    return pending.hash;
  } catch {
    return null;
  }
}

/**
 * Resets scroll to the top after a real route change.
 *
 * If that route change also carries a hash (for example navigating from
 * `/solutions/` to `/#revenue-impact`), the new page first resets to the top and
 * then smoothly scrolls to the requested section once its DOM is mounted. The
 * pending hash is also stored by Header so the target survives router timing.
 * Hash-only navigation within the same page is left to Lenis' normal anchor
 * handling because the pathname does not change.
 */
export default function useScrollToTop(lenisRef: RefObject<Lenis | null>): void {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    let targetFrame = 0;
    let anchorTimer = 0;
    const pendingHash = consumePendingRouteAnchor(pathname);

    const frame = window.requestAnimationFrame(() => {
      const lenis = lenisRef.current;
      const hash = pendingHash ?? window.location.hash;

      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }

      if (!hash) return;

      // Give the new page a brief moment visibly parked at the very top before
      // starting the cross-route anchor journey. The explicit Lenis duration is
      // intentional: browser-native smooth scrolling can finish almost
      // instantly on long pages, which makes this transition feel like a jump.
      anchorTimer = window.setTimeout(() => {
        targetFrame = window.requestAnimationFrame(() => {
          const id = decodeURIComponent(hash.slice(1));
          const target = document.getElementById(id);
          if (!target) return;

          if (lenisRef.current) {
            lenisRef.current.scrollTo(target, {
              offset: -HEADER_OFFSET,
              duration: CROSS_ROUTE_ANCHOR_DURATION_SECONDS,
              force: true,
            });
            return;
          }

          const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
          window.scrollTo({ top, left: 0, behavior: 'smooth' });
        });
      }, CROSS_ROUTE_ANCHOR_DELAY_MS);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (anchorTimer) window.clearTimeout(anchorTimer);
      if (targetFrame) window.cancelAnimationFrame(targetFrame);
    };
  }, [pathname, lenisRef]);
}
