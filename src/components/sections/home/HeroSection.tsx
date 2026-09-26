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
  const credentialBreak = content.credentialLine.lastIndexOf(' | ');
  const credentialFirstLine = content.credentialLine.slice(0, credentialBreak + 3);
  const credentialSecondLine = content.credentialLine.slice(credentialBreak + 3);
  const headlineColors = [
    'text-[#72d3a1]',
    'text-[#a9cfff]',
    'text-[var(--gold-300)]',
  ];
  const taglineColors = [
    'text-[#72d3a1]',
    'text-[#a9cfff]',
    'text-[var(--gold-300)]',
  ];

  return (
    <>
      <section
        data-tone="navy"
        className="ar-home-hero relative isolate flex min-h-[100svh] w-full overflow-hidden bg-[#061329] text-white lg:h-[100vh] lg:min-h-0 supports-[height:100svh]:lg:h-[100svh]"
      >
        <HeroMedia sideWords={content.sideWords} />
        <div className="ar-home-hero-content relative z-[2] mx-auto flex min-h-[100svh] w-full max-w-[1540px] flex-col justify-center px-[clamp(1.25rem,5vw,5.5rem)] pb-12 pt-[6.25rem] sm:pb-16 sm:pt-[7rem] lg:h-full lg:min-h-0 lg:pb-20 lg:pt-[calc(var(--header-height)+2.5rem)]">
          <div className="flex w-full flex-1 items-center py-4 sm:py-6 lg:py-8">
            <div className="w-full max-w-[820px] text-left">
              <p
                className="ar-home-hero-eyebrow ar-fade-rise mb-3.5 text-[10px] font-semibold tracking-[0.22em] text-[var(--gold-300)] sm:mb-5 sm:text-[11px] lg:mb-6 lg:text-xs"
                style={{ animationDelay: '260ms' }}
              >
                {content.eyebrow}
              </p>

              <h1
                aria-label={content.headline}
                data-home-hero-title
                className="ar-home-hero-title max-w-[19ch] font-display text-h1 drop-shadow-[0_3px_28px_rgba(0,0,0,0.32)]"
              >
                {lines.map((line, index) => (
                  <span key={line} className="block overflow-hidden pb-[0.09em]">
                    <span
                      className={`ar-line-rise block ${headlineColors[index] ?? 'text-white'}`}
                      style={{ animationDelay: `${index * HERO_LINE_STAGGER_MS}ms` }}
                    >
                      {line}
                    </span>
                  </span>
                ))}
              </h1>

              <p
                className="ar-home-hero-copy ar-fade-rise mt-4 max-w-[58ch] text-body-lg text-white/85 drop-shadow-[0_2px_16px_rgba(0,0,0,0.38)] sm:mt-5 lg:mt-6"
                style={{ animationDelay: `${HERO_SUPPORT_DELAY_MS}ms` }}
              >
                {content.subheadline}
              </p>

              <p
                aria-label={content.tagline.join(' ')}
                className="ar-fade-rise mt-3 flex max-w-[52ch] flex-wrap gap-x-1.5 text-[0.78rem] font-semibold tracking-[0.04em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:mt-4 sm:text-[0.85rem] lg:mt-4 lg:text-[0.92rem]"
                style={{ animationDelay: `${HERO_SUPPORT_DELAY_MS + 120}ms` }}
              >
                {content.tagline.map((clause, index) => (
                  <span key={clause} className={taglineColors[index] ?? 'text-white/85'}>
                    {clause}
                  </span>
                ))}
              </p>

              <div
                className="ar-home-hero-cta ar-fade-rise mt-5 flex w-full max-w-[22rem] flex-col items-stretch justify-start gap-2.5 sm:mt-6 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-start sm:gap-3 lg:mt-7"
                style={{ animationDelay: `${HERO_CTA_DELAY_MS}ms` }}
              >
                <Button
                  href={content.primaryCta.href}
                  size="lg"
                  className="group min-h-11 rounded-[7px] border border-[var(--gold-300)] bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 text-[13px] font-semibold text-[var(--gold-ink)] shadow-[0_8px_30px_rgba(0,0,0,0.24)] hover:brightness-105 sm:min-h-12 sm:px-6 sm:text-sm lg:min-h-13 lg:px-7 lg:text-[15px]"
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
              </div>
            </div>
          </div>
        </div>

      </section>

      <section
        aria-label="AscendRev trust highlights"
        className="bg-[var(--surface-band)] text-[var(--text-primary)]"
      >
        <div
          className="ar-fade-rise mx-auto w-full max-w-[1540px] border-t border-[var(--line)] px-[clamp(1.25rem,5vw,5.5rem)] py-9 sm:py-11"
          style={{ animationDelay: '1500ms' }}
        >
          <p className="mb-6 text-[11px] font-semibold tracking-[0.18em] text-[var(--text-muted)] sm:text-xs">
            {content.trustLead}
          </p>
          <p className="w-full max-w-none text-[13px] font-medium leading-relaxed text-[var(--text-primary)] sm:text-sm lg:text-[15px]">
            <span>{credentialFirstLine}</span>
            <span className="block">{credentialSecondLine}</span>
          </p>
        </div>
      </section>
    </>
  );
}
