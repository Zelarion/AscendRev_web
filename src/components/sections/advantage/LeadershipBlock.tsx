'use client';

import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { Trophy } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { prefersReducedMotion } from '@/lib/motion';
import { advantage } from '@/content/advantage';

interface StoryStep {
  id: string;
  number: string;
  label: string;
  title: string;
  body?: string;
  kind?: 'career' | 'commercial' | 'operating';
}

/** Cycles the four stat-card glyphs through gold, blue and green so the grid
 * reads as varied rather than one repeated accent colour (build brief,
 * 2026-09-24). All three are the *-text tokens, not the brighter *-300/400
 * ones the dark version used: those measure under 2:1 on white and are only
 * safe against the dark navy bands this page no longer has as a background. */
const STAT_ICON_TONES = [
  'text-[var(--gold-text)]',
  'text-[var(--steel-600)]',
  'text-[var(--green-600)]',
] as const;

/**
 * One "PROVEN COMMERCIAL EXPERIENCE" stat card. The trophy mark renders as a
 * Phosphor line icon (thin weight, small) rather than the literal emoji
 * stored in content, per the build brief: an emoji glyph carries its own
 * fixed colour and cannot be muted to match the site's accent palette. The
 * other three glyphs are plain text characters and render as given.
 */
function StatIcon({ glyph, toneIndex }: { glyph: string; toneIndex: number }): JSX.Element {
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface-band-raised)]',
        STAT_ICON_TONES[toneIndex % STAT_ICON_TONES.length]
      )}
    >
      {glyph === '🏆' ? (
        <Trophy aria-hidden="true" size={16} weight="thin" />
      ) : (
        <span aria-hidden="true" className="text-sm leading-none">
          {glyph}
        </span>
      )}
    </span>
  );
}

function MilestoneShell({
  children,
  index,
  activeIndex,
}: {
  children: ReactNode;
  index: number;
  activeIndex: number;
}): JSX.Element {
  const active = index === activeIndex;
  const completed = index < activeIndex;

  return (
    <div
      className={cn(
        'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:transition-none',
        active
          ? 'translate-y-0'
          : completed
            ? 'translate-y-1'
            : 'translate-y-4'
      )}
    >
      {children}
    </div>
  );
}

export default function LeadershipBlock(): JSX.Element {
  const { leadership } = advantage;
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const milestoneRefs = useRef<Array<HTMLElement | null>>([]);

  const steps: StoryStep[] = [
    {
      id: 'career-experience',
      number: '01',
      label: leadership.sectionLabel,
      title: leadership.heading,
      kind: 'career',
    },
    {
      id: 'commercial-experience',
      number: '02',
      label: leadership.commercialHeading,
      title: leadership.commercialHeading,
      kind: 'commercial',
    },
    {
      id: 'operating-model',
      number: '03',
      label: 'OPERATING MODEL',
      title: 'Experience converted into execution.',
      body: leadership.commitment,
      kind: 'operating',
    },
  ];

  useEffect(() => {
    const shouldReduce = prefersReducedMotion();
    setReducedMotion(shouldReduce);
    if (shouldReduce) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const next = visible[0]?.target.getAttribute('data-founder-step');
        if (next !== null && next !== undefined) setActiveIndex(Number(next));
      },
      {
        root: null,
        rootMargin: '-40% 0px -45% 0px',
        threshold: [0.05, 0.2, 0.4, 0.65],
      }
    );

    const nodes = milestoneRefs.current.filter((node): node is HTMLElement => Boolean(node));
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const progress = reducedMotion
    ? 100
    : steps.length <= 1
      ? 100
      : (activeIndex / (steps.length - 1)) * 100;

  return (
    <section
      id={leadership.id}
      data-tone="navy"
      className="relative border-t border-[var(--border)] bg-[var(--surface-page)] px-[var(--site-gutter,clamp(1.25rem,5vw,5.5rem))] py-[var(--section-space,clamp(3.5rem,8vw,8rem))] text-[var(--ink)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(223,184,79,0.045),transparent_28%)]"
      />

      {/*
        The sticky aside and the scrolling step column used to separate purely
        by being the same navy everywhere; nothing needed a visible seam. On
        white the same layout reads as one undifferentiated block without a
        seam, so the aside gets a hairline right border plus its own raised
        panel background (build brief: "--surface-band-raised or a hairline
        border ... rather than a dark panel").
      */}
      <div className="relative mx-auto grid w-full max-w-[1540px] gap-9 sm:gap-11 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] lg:gap-20 xl:gap-24">
        <aside className="lg:sticky lg:top-28 lg:self-start lg:h-fit lg:border-r lg:border-[var(--border)] lg:pr-8 xl:pr-10">
          <div className="rounded-[10px] bg-[var(--surface-band-raised)] p-6 lg:bg-transparent lg:p-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-text)] sm:text-[11px]">
              THE ASCENDREV ADVANTAGE / 01
            </p>

            <h2 className="mt-5 max-w-[20ch] font-display text-[clamp(2.4rem,4vw,4.4rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[var(--navy-900)]">
              {leadership.heading}
            </h2>

            <div className="mt-6 border-t border-[var(--border)] pt-5 sm:mt-7 sm:pt-6">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export keeps this local portrait asset simple. */}
              <img
                src="/Rio-Vidal.jpg"
                alt="Rio Vidal, Co-Founder and President of AscendRev"
                width={611}
                height={508}
                className="mb-5 block aspect-[611/508] w-full max-w-[clamp(16rem,44vw,23rem)] rounded-[8px] object-cover object-[center_34%]"
              />

              <p className="text-[13px] font-semibold tracking-[0.16em] text-[var(--navy-900)]">RIO VIDAL</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">Co-Founder and President</p>

              <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.7] text-[var(--ink-muted)]">
                Commercial experience translated into the systems, scripts, and operating standards deployed by AscendRev.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--border)] pt-5 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                <span>Canadian Leadership</span>
                <span>Direct Accountability</span>
                <span>Commercial Experience</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="relative">
          <div aria-hidden="true" className="absolute bottom-10 left-[21px] top-10 w-px bg-[var(--border)] sm:bottom-14 sm:left-[25px] sm:top-14">
            <span
              className="absolute left-0 top-0 w-px bg-[var(--gold-400)] transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ height: `${progress}%` }}
            />
          </div>

          <div>
            {steps.map((step, index) => {
              const active = index === activeIndex;
              const completed = index < activeIndex;

              return (
                <article
                  key={step.id}
                  ref={(node) => {
                    milestoneRefs.current[index] = node;
                  }}
                  data-founder-step={index}
                  className="relative py-9 pl-14 sm:py-14 sm:pl-20 lg:py-20"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-[8px] top-[31px] z-[2] h-6 w-6 rounded-full border bg-[var(--surface-band-raised)] transition-[border-color,box-shadow,background-color] duration-500 sm:left-[14px] sm:top-[52px] lg:top-[68px]',
                      active
                        ? 'border-[var(--green-600)] bg-[var(--green-600)] shadow-[0_0_0_7px_rgba(30,94,70,0.12)]'
                        : completed
                          ? 'border-[var(--gold-text)]/70 bg-[var(--surface-band-raised)]'
                          : 'border-[var(--border-strong)] bg-[var(--surface-band-raised)]'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute inset-[7px] rounded-full transition-colors duration-500',
                        active ? 'bg-white' : completed ? 'bg-[var(--gold-text)]' : 'bg-[var(--border-strong)]'
                      )}
                    />
                  </span>

                  <MilestoneShell index={index} activeIndex={activeIndex}>
                    <div className="border-t border-[var(--border)] pt-6 sm:pt-7">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--gold-text)]">
                          {step.number} / {step.label}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            'h-px transition-[width,background-color] duration-500',
                            active ? 'w-14 bg-[var(--gold-text)]' : 'w-8 bg-[var(--border-strong)]'
                          )}
                        />
                      </div>

                      {step.kind === 'career' ? (
                        // No h3 here: `step.title` (leadership.heading) is
                        // already the sticky aside's <h2>, immediately to the
                        // left of this column, so repeating it as a second
                        // heading would be the exact duplicate the client's
                        // copy revision asked to remove.
                        <div className="mt-7 max-w-[780px]">
                          <div className="space-y-5">
                            {leadership.narrative.map((paragraph) => (
                              <p
                                key={paragraph}
                                className="max-w-[64ch] text-[clamp(1rem,1.2vw,1.16rem)] leading-[1.75] text-[var(--ink-muted)]"
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : step.kind === 'commercial' ? (
                        <div className="mt-7 max-w-[820px]">
                          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                            {leadership.commercialStats.map((stat, index) => (
                              <div key={stat.label} className="flex items-start gap-4">
                                <StatIcon glyph={stat.icon} toneIndex={index} />
                                <div>
                                  <p className="font-display text-[clamp(1.1rem,1.4vw,1.3rem)] font-medium leading-[1.3] text-[var(--navy-900)]">
                                    {stat.label}
                                  </p>
                                  <p className="mt-2 text-sm leading-[1.6] text-[var(--ink-muted)]">{stat.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : step.kind === 'operating' ? (
                        <div className="mt-7 max-w-[840px]">
                          <h3 className="max-w-[15ch] font-display text-[clamp(2.8rem,5vw,5.4rem)] font-medium leading-[0.96] tracking-[-0.045em] text-[var(--navy-900)]">
                            {step.title}
                          </h3>
                          <blockquote className="mt-8 max-w-[62ch] border-l border-[var(--gold-text)]/70 pl-6 text-[clamp(1rem,1.25vw,1.18rem)] leading-[1.75] text-[var(--ink-muted)]">
                            {step.body}
                          </blockquote>

                          {/* <div className="mt-10 grid items-center gap-5 border-y border-[var(--border)] py-7 sm:grid-cols-[1fr_auto_1fr] sm:gap-7">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">Canada</p>
                              <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">Leadership · Strategy · Standards</p>
                            </div>
                            <ArrowRight
                              size={25}
                              weight="thin"
                              aria-hidden="true"
                              className="rotate-90 text-[var(--steel-600)] sm:rotate-0"
                            />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">Philippines</p>
                              <p className="mt-3 text-sm leading-7 text-[var(--ink-muted)]">Execution · Teams · Operations</p>
                            </div>
                          </div> */}
                        </div>
                      ) : (
                        <div className="mt-7 max-w-[780px]">
                          <h3 className="max-w-[16ch] font-display text-[clamp(2.8rem,5vw,5.5rem)] font-medium leading-[0.96] tracking-[-0.045em] text-[var(--navy-900)]">
                            {step.title}
                          </h3>
                          <p className="mt-7 max-w-[62ch] text-[clamp(1rem,1.25vw,1.18rem)] leading-[1.75] text-[var(--ink-muted)]">
                            {step.body}
                          </p>
                        </div>
                      )}
                    </div>
                  </MilestoneShell>
                </article>
              );
            })}
          </div>

          <div className="ml-16 border-t border-[var(--border)] pt-7 sm:ml-20">
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">
              Next / Philippine Infrastructure
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
