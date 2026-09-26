'use client';

import { type JSX, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import type { PillarsContent } from '@/content/home';

interface PillarsSectionProps {
  content: PillarsContent;
}

const PILLAR_METRICS = ['', 'CAD1B+', 'Enterprise-Grade Execution'] as const;

export default function PillarsSection({ content }: PillarsSectionProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const chapters = chapterRefs.current.filter((chapter): chapter is HTMLElement => Boolean(chapter));
    if (!chapters.length) return;

    let observer: IntersectionObserver | null = null;
    const observeAtViewportSize = () => {
      observer?.disconnect();
      const verticalInset = Math.round(window.innerHeight * 0.4);
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => {
              const viewportCenter = window.innerHeight / 2;
              const centerA = a.boundingClientRect.top + a.boundingClientRect.height / 2;
              const centerB = b.boundingClientRect.top + b.boundingClientRect.height / 2;
              return Math.abs(centerA - viewportCenter) - Math.abs(centerB - viewportCenter);
            });

          if (!visible.length) return;

          const index = Number((visible[0].target as HTMLElement).dataset.pillarIndex ?? 0);
          setActiveIndex(index);
        },
        {
          root: null,
          rootMargin: `-${verticalInset}px 0px -${verticalInset}px 0px`,
          threshold: 0,
        }
      );

      chapters.forEach((chapter) => observer?.observe(chapter));
    };

    observeAtViewportSize();
    window.addEventListener('resize', observeAtViewportSize, { passive: true });
    return () => {
      window.removeEventListener('resize', observeAtViewportSize);
      observer?.disconnect();
    };
  }, []);

  return (
    <section className="bg-[var(--surface-band)] text-[var(--text-primary)]">
      <div className="mx-auto grid w-full max-w-[1540px] gap-10 px-[clamp(1.25rem,5vw,5.5rem)] pt-[clamp(3.75rem,7vw,8rem)] pb-10 md:pb-12 md:grid-cols-[0.82fr_1.18fr] md:items-start md:gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20 xl:gap-28">
        <aside className="md:sticky md:top-[7rem] md:self-start lg:top-[8.5rem]">
          <div className="max-w-[560px]">
            <p className="text-xs font-semibold leading-relaxed tracking-[0.16em] text-[var(--gold-text)] sm:text-[13px]">
              THE TURNKEY OUTSOURCE AND OFFSHORE ADVANTAGE
            </p>

            <h2 className="mt-5 font-display text-h2 text-[var(--navy-900)]">
              {content.heading}
            </h2>

            <p className="mt-5 text-body-lg text-[var(--navy-900)]">
              {content.supportingCopy}
            </p>

            <p className="mt-5 text-body text-[var(--text-muted)]">
              {content.intro}
            </p>

            <div className="mt-10 border-l border-[var(--line-strong)] pl-5 sm:mt-12 sm:pl-6">
              {content.items.map((item, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={item.heading}
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      chapterRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={cn(
                      'group relative flex w-full items-start gap-4 py-3 text-left outline-none transition-colors duration-500',
                      active ? 'text-[var(--gold-text)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute -left-[21px] top-1/2 h-8 w-[2px] -translate-y-1/2 transition-all duration-500 sm:-left-[25px]',
                        active ? 'bg-[var(--gold-text)]' : 'bg-transparent'
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
                className="flex min-h-0 items-center border-b border-[var(--line)] py-10 first:border-t md:py-12"
              >
                <div
                  className={cn(
                    'w-full max-w-[760px] transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    active
                      ? 'translate-y-0 opacity-100 blur-0'
                      : 'translate-y-5 opacity-100 blur-0'
                  )}
                >
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-5">
                    <span className="text-xs font-semibold tracking-[0.18em] text-[var(--gold-text)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 max-w-[72%] text-right text-[0.68rem] uppercase leading-[1.35] tracking-[0.1em] text-[var(--text-muted)] [overflow-wrap:anywhere] sm:max-w-none sm:text-xs sm:leading-normal sm:tracking-[0.16em]">
                      Outsource/Offshore Advantage
                    </span>
                  </div>

                  <p
                    className={cn(
                      'mt-6 md:mt-8',
                      index === 1
                        ? 'ar-type-stat font-display text-h2 text-[var(--navy-900)]'
                        : 'text-body-lg text-[var(--navy-900)]'
                    )}
                  >
                    {PILLAR_METRICS[index]}
                  </p>

                  <h3 className="mt-6 font-display text-h3 text-[var(--navy-900)]">
                    {item.heading}
                  </h3>

                  <p className="mt-6 text-body text-[var(--text-muted)]">
                    {item.body}
                  </p>
                </div>
              </article>
            );
          })}

          <p className="mt-14 text-body-lg text-[var(--navy-900)] lg:mt-4">
            {content.closingLine}
          </p>
        </div>
      </div>
    </section>
  );
}
