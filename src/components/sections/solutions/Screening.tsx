'use client';

import type { JSX } from 'react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Section from '@/components/layout/Section';
import { prefersReducedMotion } from '@/lib/motion';
import { solutions } from '@/content/solutions';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STAGES = [
  {
    id: 'review',
    title: 'Review experience',
    description:
      'We begin with relevant experience and a focused first conversation to understand the candidate’s fit for the role.',
    steps: ['resume-screening', 'phone-interview'],
  },
  {
    id: 'assess',
    title: 'Assess capability',
    description:
      'Candidates move through an in-person conversation and a practical assessment of the skills the work calls for.',
    steps: ['face-to-face-screening', 'skills-technical-assessment'],
  },
  {
    id: 'align',
    title: 'Align, clear, and offer',
    description:
      'We bring the client or partner into the final interview, complete background checks and clearance, then extend the job offer.',
    steps: ['client-partner-final-interview', 'background-check-clearance', 'job-offer'],
  },
] as const;

/**
 * A scroll-led screening story: native page scroll advances the active stage,
 * while the sticky interview image carries the stage marker and caption.
 */
export default function Screening(): JSX.Element {
  const { heading, items, interviewImage } = solutions.screening;
  const allSteps = [...items, { id: 'job-offer', glyph: '✓', label: 'Job Offer' }];
  const stepById = new Map(allSteps.map((step) => [step.id, step]));
  const stageRefs = useRef<Array<HTMLElement | null>>([]);
  const animationScope = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const nodes = stageRefs.current.filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    let frame = 0;
    const updateActiveStage = () => {
      frame = 0;
      const readingLine = window.innerHeight * 0.4;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - readingLine);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveStage);
    };

    // Re-evaluate from geometry on every scroll frame. IntersectionObserver
    // can briefly choose a later stage while an in-page anchor is still
    // settling; the reading-line calculation always selects the nearest scene.
    updateActiveStage();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;

    gsap.utils.toArray<HTMLElement>('[data-screening-stage]').forEach((stage) => {
      const story = stage.querySelector<HTMLElement>('[data-stage-story]');
      if (!story) return;

      gsap.fromTo(
        story,
        { autoAlpha: 0.42, y: 34, scale: 0.985 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: stage,
            start: 'top 78%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });
  }, { scope: animationScope });

  const activeStage = STAGES[activeIndex] ?? STAGES[0];

  return (
    <Section id="team-screening" className="scroll-mt-[calc(var(--header-height)_+_1rem)] !py-[clamp(3.5rem,7vw,6rem)]">
      <div className="mx-auto w-full max-w-[1540px] px-[clamp(1.25rem,5vw,5.5rem)]">
        <div ref={animationScope} className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-14">
          <div className="lg:sticky lg:top-[calc(var(--header-height)_+_2rem)]">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold-text)] sm:text-[11px]">
              Clear standards. Consistent review.
            </p>
            <h2 className="max-w-[20ch] font-display text-[clamp(44px,3.5vw,60px)] leading-[1.04] tracking-[-0.035em] text-[var(--ink)]">{heading}</h2>
            <p className="mt-4 max-w-[38rem] text-body leading-relaxed text-[var(--ink-muted)]">
              Every candidate moves through a considered process—from first review to a final offer.
            </p>

            <figure className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-band)] sm:mt-8">
              <Image
                src={interviewImage.src}
                alt={interviewImage.alt}
                fill
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-[#07172f]/95 via-[#07172f]/60 to-transparent px-5 pb-5 pt-16 text-white sm:px-6 sm:pb-6">
                <div aria-live="polite" aria-atomic="true" className="min-w-0">
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#f1c451]">
                    Stage {String(activeIndex + 1).padStart(2, '0')} / 03
                  </span>
                  <span className="mt-1 block font-display text-h4">{activeStage.title}</span>
                </div>
                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/35 bg-white/10 font-display text-xl backdrop-blur-sm">
                  {String(activeIndex + 1).padStart(2, '0')}
                </span>
              </div>
            </figure>
            <div className="mt-4 flex items-center gap-2" aria-hidden="true">
              {STAGES.map((stage, index) => (
                <span
                  key={stage.id}
                  className={`h-[3px] rounded-full transition-[width,background-color] duration-500 motion-reduce:transition-none ${index === activeIndex ? 'w-12 bg-[var(--gold-text)]' : 'w-5 bg-[var(--border-strong)]'}`}
                />
              ))}
            </div>
          </div>

          <ol className="relative m-0 list-none space-y-5 p-0 sm:space-y-6">
            <span aria-hidden="true" className="pointer-events-none absolute bottom-12 left-[1.35rem] top-12 w-px bg-[var(--border)] sm:left-[1.55rem]" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-[1.35rem] top-12 z-[1] w-[2px] origin-top rounded-full bg-[var(--gold-text)] transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:left-[1.55rem]"
              style={{ height: `${(activeIndex / (STAGES.length - 1)) * 100}%`, maxHeight: 'calc(100% - 6rem)' }}
            />
            {STAGES.map((stage, index) => {
              const active = activeIndex === index;
              const stageSteps = stage.steps
                .map((stepId) => stepById.get(stepId))
                .filter((step): step is (typeof allSteps)[number] => Boolean(step));

              return (
                <li
                  key={stage.id}
                  ref={(node) => {
                    stageRefs.current[index] = node;
                  }}
                  data-screening-stage={index}
                  aria-current={active ? 'step' : undefined}
                  className="relative z-[2] pl-12 sm:pl-14"
                >
                  <article
                    data-stage-story
                    className={`relative min-h-[19rem] overflow-hidden rounded-[1rem] border p-5 transition-[border-color,background-color,box-shadow] duration-500 motion-reduce:transition-none sm:p-7 ${active ? 'border-[var(--gold-text)]/55 bg-[var(--surface)] shadow-[0_18px_46px_rgba(13,31,57,0.1)]' : 'border-[var(--border)] bg-[var(--surface)]/80'}`}
                  >
                    <span aria-hidden="true" className={`absolute -left-[2.55rem] top-6 z-[3] grid h-10 w-10 place-items-center rounded-full border text-[10px] font-bold tracking-[0.08em] transition-[background-color,color,border-color,box-shadow] duration-500 motion-reduce:transition-none sm:-left-[2.95rem] sm:h-11 sm:w-11 ${active ? 'border-[var(--gold-text)] bg-[var(--navy-900)] text-white shadow-[0_0_0_6px_var(--surface)]' : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-muted)]'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">
                          Stage {String(index + 1).padStart(2, '0')}
                        </p>
                        <h3 className="mt-2 font-display text-[clamp(28px,2.2vw,38px)] leading-[1.1] tracking-[-0.025em] text-[var(--ink)]">{stage.title}</h3>
                      </div>
                      <span aria-hidden="true" className={`mt-1 hidden h-px shrink-0 transition-[width,background-color] duration-500 motion-reduce:transition-none sm:block ${active ? 'w-12 bg-[var(--gold-text)]' : 'w-7 bg-[var(--border-strong)]'}`} />
                    </div>

                    <p className="mt-4 max-w-[42rem] text-body-lg leading-relaxed text-[var(--ink-muted)]">
                      {stage.description}
                    </p>

                    <ul className="mt-6 grid gap-2.5 sm:grid-cols-2" aria-label={`Steps in stage ${index + 1}`}>
                      {stageSteps.map((step, stepIndex) => {
                        const isOffer = step.id === 'job-offer';
                        return (
                          <li
                            key={step.id}
                            className={`flex min-h-[3.7rem] items-center gap-3 rounded-lg border-l-[3px] px-3.5 py-3 text-sm font-semibold leading-snug shadow-[0_4px_15px_rgba(15,27,51,0.035)] sm:min-h-[4.1rem] sm:px-4 sm:text-base ${isOffer ? 'border-l-[var(--gold-text)] border-y border-r border-y-[var(--gold-text)]/35 border-r-[var(--gold-text)]/35 bg-[var(--gold-300)]/15 text-[var(--navy-900)] sm:col-span-2' : `border-y border-r border-y-[var(--border)] border-r-[var(--border)] bg-white text-[var(--ink)] ${active ? 'border-l-[var(--steel-500)]' : 'border-l-[var(--border-strong)]'}`}`}
                          >
                            <span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-bold tracking-[0.06em] sm:h-9 sm:w-9 ${isOffer ? 'bg-[var(--gold-300)] text-[var(--navy-900)]' : 'bg-[var(--surface-band)] text-[var(--steel-700)]'}`}>
                              {String(index * 2 + stepIndex + 1).padStart(2, '0')}
                            </span>
                            <span>{step.label}</span>
                            {isOffer && <span className="sr-only">, final step</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Section>
  );
}
