import type { JSX } from 'react';
import Link from 'next/link';
import BackToTop from '@/components/layout/BackToTop';
import {
  EnvelopeSimple,
  MapPin,
  Phone,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';
import { hoverTransitionStyle } from '@/lib/motion';
import { navItems } from '@/content/nav';
import { site } from '@/content/site';

const footerLinkClassName =
  'outline-none transition-colors duration-200 hover:text-[var(--navy-900)] focus-visible:text-[var(--navy-900)]';

export default function Footer(): JSX.Element {
  return (
    <footer
      id="ascendrev-site-footer"
      data-site-footer
      data-tone="navy"
      className="relative isolate z-0 flex min-h-[100vh] min-h-[100svh] w-full flex-col overflow-hidden bg-white text-[var(--navy-900)]"
    >
      <style>{`
        #ascendrev-site-footer {
          view-timeline-name: --ascendrev-footer-view;
          view-timeline-axis: block;
        }

        @keyframes ascendrev-footer-rise {
          from { opacity: 0; transform: translateY(1.5rem); }
          to { opacity: 1; transform: translateY(0); }
        }

        @supports (animation-timeline: view()) {
          #ascendrev-site-footer .footer-rise-content {
            animation: ascendrev-footer-rise 1s linear both;
            animation-timeline: --ascendrev-footer-view;
            animation-range: entry 0% entry 90%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          #ascendrev-site-footer .footer-rise-content {
            animation: none !important;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[0.12rem] -z-10 select-none whitespace-nowrap text-center font-display text-[clamp(3.4rem,16vw,5.4rem)] font-medium leading-[0.78] tracking-[-0.06em] text-[var(--ink)]/[0.045] sm:bottom-[-0.12em] sm:text-[clamp(6.5rem,17vw,20rem)] sm:leading-[0.72]"
      >
        ASCENDREV
      </div>

      <div className="footer-rise-content relative z-10 h-[clamp(12rem,18vw,20rem)] w-full overflow-hidden bg-[#001c41] max-[480px]:h-auto max-[480px]:aspect-[810/544]">
        <div className="absolute inset-0">
          {/*
            The full artwork is 3:1 with the logo in its left third. Squeezed into a phone
            it was cropped (the logo mark and the "A" were cut off) and, once fitted, the
            tagline was too small to read. Phones therefore get a tighter crop of the same
            artwork (810x544) in which the logo fills the width. From 480px the wide
            artwork is used, left-anchored below sm so the logo is never clipped.
          */}
          <picture>
            <source media="(max-width: 479.98px)" srcSet="/images/ascendrev-footer-artwork-mobile.webp" width={810} height={544} />
            <img
              src="/images/ascendrev-footer-artwork.webp"
              alt=""
              width={2172}
              height={724}
              className="block h-full w-full object-cover object-[0%_60%] sm:object-[50%_60%]"
            />
          </picture>
          <Link
            href="/"
            aria-label="AscendRev home"
            className="absolute inset-y-0 left-0 z-10 w-[42%] outline-none"
          >
            <span className="sr-only">AscendRev home</span>
          </Link>
        </div>
      </div>

      <div className="footer-rise-content relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-[var(--site-gutter,clamp(1.25rem,5vw,5.5rem))] py-8 sm:py-10 lg:py-12">
        <div className="grid gap-6 border-b border-[var(--border)] pb-7 sm:gap-8 sm:pb-8 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:gap-8 lg:pb-9 xl:gap-10">
          <div className="md:col-span-2 lg:col-span-1">
            <div>
              <p className="max-w-[42ch] text-sm leading-relaxed text-[var(--ink)] sm:text-[15px]">
                <strong className="block font-semibold text-[var(--navy-900)]">AscendRev Outsourcing Services Corp.</strong>
                <span>Canadian-based revenue, customer experience and business operations partner providing dedicated teams for North American companies.</span>
              </p>

              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">
                Direct Contact
              </p>

              <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--ink)] sm:mt-4 sm:space-y-3 sm:text-[15px]">
                <a
                  href={`mailto:${site.contactEmail}`}
                  className={`flex max-w-fit items-start gap-3 ${footerLinkClassName}`}
                  style={hoverTransitionStyle}
                >
                  <EnvelopeSimple size={19} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
                  <span className="break-words">{site.contactEmail}</span>
                </a>

                <a
                  href="tel:+14039032912"
                  className={`flex max-w-fit items-start gap-3 ${footerLinkClassName}`}
                  style={hoverTransitionStyle}
                >
                  <Phone size={19} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
                  <span>{site.phone}</span>
                </a>

                <div className="flex max-w-[620px] items-start gap-3">
                  <MapPin size={19} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
                  <span>HQ: {site.address}</span>
                </div>

                <div className="flex max-w-[620px] items-start gap-3">
                  <MapPin size={19} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--ink-muted)]" />
                  <span>Alabang Office: {site.philippinesOfficeAddress}</span>
                </div>
              </div>
            </div>

            {site.slaLine && (
              <div className="mt-6 flex max-w-[760px] items-start gap-3 border-t border-[var(--border)] pt-5 text-sm leading-relaxed text-[var(--ink)] sm:mt-8 sm:pt-6 sm:text-[15px]">
                <ShieldCheck size={22} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--gold-text)]" />
                <p className="font-medium text-[var(--ink)]">{site.slaLine}</p>
              </div>
            )}
          </div>

          <nav aria-label="Footer internal sections">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">
              Internal Sections
            </p>
            <div className="mt-3 flex flex-col gap-0 text-sm text-[var(--ink-muted)] sm:mt-4 sm:gap-0.5 sm:text-[15px]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-8 items-center ${footerLinkClassName}`}
                  style={hoverTransitionStyle}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav aria-label="Footer legal links">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">
              Links
            </p>
            <div className="mt-3 flex flex-col gap-0 text-sm text-[var(--ink-muted)] sm:mt-4 sm:gap-0.5 sm:text-[15px]">
              <Link href="/privacy" className={`inline-flex min-h-8 items-center ${footerLinkClassName}`} style={hoverTransitionStyle}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={`inline-flex min-h-8 items-center ${footerLinkClassName}`} style={hoverTransitionStyle}>
                Terms of Service
              </Link>
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-4 text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6">
          <p>© 2026 {site.companyName} All rights reserved.</p>
          <p>Calgary, Alberta · Canada</p>
        </div>
      </div>

      <BackToTop />
    </footer>
  );
}
