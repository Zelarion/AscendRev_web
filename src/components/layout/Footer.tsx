import type { JSX } from 'react';
import Link from 'next/link';
import {
  EnvelopeSimple,
  LinkedinLogo,
  MapPin,
  Phone,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';
import { hoverTransitionStyle } from '@/lib/motion';
import { navItems } from '@/content/nav';
import { site } from '@/content/site';

const footerLinkClassName =
  'outline-none transition-colors duration-200 hover:text-white';

export default function Footer(): JSX.Element {
  return (
    <footer
      data-tone="navy"
      className="relative isolate z-0 w-full overflow-hidden bg-[var(--navy-900)] text-white lg:sticky lg:bottom-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[0.12rem] -z-10 select-none whitespace-nowrap text-center font-display text-[clamp(3.9rem,16vw,5.4rem)] font-medium leading-[0.78] tracking-[-0.06em] text-white/[0.05] sm:bottom-[-0.12em] sm:text-[clamp(6.5rem,17vw,20rem)] sm:leading-[0.72]"
      >
        ASCENDREV
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1540px] px-[clamp(1.25rem,5vw,5.5rem)] py-10 sm:py-16 lg:py-20">
        <div className="grid gap-8 border-b border-white/10 pb-9 sm:gap-10 sm:pb-12 lg:grid-cols-[2fr_1fr_1fr] lg:gap-10 xl:gap-14">
          <div>
            <Link
              href="/"
              aria-label="AscendRev home"
              className="inline-flex items-center outline-none"
            >
              <span className="relative isolate inline-flex items-center">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-x-5 -inset-y-3 -z-10 rounded-full blur-[14px]"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.24) 42%, rgba(255,255,255,0.07) 66%, rgba(255,255,255,0) 82%)',
                  }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- static export keeps the transparent logo asset simple. */}
                <img
                  src="/ascendrev-logo.png"
                  alt="AscendRev"
                  width={220}
                  height={72}
                  className="h-[58px] w-auto object-contain sm:h-[64px]"
                />
              </span>
            </Link>

            <div className="mt-6 sm:mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-300)]">
                Direct Contact
              </p>

              <div className="mt-4 space-y-3 text-sm leading-relaxed text-white/72 sm:mt-5 sm:space-y-4 sm:text-[15px]">
                <a
                  href={`mailto:${site.contactEmail}`}
                  className={`flex max-w-fit items-start gap-3 ${footerLinkClassName}`}
                  style={hoverTransitionStyle}
                >
                  <EnvelopeSimple size={19} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-white/52" />
                  <span>{site.contactEmail}</span>
                </a>

                <a
                  href="tel:+14039032912"
                  className={`flex max-w-fit items-start gap-3 ${footerLinkClassName}`}
                  style={hoverTransitionStyle}
                >
                  <Phone size={19} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-white/52" />
                  <span>{site.phone}</span>
                </a>

                <div className="flex max-w-[620px] items-start gap-3">
                  <MapPin size={19} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-white/52" />
                  <span>Onshore Head Office: {site.address}</span>
                </div>
              </div>
            </div>

            {site.slaLine && (
              <div className="mt-6 flex max-w-[760px] items-start gap-3 border-t border-white/10 pt-5 text-sm leading-relaxed text-white/72 sm:mt-8 sm:pt-6 sm:text-[15px]">
                <ShieldCheck size={22} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--gold-300)]" />
                <p className="font-medium text-white/88">{site.slaLine}</p>
              </div>
            )}
          </div>

          <nav aria-label="Footer internal sections">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-300)]">
              Internal Sections
            </p>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/64 sm:mt-5 sm:gap-3 sm:text-[15px]">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={footerLinkClassName}
                  style={hoverTransitionStyle}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <nav aria-label="Footer legal links">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-300)]">
              Links
            </p>
            <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/64 sm:mt-5 sm:gap-3 sm:text-[15px]">
              <Link href="/privacy" className={footerLinkClassName} style={hoverTransitionStyle}>
                Privacy Policy
              </Link>
              <Link href="/terms" className={footerLinkClassName} style={hoverTransitionStyle}>
                Terms of Service
              </Link>

              {site.linkedinUrl && (
                <a
                  href={site.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-white/72 transition-[border-color,color,background-color] hover:border-white/30 hover:bg-white/5 hover:text-white sm:mt-2 sm:h-11 sm:w-11 ${footerLinkClassName}`}
                  style={hoverTransitionStyle}
                  aria-label="LinkedIn"
                >
                  <LinkedinLogo size={22} weight="regular" aria-hidden="true" />
                </a>
              )}
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-5 text-xs text-white/38 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-7">
          <p>© 2026 {site.companyName}. All rights reserved.</p>
          <p>Calgary, Alberta · Canada</p>
        </div>
      </div>
    </footer>
  );
}
