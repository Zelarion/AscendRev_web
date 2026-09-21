import type { JSX } from 'react';
import Link from 'next/link';
import { LinkedinLogo } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { hoverTransitionStyle } from '@/lib/motion';
import { navItems } from '@/content/nav';
import { site } from '@/content/site';

// This component reads `@/content/site`, which src/content/** (owned by
// another agent) is expected to export as:
//   export const site: {
//     companyName: string;
//     contactEmail: string | null; // deliberately null per SPEC.md §7 item 2
//     phone?: string;
//     address?: string;
//     linkedinUrl?: string;
//     slaLine?: string; // plain-language response/SLA line, mono `label` style
//   };
// Every field beyond `contactEmail` is read defensively (optional-chained /
// conditionally rendered) so this component doesn't throw if content.ts
// ships without one of them, but the shape above is the real contract.
// See the build report for why this couldn't be pinned any tighter.

// Focus-ring colour comes from globals.css's `[data-tone='navy']
// :focus-visible` rule (steel-400), triggered by the `data-tone="navy"`
// attribute on <footer> below, not set per-link here. See Header.tsx for
// the fuller explanation of why that rule wins over any Tailwind utility.
const legalLinkClassName = 'outline-none transition-colors hover:text-white';

export default function Footer(): JSX.Element {
  return (
    <footer data-tone="navy" className="w-full bg-[var(--navy-900)] text-[var(--steel-400)]">
      <div className="mx-auto max-w-[1200px] px-[clamp(1.25rem,5vw,4rem)] py-16">
        <div className="grid gap-12 border-b border-[var(--border-navy)] pb-12 md:grid-cols-3">
          <div>
            <p className="text-lg font-medium text-white">{site.companyName}</p>

            <div className="mt-4 space-y-2 text-sm">
              {/* site.contactEmail is deliberately null until §7 item 2 (the
                  wrong-domain address) is resolved with the client, do not
                  invent or hardcode a fallback address here. */}
              {site.contactEmail && (
                <p>
                  <a
                    href={`mailto:${site.contactEmail}`}
                    className={legalLinkClassName}
                    style={hoverTransitionStyle}
                  >
                    {site.contactEmail}
                  </a>
                </p>
              )}
              {site.phone && <p>{site.phone}</p>}
              {site.address && <p>{site.address}</p>}
            </div>

            {site.linkedinUrl && (
              <a
                href={site.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AscendRev on LinkedIn"
                className={cn('mt-4 inline-flex h-11 w-11 items-center justify-center', legalLinkClassName)}
                style={hoverTransitionStyle}
              >
                <LinkedinLogo size={24} weight="regular" />
              </a>
            )}
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={legalLinkClassName} style={hoverTransitionStyle}>
                {item.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Legal" className="flex flex-col gap-3 text-sm">
            <Link href="/privacy" className={legalLinkClassName} style={hoverTransitionStyle}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={legalLinkClassName} style={hoverTransitionStyle}>
              Terms of Service
            </Link>
          </nav>
        </div>

        {/* The SLA/response-time trust line, in the mono `label` style
            (DESIGN.md §2: Plex Mono 500, 0.75rem, tracking 0.06em,
            uppercase). Per SPEC.md §7 item 7, this must be a plain factual
            sentence, "Data handled under executive compliance" is banned
            as meaningless copy, not this component's call to rewrite. */}
        {site.slaLine && (
          <p className="mt-8 font-mono text-[0.75rem] font-medium uppercase leading-[1.4] tracking-[0.06em]">
            {site.slaLine}
          </p>
        )}
      </div>
    </footer>
  );
}
