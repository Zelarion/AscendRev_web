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
      data-tone="navy"
      className="relative isolate min-h-[250px] overflow-hidden bg-[var(--navy-900)] text-white sm:min-h-[280px] lg:min-h-[300px]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/conversion-handshake.svg')" }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[rgba(3,14,28,0.68)]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,14,28,0.88)_0%,rgba(3,14,28,0.72)_48%,rgba(3,14,28,0.78)_100%)]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,10,20,0.42),transparent_58%)]" />

      <div className="relative z-[1] mx-auto grid min-h-[250px] w-full max-w-[1280px] items-center gap-10 px-[clamp(1.5rem,5vw,4.5rem)] py-10 sm:min-h-[280px] sm:py-12 lg:min-h-[300px] lg:grid-cols-[1.08fr_0.92fr] lg:gap-20 lg:py-14">
        <RevealOnScroll>
          <p className="mb-4 text-[10px] font-semibold tracking-[0.2em] text-[var(--gold-300)] sm:text-[11px]">
            LET&apos;S TALK
          </p>
          <h2 className="max-w-[18ch] font-display text-[clamp(2.35rem,4vw,4.65rem)] font-medium leading-[0.98] tracking-[-0.035em] text-white">
            {content.heading}
          </h2>
        </RevealOnScroll>

        <RevealOnScroll delayMs={100} className="lg:max-w-[470px] lg:justify-self-end">
          <p className="max-w-[42ch] text-[clamp(0.95rem,1.15vw,1.12rem)] leading-[1.6] text-white/84">
            {content.body}
          </p>
          <Link
            href={content.cta.href}
            className="group mt-5 inline-flex min-h-12 items-center justify-center gap-3 rounded-[6px] border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-6 text-[14px] font-semibold text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.2)] outline-none transition-[transform,box-shadow,filter] duration-300 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_28px_rgba(197,151,49,0.28)] sm:text-[15px]"
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
