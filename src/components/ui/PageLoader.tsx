'use client';

import { useEffect, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';

type LoaderPhase = 'entering' | 'leaving';

/**
 * A brief white transition between pages. The server sends the real page
 * immediately so the site remains complete with JavaScript disabled.
 */
export default function PageLoader(): JSX.Element | null {
  const pathname = usePathname();
  const [phase, setPhase] = useState<LoaderPhase | null>(null);

  useEffect(() => {
    if (pathname === '/') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    setPhase('entering');

    const exitTimer = window.setTimeout(() => setPhase('leaving'), 1050);
    const removeTimer = window.setTimeout(() => setPhase(null), 1750);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [pathname]);

  if (pathname === '/' || !phase) return null;

  return (
    <div
      className={`page-loader page-loader-${phase}`}
      aria-hidden="true"
      role="presentation"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 h-[clamp(7rem,16vw,9rem)] -translate-y-1/2 bg-[#001c41]"
      />
      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export
            keeps this loader asset free of an image-optimizer dependency. */}
        <img
          src="/new-logo.png"
          alt=""
          width={2048}
          height={682}
          className="relative z-10 h-auto w-[clamp(12rem,30vw,14.375rem)]"
        />
      </div>

      <style jsx>{`
        .page-loader {
          position: fixed;
          inset: 0;
          z-index: 2000;
          overflow: hidden;
          background: var(--surface-page);
          pointer-events: auto;
        }

        .page-loader-entering {
          animation: page-loader-enter 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .page-loader-leaving {
          pointer-events: none;
          animation: page-loader-exit 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes page-loader-enter {
          from {
            opacity: 0;
            clip-path: inset(100% 0 0 0);
          }
          to {
            opacity: 1;
            clip-path: inset(0 0 0 0);
          }
        }

        @keyframes page-loader-exit {
          from {
            opacity: 1;
            clip-path: inset(0 0 0 0);
          }
          to {
            opacity: 0;
            clip-path: inset(0 0 100% 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .page-loader {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
