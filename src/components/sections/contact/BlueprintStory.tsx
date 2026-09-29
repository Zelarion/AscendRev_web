'use client';

import { useRef, useState, type JSX } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';
import { prefersReducedMotion } from '@/lib/motion';
import type { WhatToExpectContent } from '@/content/contact';

interface BlueprintStoryProps {
  content: WhatToExpectContent;
}

/**
 * The enquiry blueprint keeps native page scroll intact. On laptop and desktop
 * widths, each stage updates the active rail as it crosses the reader's
 * reading line. The complete stage copy is always rendered so the story still
 * works with JavaScript off and for readers who prefer reduced motion.
 */
export default function BlueprintStory({ content }: BlueprintStoryProps): JSX.Element {
  const scope = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(
    () => {
      const element = scope.current;
      if (!element || prefersReducedMotion()) return;

      registerMotion();

      const stages = gsap.utils.toArray<HTMLElement>('[data-blueprint-stage]', element);
      if (!stages.length) return;

      // The animation is an enhancement for laptop/desktop readers. Smaller
      // viewports keep their ordinary, fully expanded document flow so touch
      // scroll remains entirely under the reader's control.
      const media = gsap.matchMedia();
      media.add('(min-width: 1024px)', () => {
        setActiveIndex(0);
        const triggers = stages.map((stage, index) => {
          const card = stage.querySelector<HTMLElement>('[data-blueprint-card]');
          if (!card) return null;

          return gsap.fromTo(
            card,
            { y: 20, opacity: 0.78 },
            {
              y: 0,
              opacity: 1,
              duration: 0.65,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: stage,
                start: 'top 70%',
                end: 'bottom 36%',
                invalidateOnRefresh: true,
                onEnter: () => setActiveIndex(index),
                onEnterBack: () => setActiveIndex(index),
                onLeave: () => setActiveIndex(Math.min(index + 1, stages.length - 1)),
                onLeaveBack: () => setActiveIndex(Math.max(index - 1, 0)),
              },
            }
          );
        });

        // `useGSAP` cleans up the timelines and their ScrollTriggers. This
        // closure only releases the breakpoint context when it changes.
        return () => {
          triggers.forEach((trigger) => trigger?.kill());
        };
      });

      return () => media.revert();
    },
    { scope, dependencies: [content.steps.length] }
  );

  return (
    <div ref={scope}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-text)] sm:text-[11px]">
        THE 15-MINUTE BLUEPRINT
      </p>
      <h2
        id="what-to-expect-heading"
        className="mt-3 max-w-[20ch] scroll-mt-[calc(var(--header-height)_+_1rem)] font-display text-h2 text-[var(--navy-900)]"
      >
        {content.heading}
      </h2>
      <p className="mt-4 max-w-[42ch] text-body text-[var(--ink-muted)]">
        {content.description}
      </p>

      <div className="relative mt-7 lg:mt-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-7 left-5 top-7 w-px bg-[var(--border)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-5 top-7 z-[1] w-[2px] origin-top rounded-full bg-[var(--gold-text)] transition-[height] duration-500 ease-out motion-reduce:transition-none"
          style={{
            height: `${((activeIndex + 1) / content.steps.length) * 100}%`,
            maxHeight: 'calc(100% - 3.5rem)',
          }}
        />

        <ol className="m-0 list-none space-y-4 p-0 lg:space-y-6" aria-label="Solution blueprint stages">
          {content.steps.map((step, index) => {
            const active = activeIndex === index;
            return (
              <li
                key={step.title}
                data-blueprint-stage={index}
                aria-current={active ? 'step' : undefined}
                className="relative z-[2] pl-11"
              >
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-5 grid h-10 w-10 place-items-center rounded-full border text-[10px] font-bold tracking-[0.08em] transition-[background-color,border-color,color,box-shadow] duration-500 motion-reduce:transition-none ${active ? 'border-[var(--gold-text)] bg-[var(--navy-900)] text-white shadow-[0_0_0_5px_var(--surface)]' : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-muted)]'}`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <article
                  data-blueprint-card
                  className={`min-w-0 rounded-[10px] border p-4 transition-[background-color,border-color,box-shadow] duration-500 motion-reduce:transition-none sm:p-5 ${active ? 'border-[var(--gold-text)]/55 bg-[var(--surface-raised)] shadow-[0_16px_34px_rgba(13,31,57,0.09)]' : 'border-[var(--border)] bg-[var(--surface-raised)]/85'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--gold-text)]">
                      Stage {String(index + 1).padStart(2, '0')}
                    </p>
                    <span
                      aria-hidden="true"
                      className={`mt-1 h-px shrink-0 transition-[width,background-color] duration-500 motion-reduce:transition-none ${active ? 'w-10 bg-[var(--gold-text)]' : 'w-5 bg-[var(--border-strong)]'}`}
                    />
                  </div>
                  <h3 className="ar-blueprint-step-title mt-3 min-w-0 [overflow-wrap:anywhere]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">
                    {step.detail}
                  </p>
                </article>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-5 rounded-[10px] bg-[var(--navy-900)] px-4 py-4 text-white sm:px-5">
        <div>
          <p className="font-display text-[17px] leading-tight">Your Growth. Our Mission.</p>
          <p className="mt-1 text-xs leading-5 text-white/75">
            A clear starting point for the capacity your operation needs.
          </p>
        </div>
      </div>
    </div>
  );
}
