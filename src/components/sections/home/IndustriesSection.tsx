'use client';

import { useEffect, useRef, useState, type JSX } from 'react';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/motion';
import type { IndustriesContent, IndustryGroup } from '@/content/home';

interface IndustriesSectionProps {
  content: IndustriesContent;
}

const INDUSTRY_IMAGES: Record<string, string> = {
  fintech:
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=85',
  energy:
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1800&q=85',
  construction:
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=85',
  retail:
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=85',
  transport:
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1800&q=85',
};

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function ImagePanel({
  group,
  index,
  active,
  completed,
}: {
  group: IndustryGroup;
  index: number;
  active: boolean;
  completed: boolean;
}): JSX.Element {
  return (
    <div
      className={cn(
        'relative aspect-[5/4] overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.03] transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:transition-none',
        active
          ? 'scale-100 opacity-100'
          : completed
            ? 'scale-[0.992] opacity-70'
            : 'scale-[0.98] opacity-48'
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${INDUSTRY_IMAGES[group.id]}')` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,14,28,0.05)_20%,rgba(4,14,28,0.88)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[var(--navy-900)]/10" />

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <p className="text-[10px] font-semibold tracking-[0.26em] text-[var(--gold-300)]">
          {formatIndex(index)}
        </p>
        <h3 className="mt-3 max-w-[18ch] font-display text-[clamp(2rem,3vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.03em] text-white">
          {group.label}
        </h3>
      </div>
    </div>
  );
}

function TextPanel({
  group,
  index,
  active,
  completed,
}: {
  group: IndustryGroup;
  index: number;
  active: boolean;
  completed: boolean;
}): JSX.Element {
  return (
    <div
      className={cn(
        'transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none',
        active
          ? 'translate-y-0 opacity-100'
          : completed
            ? 'translate-y-1 opacity-68'
            : 'translate-y-5 opacity-44'
      )}
    >
      <div className="border-t border-white/12 pt-5">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-[var(--gold-300)]">
            {formatIndex(index)}
          </span>
          <span className="h-px w-8 bg-[var(--gold-400)]/55" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/46">
            {group.label}
          </span>
        </div>

        <p className="mt-6 max-w-[52ch] text-[clamp(1rem,1.15vw,1.16rem)] leading-[1.75] text-white/76">
          {group.body}
        </p>

        <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {group.sectors.map((capability) => (
            <li
              key={capability}
              className="flex items-center gap-3 py-3.5 text-sm font-medium text-white/88 sm:text-[15px]"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold-400)]" />
              <span>{capability}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function IndustriesSection({ content }: IndustriesSectionProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const rowRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const next = visible[0]?.target.getAttribute('data-industry-index');
        if (next !== null && next !== undefined) setActiveIndex(Number(next));
      },
      {
        root: null,
        rootMargin: '-38% 0px -38% 0px',
        threshold: [0.05, 0.2, 0.4, 0.6],
      }
    );

    const rows = rowRefs.current.filter((row): row is HTMLElement => Boolean(row));
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  const progress =
    content.groups.length <= 1 ? 100 : (activeIndex / (content.groups.length - 1)) * 100;

  return (
    <section
      id={content.id}
      data-tone="navy"
      className="relative overflow-hidden bg-[var(--navy-900)] px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(6rem,11vw,10rem)] text-white"
    >
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="mx-auto max-w-[900px] text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-300)] sm:text-xs">
            CROSS-INDUSTRY MASTERY
          </p>
          <h2 className="mx-auto mt-6 max-w-[18ch] font-display text-[clamp(3rem,5.8vw,6.2rem)] font-medium leading-[0.96] tracking-[-0.04em] text-white">
            {content.heading}
          </h2>
          <p className="mx-auto mt-7 max-w-[66ch] text-[clamp(1rem,1.2vw,1.18rem)] leading-[1.75] text-white/64">
            {content.intro}
          </p>
        </header>

        <div className="relative mt-[clamp(3.5rem,6vw,5.5rem)]">
          <div
            aria-hidden="true"
            className="absolute bottom-[8vh] left-[27px] top-[8vh] w-px bg-white/12 lg:left-1/2 lg:-translate-x-1/2"
          >
            <span
              className="absolute left-0 top-0 w-px bg-[var(--gold-400)] transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:hidden"
              style={{ height: `${progress}%` }}
            />
          </div>

          <div className="space-y-8 lg:space-y-0">
            {content.groups.map((group, index) => {
              const active = index === activeIndex;
              const completed = index < activeIndex;
              const imageFirst = index % 2 === 0;

              return (
                <article
                  key={group.id}
                  ref={(node) => {
                    rowRefs.current[index] = node;
                  }}
                  data-industry-index={index}
                  className="relative min-h-[58vh] py-8 sm:min-h-[60vh] sm:py-10 lg:grid lg:min-h-[60vh] lg:grid-cols-[minmax(0,1fr)_8%_minmax(0,1fr)] lg:items-center lg:py-12 xl:min-h-[58vh]"
                >
                  <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-5 lg:hidden">
                    <div className="relative flex justify-center">
                      <span
                        className={cn(
                          'relative z-[2] mt-2 flex h-9 w-9 items-center justify-center rounded-full border bg-[var(--navy-900)] font-mono text-[10px] font-medium transition-colors duration-500',
                          active || completed
                            ? 'border-[var(--gold-400)] text-[var(--gold-300)]'
                            : 'border-white/18 text-white/36'
                        )}
                      >
                        {formatIndex(index)}
                      </span>
                    </div>
                    <div className="space-y-8">
                      <ImagePanel group={group} index={index} active={active} completed={completed} />
                      <TextPanel group={group} index={index} active={active} completed={completed} />
                    </div>
                  </div>

                  <div className="hidden lg:contents">
                    <div className="col-start-1 row-start-1 self-center pr-10 xl:pr-16">
                      {imageFirst ? (
                        <ImagePanel group={group} index={index} active={active} completed={completed} />
                      ) : (
                        <TextPanel group={group} index={index} active={active} completed={completed} />
                      )}
                    </div>

                    <div className="relative z-[2] col-start-2 row-start-1 flex h-full items-center justify-center">
                      <span
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full border bg-[var(--navy-900)] font-mono text-[11px] font-medium transition-[border-color,color,box-shadow] duration-500',
                          active
                            ? 'border-[var(--gold-300)] text-[var(--gold-300)] shadow-[0_0_0_7px_rgba(223,184,79,0.08)]'
                            : completed
                              ? 'border-[var(--gold-400)]/75 text-[var(--gold-300)]/85'
                              : 'border-white/18 text-white/36'
                        )}
                      >
                        {formatIndex(index)}
                      </span>
                    </div>

                    <div className="col-start-3 row-start-1 self-center pl-10 xl:pl-16">
                      {imageFirst ? (
                        <TextPanel group={group} index={index} active={active} completed={completed} />
                      ) : (
                        <ImagePanel group={group} index={index} active={active} completed={completed} />
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-16 flex max-w-[720px] flex-col items-center text-center sm:mt-20">
          <span aria-hidden="true" className="h-px w-16 bg-[var(--gold-400)]" />
          <p className="mt-6 font-display text-[clamp(1.7rem,2.6vw,2.8rem)] font-medium tracking-[-0.025em] text-white/88">
            Different industries. One operating standard.
          </p>
        </div>
      </div>
    </section>
  );
}
