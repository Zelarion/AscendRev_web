import type { JSX } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import type { ClosingBandContent } from '@/content/home';

interface ClosingBandProps {
  content: ClosingBandContent;
}

export default function ClosingBand({ content }: ClosingBandProps): JSX.Element {
  return (
    <section
      className="relative isolate min-h-[250px] overflow-hidden border-t border-[var(--line)] bg-[var(--surface-band)] text-[var(--text-primary)] sm:min-h-[280px] lg:min-h-[300px]"
    >
      <div className="relative z-[1] mx-auto grid min-h-[250px] w-full max-w-[1280px] items-center gap-10 px-[clamp(1.5rem,5vw,4.5rem)] py-10 sm:min-h-[280px] sm:py-12 lg:min-h-[300px] lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:py-14">
        <RevealOnScroll>
          <p className="mb-4 text-[10px] font-semibold tracking-[0.2em] text-[var(--gold-text)] sm:text-[11px]">
            LET&apos;S TALK
          </p>
          <h2 className="max-w-[18ch] font-display text-[clamp(2.35rem,4vw,4.65rem)] font-medium leading-[0.98] tracking-[-0.035em] text-[var(--navy-900)]">
            {content.heading}
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delayMs={100} className="lg:max-w-[470px] lg:justify-self-end">
          {content.body.trim() ? (
            <p className="max-w-[42ch] text-[clamp(0.95rem,1.15vw,1.12rem)] leading-[1.6] text-[var(--text-muted)]">
              {content.body}
            </p>
          ) : null}
          <Link
            href={content.cta.href}
            className={`group ${content.body.trim() ? 'mt-5' : ''} inline-flex min-h-12 items-center justify-center gap-3 rounded-[6px] border border-[var(--accent)] bg-[var(--accent)] px-6 text-[14px] font-semibold text-[var(--on-accent)] shadow-[0_8px_22px_rgba(30,94,70,0.16)] outline-none transition-[transform,box-shadow,filter] duration-300 hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] hover:shadow-[0_12px_28px_rgba(30,94,70,0.22)] sm:text-[15px]`}
          >
            <span>{content.cta.label}</span>
            <ArrowRight
              size={18}
              weight="regular"
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
