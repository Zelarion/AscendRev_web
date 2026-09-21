'use client';

import { type JSX, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { PillarsContent } from '@/content/home';

interface PillarsSectionProps {
  content: PillarsContent;
}

const PILLAR_METRICS = ['30%–50%', 'CAD$1B+', 'Enterprise-Grade Execution'] as const;

export default function PillarsSection({ content }: PillarsSectionProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const chapters = chapterRefs.current.filter((chapter): chapter is HTMLElement => Boolean(chapter));
    if (!chapters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));

        if (!visible.length) return;

        const index = Number((visible[0].target as HTMLElement).dataset.pillarIndex ?? 0);
        setActiveIndex(index);
      },
      {
        root: null,
        rootMargin: '-34% 0px -46% 0px',
        threshold: 0,
      }
    );

    chapters.forEach((chapter) => observer.observe(chapter));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-[#f5f1e8] text-[#0d1b31]">
      <div className="mx-auto grid w-full max-w-[1540px] gap-14 px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(5rem,8vw,8rem)] lg:grid-cols-[0.88fr_1.12fr] lg:gap-20 xl:gap-28">
        <aside className="lg:sticky lg:top-[8.5rem] lg:self-start">
          <div className="max-w-[560px]">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--gold-500)] sm:text-xs">
              THE TURNKEY FINANCIAL ADVANTAGE
            </p>

            <h2 className="mt-5 max-w-[12ch] font-display text-[clamp(3rem,4.7vw,5.5rem)] font-medium leading-[0.94] tracking-[-0.04em] text-[#0b1a30]">
              {content.heading}
            </h2>

            <p className="mt-6 max-w-[46ch] text-[clamp(1rem,1.15vw,1.15rem)] leading-[1.7] text-[#4e596a]">
              {content.intro}
            </p>

            <div className="mt-10 border-l border-[#c8c0b2] pl-5 sm:mt-12 sm:pl-6">
              {content.items.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={item.heading}
                    type="button"
                    onClick={() => chapterRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className={cn(
                      'group relative flex w-full items-start gap-4 py-3 text-left outline-none transition-colors duration-500',
                      active ? 'text-[var(--gold-500)]' : 'text-[#8a8f98] hover:text-[#4e596a]'
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute -left-[21px] top-1/2 h-8 w-[2px] -translate-y-1/2 transition-all duration-500 sm:-left-[25px]',
                        active ? 'bg-[var(--gold-500)]' : 'bg-transparent'
                      )}
                    />
                    <span className="w-7 shrink-0 text-[11px] font-semibold tracking-[0.16em] sm:text-xs">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium sm:text-[15px]">{item.heading}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="relative">
          {content.items.map((item, index) => {
            const active = index === activeIndex;
            return (
              <article
                key={item.heading}
                ref={(node) => {
                  chapterRefs.current[index] = node;
                }}
                data-pillar-index={index}
                className="flex min-h-[76vh] items-center border-b border-[#d7d0c4] py-14 first:border-t lg:min-h-[88vh] lg:py-20"
              >
                <div
                  className={cn(
                    'w-full max-w-[760px] transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    active
                      ? 'translate-y-0 opacity-100 blur-0'
                      : 'translate-y-5 opacity-35 blur-[0.2px]'
                  )}
                >
                  <div className="flex items-center justify-between border-b border-[#d7d0c4] pb-5">
                    <span className="text-xs font-semibold tracking-[0.18em] text-[var(--gold-500)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8a8f98]">Financial Advantage</span>
                  </div>

                  <p className="mt-8 font-display text-[clamp(3.2rem,6vw,7rem)] font-medium leading-[0.9] tracking-[-0.045em] text-[#0b1a30]">
                    {PILLAR_METRICS[index]}
                  </p>

                  <h3 className="mt-6 max-w-[18ch] font-display text-[clamp(2rem,3.2vw,3.7rem)] font-medium leading-[1] tracking-[-0.035em] text-[#0b1a30]">
                    {item.heading}
                  </h3>

                  <p className="mt-6 max-w-[58ch] text-[clamp(1rem,1.15vw,1.15rem)] leading-[1.75] text-[#4f5968]">
                    {item.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
