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
  kind?: 'recognition' | 'performance' | 'deal' | 'operating';
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

  const presidentsAward = leadership.credentials.find((item) => item.name === "President's Award");
  const clubRecognition = leadership.credentials.find((item) => item.name === '100M Dollar Club');
  const dealRange = leadership.facts.find((item) => item.label === 'Deal size closed');

  const steps: StoryStep[] = [
    {
      id: 'experience',
      number: '01',
      label: 'EXPERIENCE',
      title: 'Built by someone who has carried the number.',
      body:
        leadership.narrative[0] ??
        'Direct commercial operating experience informs how AscendRev structures frontline teams and performance standards.',
    },
    {
      id: 'recognition',
      number: '02',
      label: 'RECOGNITION',
      title: presidentsAward?.name ?? "President's Award",
      body: presidentsAward?.note === 'Awarded twice.' ? 'Dual-decorated recognition' : 'Recognition earned across a commercial career.',
      kind: 'recognition',
    },
    {
      id: 'performance',
      number: '03',
      label: 'PERFORMANCE',
      title: clubRecognition?.name ?? '100M Dollar Club',
      body: clubRecognition?.issuer ? `${clubRecognition.issuer} recognition` : 'Commercial performance recognition',
      kind: 'performance',
    },
    {
      id: 'deal-experience',
      number: '04',
      label: 'DEAL EXPERIENCE',
      title: 'CAD$500K → CAD$35M',
      body: 'Deal experience across Canada and Australia',
      kind: 'deal',
    },
    {
      id: 'operating-model',
      number: '05',
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

            <h2 className="mt-5 max-w-[13ch] font-display text-[clamp(2.8rem,4.6vw,5rem)] font-medium leading-[0.98] tracking-[-0.04em] text-white">
              Engineered by a Proven Player-Coach.
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
                  className="relative py-10 pl-16 sm:py-14 sm:pl-20 lg:py-16"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-[10px] top-[28px] z-[2] h-6 w-6 rounded-full border bg-[var(--navy-900)] transition-[border-color,box-shadow,background-color] duration-500 sm:left-[14px] sm:top-[44px] lg:top-[52px]',
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
                        <span className="font-mono text-[11px] font-medium tracking-[0.22em] text-[var(--gold-300)]">
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

                      {step.kind === 'recognition' ? (
                        <div className="relative mt-7 max-w-[760px]">
                          <Trophy
                            aria-hidden="true"
                            size={116}
                            weight="thin"
                            className="absolute -right-1 -top-10 text-[var(--gold-300)]/[0.08] sm:right-8"
                          />
                          <h3 className="relative font-display text-[clamp(2.7rem,5.4vw,5.7rem)] font-medium leading-[0.96] tracking-[-0.045em] text-white">
                            {step.title}
                          </h3>
                          <p className="mt-5 text-[clamp(1rem,1.35vw,1.22rem)] leading-[1.7] text-white/62">
                            {step.body}
                          </p>
                          {/* TODO: Confirm the President's Award issuer and award years before final publishing. */}
                        </div>
                      ) : step.kind === 'performance' ? (
                        <div className="mt-7 max-w-[760px]">
                          <div
                            className={cn(
                              'font-display text-[clamp(5rem,10vw,10rem)] font-medium leading-[0.78] tracking-[-0.075em] text-white transition-transform duration-700 motion-reduce:transform-none motion-reduce:transition-none',
                              active ? 'scale-100' : 'scale-[0.97]'
                            )}
                          >
                            100M
                          </div>
                          <h3 className="mt-7 font-display text-[clamp(2rem,3.1vw,3.5rem)] font-medium leading-none tracking-[-0.035em] text-white/92">
                            Dollar Club
                          </h3>
                          <p className="mt-4 text-[clamp(1rem,1.25vw,1.18rem)] text-white/58">{step.body}</p>
                        </div>
                      ) : step.kind === 'deal' ? (
                        <div className="mt-7 max-w-[820px]">
                          <h3 className="font-display text-[clamp(2.8rem,5.8vw,6.4rem)] font-medium leading-[0.95] tracking-[-0.055em] text-white">
                            CAD$500K <span className="text-[var(--gold-300)]">→</span> CAD$35M
                          </h3>
                          <div className="mt-8 h-px w-full bg-white/12">
                            <span
                              aria-hidden="true"
                              className="block h-px bg-[var(--gold-400)] transition-[width] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:w-full motion-reduce:transition-none"
                              style={{ width: active || completed ? '100%' : '16%' }}
                            />
                          </div>
                          <div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-white/34 sm:text-[10px]">
                            <span>CAD$500K</span>
                            <span>CAD$35M</span>
                          </div>
                          <p className="mt-7 text-[clamp(1rem,1.25vw,1.18rem)] leading-[1.7] text-white/62">
                            {step.body ?? dealRange?.value}
                          </p>
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
