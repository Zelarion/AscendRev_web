import type { JSX } from 'react';
import Link from 'next/link';
import {
  EnvelopeSimple,
  FacebookLogo,
  LinkedinLogo,
  MapPin,
  Phone,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';
import { hoverTransitionStyle } from '@/lib/motion';
import { navItems } from '@/content/nav';
import { site } from '@/content/site';

const footerLinkClassName =
  'outline-none transition-colors duration-200 hover:text-[var(--navy-900)]';

export default function Footer(): JSX.Element {
  return (
    <footer
      data-tone="navy"
      className="relative isolate z-0 w-full overflow-hidden bg-white text-[var(--navy-900)] lg:sticky lg:bottom-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[0.12rem] -z-10 select-none whitespace-nowrap text-center font-display text-[clamp(3.4rem,16vw,5.4rem)] font-medium leading-[0.78] tracking-[-0.06em] text-[var(--ink)]/[0.045] sm:bottom-[-0.12em] sm:text-[clamp(6.5rem,17vw,20rem)] sm:leading-[0.72]"
      >
        ASCENDREV
      </div>

      <div className="relative z-10 h-[clamp(12rem,18vw,20rem)] w-full overflow-hidden bg-[#001c41]">
        <div className="relative h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- supplied white-gradient brand banner blends into the light footer. */}
          <img
            src="/images/ascendrev-footer-artwork.webp"
            alt=""
            width={2172}
            height={724}
            className="block h-full w-full object-cover object-[50%_60%]"
          />
          <Link
            href="/"
            aria-label="AscendRev home"
            className="absolute inset-y-0 left-0 z-10 w-[42%] outline-none"
          >
            <span className="sr-only">AscendRev home</span>
          </Link>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-[var(--site-gutter,clamp(1.25rem,5vw,5.5rem))] py-9 sm:py-14 lg:py-20">
        <div className="grid gap-8 border-b border-[var(--border)] pb-8 sm:gap-10 sm:pb-10 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:gap-10 lg:pb-12 xl:gap-14">
          <div className="md:col-span-2 lg:col-span-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">
                Direct Contact
              </p>

              <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--ink)] sm:mt-5 sm:space-y-4 sm:text-[15px]">
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
            <div className="mt-4 flex flex-col gap-1 text-sm text-[var(--ink-muted)] sm:mt-5 sm:gap-2 sm:text-[15px]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-11 items-center py-1 ${footerLinkClassName}`}
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
            <div className="mt-4 flex flex-col gap-1 text-sm text-[var(--ink-muted)] sm:mt-5 sm:gap-2 sm:text-[15px]">
              <Link href="/privacy" className={`inline-flex min-h-11 items-center py-1 ${footerLinkClassName}`} style={hoverTransitionStyle}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={`inline-flex min-h-11 items-center py-1 ${footerLinkClassName}`} style={hoverTransitionStyle}>
                Terms of Service
              </Link>

              {(site.linkedinUrl || site.facebookUrl) && (
                <div className="mt-1 flex items-center gap-3 sm:mt-2">
                  {site.linkedinUrl && (
                    <a
                      href={site.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--ink)] transition-[border-color,color,background-color] hover:border-[var(--border)] hover:bg-[var(--surface-band-raised)] hover:text-[var(--navy-900)] ${footerLinkClassName}`}
                      style={hoverTransitionStyle}
                      aria-label="LinkedIn"
                    >
                      <LinkedinLogo size={22} weight="regular" aria-hidden="true" />
                    </a>
                  )}

                  {site.facebookUrl && (
                    <a
                      href={site.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--ink)] transition-[border-color,color,background-color] hover:border-[var(--border)] hover:bg-[var(--surface-band-raised)] hover:text-[var(--navy-900)] ${footerLinkClassName}`}
                      style={hoverTransitionStyle}
                      aria-label="Facebook"
                    >
                      <FacebookLogo size={22} weight="regular" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-4 text-xs text-[var(--ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6">
          <p>© 2026 {site.companyName}. All rights reserved.</p>
          <p>Calgary, Alberta · Canada</p>
        </div>
      </div>
    </footer>
  );
}
