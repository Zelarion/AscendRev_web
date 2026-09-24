'use client';

import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { ArrowRight, Trophy } from '@phosphor-icons/react/dist/ssr';
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

/**
 * One "PROVEN COMMERCIAL EXPERIENCE" stat card. The trophy mark renders as a
 * Phosphor line icon (thin weight, small, muted gold) rather than the literal
 * emoji stored in content, per the build brief: an emoji glyph carries its
 * own fixed colour and cannot be muted to match the site's accent palette.
 * The other three glyphs are plain text characters and render as given.
 */
function StatIcon({ glyph }: { glyph: string }): JSX.Element {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--gold-400)]/30 bg-white/[0.03] text-[var(--gold-300)]/80">
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

function FounderPortraitPlaceholder(): JSX.Element {
  return (
    <figure>
      <div className="relative aspect-[4/5] overflow-hidden border border-white/12 bg-[var(--navy-800)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,rgba(223,184,79,0.09),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.035),transparent_45%)]"
        />
        <div aria-hidden="true" className="absolute inset-x-[18%] top-[14%] h-px bg-white/8" />
        <div aria-hidden="true" className="absolute inset-x-[18%] bottom-[14%] h-px bg-white/8" />
        <div aria-hidden="true" className="absolute inset-y-[14%] left-[18%] w-px bg-white/8" />
        <div aria-hidden="true" className="absolute inset-y-[14%] right-[18%] w-px bg-white/8" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="font-display text-[clamp(4rem,7vw,7rem)] font-medium leading-none tracking-[-0.06em] text-white/10">
            RV
          </span>
          <span className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38">
            Founder Portrait Placeholder
          </span>
        </div>
      </div>
      {/* TODO: Replace this development placeholder with the approved Rio Vidal portrait. */}
    </figure>
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
        'transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
        active
          ? 'translate-y-0 opacity-100'
          : completed
            ? 'translate-y-1 opacity-50'
            : 'translate-y-4 opacity-32'
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
      className="relative border-t border-white/8 bg-[var(--navy-900)] px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(6rem,10vw,9rem)] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(223,184,79,0.045),transparent_28%)]"
      />

      <div className="relative mx-auto grid w-full max-w-[1540px] gap-16 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] lg:gap-20 xl:gap-24">
        <aside className="lg:sticky lg:top-28 lg:self-start lg:h-fit">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-300)] sm:text-[11px]">
              THE ASCENDREV ADVANTAGE / 01
            </p>

            <h2 className="mt-5 max-w-[20ch] font-display text-[clamp(2.4rem,4vw,4.4rem)] font-medium leading-[0.98] tracking-[-0.04em] text-white">
              {leadership.heading}
            </h2>

            <div className="mt-9 max-w-[460px] sm:mt-10 lg:max-w-[300px] xl:max-w-[340px]">
              <FounderPortraitPlaceholder />
            </div>

            <div className="mt-7 border-t border-white/12 pt-6">
              <p className="text-[13px] font-semibold tracking-[0.16em] text-white">RIO VIDAL</p>
              <p className="mt-1 text-sm text-white/52">Founder / Canadian Leadership</p>

              <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.7] text-white/66">
                Commercial experience translated into the systems, scripts, and operating standards deployed by AscendRev.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/42">
                <span>Canadian Leadership</span>
                <span>Direct Accountability</span>
                <span>Commercial Experience</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="relative">
          <div aria-hidden="true" className="absolute bottom-10 left-[21px] top-10 w-px bg-white/10 sm:bottom-14 sm:left-[25px] sm:top-14">
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
                  className="relative py-12 pl-16 sm:py-16 sm:pl-20 lg:py-20"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-[10px] top-[36px] z-[2] h-6 w-6 rounded-full border bg-[var(--navy-900)] transition-[border-color,box-shadow,background-color] duration-500 sm:left-[14px] sm:top-[52px] lg:top-[68px]',
                      active
                        ? 'border-[var(--gold-300)] bg-[var(--gold-400)] shadow-[0_0_0_7px_rgba(223,184,79,0.08)]'
                        : completed
                          ? 'border-[var(--gold-400)]/70 bg-[var(--navy-900)]'
                          : 'border-white/18 bg-[var(--navy-900)]'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute inset-[7px] rounded-full transition-colors duration-500',
                        active || completed ? 'bg-[var(--gold-300)]' : 'bg-white/20'
                      )}
                    />
                  </span>

                  <MilestoneShell index={index} activeIndex={activeIndex}>
                    <div className="border-t border-white/12 pt-6 sm:pt-7">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--gold-300)]">
                          {step.number} / {step.label}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            'h-px transition-[width,background-color] duration-500',
                            active ? 'w-14 bg-[var(--gold-400)]' : 'w-8 bg-white/16'
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
                                className="max-w-[64ch] text-[clamp(1rem,1.2vw,1.16rem)] leading-[1.75] text-white/64"
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : step.kind === 'commercial' ? (
                        <div className="mt-7 max-w-[820px]">
                          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                            {leadership.commercialStats.map((stat) => (
                              <div key={stat.label} className="flex items-start gap-4">
                                <StatIcon glyph={stat.icon} />
                                <div>
                                  <p className="font-display text-[clamp(1.1rem,1.4vw,1.3rem)] font-medium leading-[1.3] text-white">
                                    {stat.label}
                                  </p>
                                  <p className="mt-2 text-sm leading-[1.6] text-white/58">{stat.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : step.kind === 'operating' ? (
                        <div className="mt-7 max-w-[840px]">
                          <h3 className="max-w-[15ch] font-display text-[clamp(2.8rem,5vw,5.4rem)] font-medium leading-[0.96] tracking-[-0.045em] text-white">
                            {step.title}
                          </h3>
                          <blockquote className="mt-8 max-w-[62ch] border-l border-[var(--gold-400)]/70 pl-6 text-[clamp(1rem,1.25vw,1.18rem)] leading-[1.75] text-white/68">
                            {step.body}
                          </blockquote>

                          <div className="mt-10 grid items-center gap-5 border-y border-white/10 py-7 sm:grid-cols-[1fr_auto_1fr] sm:gap-7">
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-300)]">Canada</p>
                              <p className="mt-3 text-sm leading-7 text-white/72">Leadership · Strategy · Standards</p>
                            </div>
                            <ArrowRight
                              size={25}
                              weight="thin"
                              aria-hidden="true"
                              className="rotate-90 text-[var(--gold-300)] sm:rotate-0"
                            />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-300)]">Philippines</p>
                              <p className="mt-3 text-sm leading-7 text-white/72">Execution · Teams · Operations</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-7 max-w-[780px]">
                          <h3 className="max-w-[16ch] font-display text-[clamp(2.8rem,5vw,5.5rem)] font-medium leading-[0.96] tracking-[-0.045em] text-white">
                            {step.title}
                          </h3>
                          <p className="mt-7 max-w-[62ch] text-[clamp(1rem,1.25vw,1.18rem)] leading-[1.75] text-white/64">
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

          <div className="ml-16 border-t border-white/10 pt-7 sm:ml-20">
            <p className="max-w-[72ch] text-xs leading-[1.75] text-white/38">{leadership.attribution}</p>
            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-300)]">
              Next / Philippine Infrastructure
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
