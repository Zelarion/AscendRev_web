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
      data-tone="navy"
      className="relative overflow-hidden bg-[var(--navy-900)] px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(6rem,11vw,10rem)] text-white"
    >
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="mx-auto max-w-[900px] text-center">
          <h2 className="mx-auto max-w-[18ch] font-display text-[clamp(3rem,5.8vw,6.2rem)] font-medium leading-[0.96] tracking-[-0.04em] text-white">
            {content.heading}
          </h2>
          <p className="mx-auto mt-7 max-w-[66ch] text-[clamp(1rem,1.2vw,1.18rem)] leading-[1.75] text-white/64">
            {content.intro}
          </p>
        </header>

        <p className="mx-auto mt-[clamp(3.5rem,6vw,5.5rem)] max-w-[900px] text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-300)] sm:text-xs">
          {content.subheading}
        </p>

        <RevealOnScroll
          as="ul"
          stagger
          delayMs={80}
          className="mx-auto mt-10 grid max-w-[1180px] grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {content.items.map((item) => (
            <li key={item.question} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--gold-400)]/40 text-[15px] text-[var(--gold-300)]"
              >
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-snug text-white">{item.question}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/64">{item.answer}</p>
              </div>
            </li>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
