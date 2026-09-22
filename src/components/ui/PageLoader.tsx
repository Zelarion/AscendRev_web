'use client';

import { useEffect, useState, type JSX } from 'react';
import { usePathname } from 'next/navigation';

type LoaderPhase = 'entering' | 'leaving';

/**
 * A first-load transition only. The server sends the real page immediately so
 * the site is still complete with JavaScript disabled. Once hydrated, the
 * loader briefly brings the supplied city footage forward, then clears the
 * frame with a deliberate exit rather than leaving a permanent blocking layer.
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
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/video/hero-1280.mp4" media="(max-width: 767px)" type="video/mp4" />
        <source src="/video/hero-1920.mp4" type="video/mp4" />
      </video>

      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-black/25" />

      <div className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <span className="loader-brand relative isolate inline-flex items-center justify-center">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse 54% 58% at 50% 50%, rgba(255,255,255,.72) 0%, rgba(255,255,255,.38) 35%, rgba(255,255,255,.12) 60%, rgba(255,255,255,0) 82%)',
              mixBlendMode: 'screen',
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- static export
              keeps this loader asset free of an image-optimizer dependency. */}
          <img
            src="/ascendrev-logo.png"
            alt=""
            width={230}
            height={100}
            className="h-auto w-[clamp(12rem,30vw,14.375rem)]"
          />
        </span>
      </div>

      <style jsx>{`
        .page-loader {
          position: fixed;
          inset: 0;
          z-index: var(--z-modal);
          overflow: hidden;
          background: #0f1b33;
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
