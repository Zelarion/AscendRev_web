import type { JSX } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import Button from '@/components/ui/Button';
import HeroMedia from '@/components/sections/home/HeroMedia';
import {
  HERO_CTA_DELAY_MS,
  HERO_LINE_STAGGER_MS,
  HERO_SUPPORT_DELAY_MS,
} from '@/components/sections/shared/motionTokens';
import type { HeroContent } from '@/content/home';

interface HeroSectionProps {
  content: HeroContent;
}

function toSentences(headline: string): string[] {
  const sentences = headline.match(/[^.!?]+[.!?]*/g);
  if (!sentences) return [headline];
  return sentences.map((sentence) => sentence.trim()).filter(Boolean);
}

export default function HeroSection({ content }: HeroSectionProps): JSX.Element {
  const lines = toSentences(content.headline);

  return (
    <>
      <section
        data-tone="navy"
        className="relative isolate flex min-h-[100svh] w-full overflow-hidden bg-[var(--navy-900)] text-white lg:h-[100vh] lg:min-h-0 supports-[height:100svh]:lg:h-[100svh]"
      >
        <HeroMedia sideWords={content.sideWords} />

        <div className="relative z-[2] mx-auto flex min-h-[100svh] w-full max-w-[1540px] flex-col px-[clamp(1.25rem,5vw,5.5rem)] pb-5 pt-[6.25rem] sm:pb-8 sm:pt-[7rem] lg:h-full lg:min-h-0 lg:pb-12 lg:pt-[clamp(7rem,11vw,9rem)]">
          <div className="flex flex-1 items-center justify-start py-5 sm:py-8 lg:py-12">
            <div className="w-full max-w-[760px] text-left">
              <p
                className="ar-fade-rise mb-3.5 text-[10px] font-semibold tracking-[0.22em] text-[var(--gold-300)] sm:mb-5 sm:text-[11px] lg:mb-6 lg:text-xs"
                style={{ animationDelay: '260ms' }}
              >
                {content.eyebrow}
              </p>

              <h1 className="max-w-[16ch] font-display text-[clamp(2.25rem,10vw,3.15rem)] font-medium leading-[0.94] tracking-[-0.035em] sm:text-[clamp(2.65rem,7vw,4rem)] lg:text-[clamp(2.75rem,4.6vw,5rem)]">
                {lines.map((line, index) => (
                  <span key={line} className="block overflow-hidden pb-[0.09em]">
                    <span
                      className={
                        index === lines.length - 1
                          ? 'ar-line-rise block text-[var(--gold-400)]'
                          : 'ar-line-rise block'
                      }
                      style={{ animationDelay: `${index * HERO_LINE_STAGGER_MS}ms` }}
                    >
                      {line}
                    </span>
                  </span>
                ))}
              </h1>

              <p
                className="ar-fade-rise mt-4 max-w-[62ch] text-[0.9rem] leading-[1.55] text-white/78 sm:mt-5 sm:text-[0.98rem] sm:leading-[1.65] lg:mt-7 lg:text-[clamp(0.95rem,1.05vw,1.08rem)] lg:leading-[1.7]"
                style={{ animationDelay: `${HERO_SUPPORT_DELAY_MS}ms` }}
              >
                {content.subheadline}
              </p>

              <p
                className="ar-fade-rise mt-3 max-w-[52ch] text-[0.78rem] font-semibold tracking-[0.04em] text-[var(--gold-300)] sm:mt-4 sm:text-[0.85rem] lg:mt-5 lg:text-[0.92rem]"
                style={{ animationDelay: `${HERO_SUPPORT_DELAY_MS + 120}ms` }}
              >
                {content.tagline}
              </p>

              <div
                className="ar-fade-rise mt-5 flex flex-col items-start justify-start gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:gap-3 lg:mt-8"
                style={{ animationDelay: `${HERO_CTA_DELAY_MS}ms` }}
              >
                <Button
                  href={content.primaryCta.href}
                  size="lg"
                  className="group min-h-11 rounded-[7px] border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 text-[13px] font-semibold text-[var(--gold-ink)] shadow-[0_8px_24px_rgba(197,151,49,0.22)] hover:bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] sm:min-h-12 sm:px-6 sm:text-sm lg:min-h-13 lg:px-7 lg:text-[15px]"
                >
                  <span className="inline-flex items-center gap-2">
                    {content.primaryCta.label}
                    <ArrowRight
                      size={16}
                      weight="regular"
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </Button>
                <Button
                  href={content.secondaryCta.href}
                  variant="secondary"
                  size="lg"
                  className="min-h-11 rounded-[7px] border-white/45 bg-black/10 px-5 text-[13px] font-medium text-white backdrop-blur-[2px] hover:border-white/70 hover:bg-white/10 sm:min-h-12 sm:px-6 sm:text-sm lg:min-h-13 lg:px-7 lg:text-[15px]"
                >
                  {content.secondaryCta.label}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-8 right-6 z-[2] hidden flex-col items-center gap-3 text-[9px] font-semibold tracking-[0.2em] text-white/55 xl:flex">
          <span>SCROLL</span>
          <span className="h-14 w-px bg-gradient-to-b from-[var(--gold-300)] to-transparent" />
        </div>
      </section>

      <section
        data-tone="navy"
        aria-label="AscendRev trust highlights"
        className="bg-[var(--navy-900)] text-white"
      >
        <div
          className="ar-fade-rise mx-auto w-full max-w-[1540px] border-t border-white/10 px-[clamp(1.25rem,5vw,5.5rem)] py-9 sm:py-11"
          style={{ animationDelay: '1500ms' }}
        >
          <p className="mb-6 text-[11px] font-semibold tracking-[0.18em] text-white/48 sm:text-xs">
            {content.trustLead}
          </p>
          <p className="max-w-[900px] text-[13px] font-medium leading-relaxed text-white/78 sm:text-sm lg:text-[15px]">
            {content.credentialLine}
          </p>
        </div>
      </section>
    </>
  );
}
