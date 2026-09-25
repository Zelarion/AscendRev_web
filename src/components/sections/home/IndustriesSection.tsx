import type { JSX } from 'react';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import type { IndustriesContent } from '@/content/home';

interface IndustriesSectionProps {
  content: IndustriesContent;
}

/**
 * Client copy revision, 2026-09-24: this section used to be industry-group
 * tabs with stock photography, scroll-linked via IntersectionObserver. The
 * client replaced that entirely with a flat, nine-item revenue-gap Q&A grid
 * and required no external image dependencies, so the image panel, the
 * per-row observer, and the active/completed scroll states all went with it.
 * `RevealOnScroll` (already used by `TrustBand.tsx` for the same staggered
 * fade-in) covers the only motion this layout still needs.
 */
export default function IndustriesSection({ content }: IndustriesSectionProps): JSX.Element {
  return (
    <section
      id={content.id}
      className="relative overflow-hidden bg-[var(--surface-band)] px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(4rem,9vw,8rem)] text-[var(--text-primary)]"
    >
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="ml-auto max-w-[900px] text-right">
          <h2 className="ml-auto max-w-[18ch] font-display text-[clamp(2.45rem,9vw,3.6rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--navy-900)] md:text-[clamp(3.1rem,5.3vw,4.5rem)] lg:text-[clamp(3rem,5.8vw,6.2rem)] lg:leading-[0.96]">
            {content.heading}
          </h2>
          <p className="ml-auto mt-5 max-w-[66ch] text-[clamp(0.98rem,1.2vw,1.18rem)] leading-[1.7] text-[var(--text-muted)] md:mt-6 lg:mt-7 lg:leading-[1.75]">
            {content.intro}
          </p>
        </header>

        <p className="mx-auto mt-[clamp(3.5rem,6vw,5.5rem)] max-w-[900px] text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-text)] sm:text-xs">
          {content.subheading}
        </p>

        <RevealOnScroll
          as="ul"
          stagger
          delayMs={80}
          className="mx-auto mt-8 grid max-w-[1180px] grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 md:gap-x-10 md:gap-y-9 lg:mt-10 lg:grid-cols-3 lg:gap-y-10"
        >
          {content.items.map((item) => (
            <li key={item.question} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[var(--line-strong)] text-[15px] text-[var(--gold-text)] md:h-12 md:w-12"
              >
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[18px] font-semibold leading-snug text-[var(--text-primary)]">{item.question}</p>
                <p className="mt-2 text-[16px] leading-relaxed text-[var(--text-muted)]">{item.answer}</p>
              </div>
            </li>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
