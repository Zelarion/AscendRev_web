'use client';

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';

type LoaderPhase = 'entering' | 'leaving';

/**
 * A short branded route transition. The transparent logo sits directly over
 * the navy glow (no opaque logo tile), with an indeterminate progress rail.
 * App Router exposes the completed pathname rather than a pending-navigation
 * event, so this is deliberately a brief transition and never delays routing.
 */
export default function PageLoader(): JSX.Element | null {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const targetPathname = useRef<string | null>(null);
  const targetUrl = useRef<string | null>(null);
  const failsafeTimer = useRef<number | null>(null);
  const queryPollTimer = useRef<number | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const [phase, setPhase] = useState<LoaderPhase | null>(null);

  const clearPendingTimers = useCallback(() => {
    if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current);
    if (queryPollTimer.current !== null) window.clearInterval(queryPollTimer.current);
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    failsafeTimer.current = null;
    queryPollTimer.current = null;
    leaveTimer.current = null;
  }, []);

  const finishTransition = useCallback(() => {
    if (failsafeTimer.current !== null) window.clearTimeout(failsafeTimer.current);
    failsafeTimer.current = null;
    if (queryPollTimer.current !== null) window.clearInterval(queryPollTimer.current);
    queryPollTimer.current = null;
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    targetPathname.current = null;
    targetUrl.current = null;
    setPhase((current) => (current ? 'leaving' : null));
    leaveTimer.current = window.setTimeout(() => {
      leaveTimer.current = null;
      setPhase(null);
    }, 300);
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (targetPathname.current !== null) finishTransition();
  }, [finishTransition, pathname]);

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

      clearPendingTimers();
      targetPathname.current = destination.pathname;
      targetUrl.current = `${destination.pathname}${destination.search}`;
      setPhase('entering');

      // App Router has no public navigation-pending event. A pathname commit
      // completes normal route changes; query-only changes are detected from
      // the URL. This upper bound protects against rejected or stalled routes.
      failsafeTimer.current = window.setTimeout(finishTransition, 6000);
      if (destination.pathname === current.pathname) {
        queryPollTimer.current = window.setInterval(() => {
          const location = `${window.location.pathname}${window.location.search}`;
          if (location === targetUrl.current) finishTransition();
        }, 80);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      clearPendingTimers();
    };
  }, [clearPendingTimers, finishTransition]);

  if (!phase) return null;

  return (
    <div
      className={`page-loader page-loader-${phase}`}
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      aria-busy={phase === 'entering'}
    >
      <div className="loader-glow" aria-hidden="true" />
      <div className="loader-content">
        {/* eslint-disable-next-line @next/next/no-img-element -- Static asset
            keeps this small transition independent from image optimization. */}
        <img
          src="/ascendrev-loader-logo-transparent.png"
          alt=""
          width={2172}
          height={724}
          className="loader-logo"
        />
        <div className="loader-rail" aria-hidden="true">
          <span />
        </div>
        <span className="sr-only">Loading page</span>
      </div>

      <style jsx>{`
        .page-loader {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          overflow: hidden;
          background: #061d3c;
          pointer-events: none;
          animation: loader-enter 160ms ease-out both;
        }

        .page-loader-leaving {
          animation: loader-exit 300ms cubic-bezier(0.4, 0, 1, 1) both;
        }

        .loader-glow {
          position: absolute;
          width: min(74vw, 40rem);
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 111, 207, 0.28), rgba(0, 54, 111, 0.1) 43%, transparent 72%);
          animation: loader-breathe 1.15s ease-in-out infinite alternate;
        }

        .loader-content {
          position: relative;
          z-index: 1;
          display: flex;
          width: min(72vw, 24rem);
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .loader-logo {
          display: block;
          width: clamp(12rem, 32vw, 20rem);
          height: auto;
          filter: drop-shadow(0 0 1.25rem rgba(0, 177, 235, 0.2));
          animation: loader-logo-pulse 1.2s ease-in-out infinite alternate;
        }

        .loader-rail {
          position: relative;
          width: min(100%, 18rem);
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(226, 237, 248, 0.2);
        }

        .loader-rail span {
          position: absolute;
          inset: 0 auto 0 -42%;
          width: 42%;
          border-radius: inherit;
          background: linear-gradient(90deg, #00b8a9, #e5bd45 72%);
          animation: loader-progress 850ms cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        @keyframes loader-enter {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes loader-exit {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes loader-breathe {
          from { transform: scale(0.94); opacity: 0.68; }
          to { transform: scale(1.04); opacity: 1; }
        }

        @keyframes loader-logo-pulse {
          from { opacity: 0.84; transform: scale(0.985); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes loader-progress {
          from { transform: translateX(0); }
          to { transform: translateX(340%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .page-loader,
          .page-loader-leaving,
          .loader-glow,
          .loader-logo,
          .loader-rail span {
            animation: none;
          }

          .page-loader-leaving { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
