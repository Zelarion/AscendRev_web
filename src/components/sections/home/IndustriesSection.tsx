import type { JSX } from 'react';
import {
  ArrowUpRight,
  ArrowsClockwise,
  Buildings,
  ChartLineUp,
  CurrencyCircleDollar,
  GearSix,
  Headset,
  Lightning,
  Target,
} from '@phosphor-icons/react/dist/ssr';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import type { IndustriesContent, IndustryIcon } from '@/content/home';

interface IndustriesSectionProps {
  content: IndustriesContent;
}

const INDUSTRY_ICONS = {
  leads: Target,
  'sales-capacity': Lightning,
  'customer-service': Headset,
  'follow-up': ArrowUpRight,
  operations: GearSix,
  retention: ArrowsClockwise,
  scale: Buildings,
  receivables: CurrencyCircleDollar,
  growth: ChartLineUp,
} satisfies Record<IndustryIcon, typeof Target>;

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
      className="relative scroll-mt-[var(--header-height)] overflow-hidden bg-[var(--surface-band)] px-[clamp(1.25rem,5vw,5.5rem)] pt-5 pb-[clamp(4rem,9vw,8rem)] text-[var(--text-primary)] md:pt-6"
    >
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="w-full text-left">
          <h2 className="font-display text-h2 text-[var(--navy-900)]">
            {content.heading}
          </h2>
          <p className="mt-5 w-full text-body-lg text-[var(--text-muted)] md:mt-6 lg:mt-7">
            {content.intro}
          </p>
        </header>

        <div className="mx-auto mt-[clamp(2rem,3vw,2.5rem)] flex max-w-[900px] items-center justify-center gap-4 text-center">
          <span aria-hidden="true" className="h-px w-8 bg-[var(--gold-text)] sm:w-12" />
          <p className="text-body-lg text-[var(--navy-900)]">
            {content.subheading}
          </p>
          <span aria-hidden="true" className="h-px w-8 bg-[var(--gold-text)] sm:w-12" />
        </div>

        <RevealOnScroll
          as="ul"
          stagger
          delayMs={80}
          className="mt-6 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:mt-7 lg:grid-cols-3"
        >
          {content.items.map((item) => {
            const Icon = INDUSTRY_ICONS[item.icon];
            return (
              <li key={item.question} className="flex h-full items-start gap-4 rounded-xl border border-[var(--line)] bg-white/75 p-4 shadow-[0_8px_28px_rgba(11,31,59,0.045)] sm:gap-5 sm:p-5">
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface-band)] text-[var(--gold-text)] sm:h-16 sm:w-16"
                >
                  <Icon aria-hidden="true" size={28} weight="regular" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-h3 text-[var(--text-primary)]">{item.question}</h3>
                  <p className="mt-2 text-body text-[var(--text-muted)]">{item.answer}</p>
                </div>
              </li>
            );
          })}
        </RevealOnScroll>
      </div>
    </section>
  );
}
