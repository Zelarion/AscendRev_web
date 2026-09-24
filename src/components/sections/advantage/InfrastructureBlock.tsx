'use client';

import { useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import { advantage } from '@/content/advantage';

type ProofKind = 'location' | 'infrastructure' | 'workplace';

interface ProofMoment {
  id: ProofKind;
  number: string;
  label: string;
  headline: string;
  body: string;
  meta: readonly string[];
}

function FacilityImage({
  placeholderLabel,
  label,
  aspect = 'aspect-[16/7]',
  annotations,
  active,
  registerTiltTarget,
}: {
  /** What belongs in this slot, per SPEC.md §5: specific enough to brief a photographer. */
  placeholderLabel: string;
  label: string;
  aspect?: string;
  annotations?: readonly string[];
  active: boolean;
  registerTiltTarget?: (node: HTMLElement | null) => void;
}): JSX.Element {
  return (
    <div className="[perspective:720px]">
      <figure
        ref={registerTiltTarget}
        className={cn(
          'relative overflow-hidden rounded-[18px] border border-white/10 bg-[#0f1c2f] transition-transform duration-150 ease-out [transform-style:preserve-3d] will-change-transform motion-reduce:transform-none motion-reduce:transition-none',
          aspect
        )}
      >
      {/*
        No stock photography here on purpose (build brief, 2026-09-24): this
        block previously hotlinked Pexels images of somebody else's offices,
        which is exactly what the honesty framing on this page argues against.
        `ImagePlaceholder` is the same unfilled-slot component the rest of the
        site uses once a real, AscendRev-owned photograph exists.
      */}
      <ImagePlaceholder
        label={placeholderLabel}
        className={cn(
          'absolute inset-0 h-full w-full border-white/15 bg-transparent text-white/70 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          active ? 'opacity-100' : 'opacity-60'
        )}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,22,0.16)_0%,rgba(5,12,22,0.1)_45%,rgba(5,12,22,0.5)_100%)]"
      />

      <figcaption className="absolute inset-x-5 top-5 sm:inset-x-7 sm:top-7">
        <span className="inline-flex border border-white/12 bg-[#07111f]/60 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--gold-300)] backdrop-blur-sm sm:text-[10px]">
          {label}
        </span>
      </figcaption>

      {annotations?.length ? (
        <div className="absolute bottom-6 right-5 hidden w-[46%] space-y-3 sm:block lg:right-7 lg:w-[42%]">
          {annotations.map((annotation) => (
            <div key={annotation} className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--gold-400)]/55" />
              <span className="bg-[#07111f]/65 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-white/82 backdrop-blur-sm">
                {annotation}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      </figure>
    </div>
  );
}

function RevealBlock({
  children,
  index,
  activeIndex,
  className,
}: {
  children: ReactNode;
  index: number;
  activeIndex: number;
  className?: string;
}): JSX.Element {
  const active = index === activeIndex;

  return (
    <div
      className={cn(
        'transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:opacity-100 motion-reduce:transition-none',
        active ? 'opacity-100' : 'opacity-35',
        className
      )}
    >
      {children}
    </div>
  );
}

export default function InfrastructureBlock(): JSX.Element {
  const { note } = advantage.infrastructure;
  const [activeIndex, setActiveIndex] = useState(0);
  const rowRefs = useRef<Array<HTMLElement | null>>([]);
  const tiltTargets = useRef<Array<HTMLElement | null>>([]);

  const proofMoments: ProofMoment[] = [
    {
      id: 'location',
      number: '01',
      label: 'LOCATION',
      headline: 'A location built around talent access.',
      body:
        'The final Philippine site and business-district location are still being confirmed. The operating requirement is a professional environment with strong access to regional talent and dependable supervision.',
      meta: ['Talent Access', 'Professional Environment', 'Location To Be Confirmed'],
    },
    {
      id: 'infrastructure',
      number: '02',
      label: 'INFRASTRUCTURE',
      headline: 'Built for continuity.',
      body:
        'The operating standard calls for controlled access, company-issued equipment, backup power, and a secondary connectivity path before client teams go live.',
      meta: ['Access Control', 'Backup Power', 'Secondary Connectivity'],
    },
    {
      id: 'workplace',
      number: '03',
      label: 'WORKPLACE',
      headline: 'Built for focus.',
      body:
        'The workspace is being designed to support focused delivery, direct supervision, and a professional day-to-day environment for the teams assigned to client accounts.',
      meta: ['Focused Workspaces', 'Direct Supervision', 'Professional Environment'],
    },
  ];

  useEffect(() => {
    let frame = 0;

    const updateActiveRow = () => {
      frame = 0;
      const rows = rowRefs.current.filter((node): node is HTMLElement => Boolean(node));
      if (!rows.length) return;

      const viewportCenter = window.scrollY + window.innerHeight * 0.5;
      const centers = rows.map((row) => {
        const rect = row.getBoundingClientRect();
        return window.scrollY + rect.top + rect.height * 0.5;
      });

      let nextIndex = 0;
      for (let index = 0; index < centers.length - 1; index += 1) {
        const midpoint = (centers[index] + centers[index + 1]) / 2;
        if (viewportCenter >= midpoint) nextIndex = index + 1;
      }

      setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveRow);
    };

    updateActiveRow();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return (
    <section
      id="infrastructure"
      data-tone="navy"
      onPointerMove={(event) => {
        if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const section = event.currentTarget;
        const rect = section.getBoundingClientRect();
        const normalizedX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        const normalizedY = Math.min(1, Math.max(0, event.clientY / window.innerHeight));
        const rotateY = (normalizedX - 0.5) * 20;
        const rotateX = (0.5 - normalizedY) * 16;

        tiltTargets.current.forEach((target) => {
          if (!target) return;
          target.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        });
      }}
      onPointerLeave={() => {
        tiltTargets.current.forEach((target) => {
          if (!target) return;
          target.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
      }}
      className="relative bg-[#0b1524] px-[clamp(1.25rem,5vw,5.5rem)] py-[clamp(6rem,10vw,9rem)] text-white"
    >
      <div className="mx-auto w-full max-w-[1540px]">
        <header className="max-w-[920px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-300)] sm:text-[11px]">
            THE ASCENDREV ADVANTAGE / 02
          </p>
          <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(3rem,5vw,5.8rem)] font-medium leading-[0.96] tracking-[-0.04em] text-white">
            State-of-the-Art Operations.
          </h2>
          <p className="mt-6 max-w-[64ch] text-[clamp(1rem,1.2vw,1.18rem)] leading-[1.75] text-white/62">
            Premium Philippine operations are being built around reliability, security, talent, and continuity.
          </p>

        </header>

        <div className="mt-[clamp(4rem,7vw,6rem)] divide-y divide-white/10 border-y border-white/10">
          {proofMoments.map((moment, index) => {
            const reverse = index % 2 === 1;
            const infrastructure = moment.id === 'infrastructure';
            const active = index === activeIndex;

            return (
              <article
                key={moment.id}
                ref={(node) => {
                  rowRefs.current[index] = node;
                }}
                data-infrastructure-row={index}
                className="grid gap-8 py-[clamp(3rem,5vw,4.5rem)] md:grid-cols-2 md:items-center md:gap-10 lg:gap-14"
              >
                <RevealBlock
                  index={index}
                  activeIndex={activeIndex}
                  className={cn('md:pr-5', reverse && 'md:order-2 md:pl-5 md:pr-0')}
                >
                  <div className="max-w-[620px]">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-[var(--gold-300)]">
                        {moment.number} / {moment.label}
                      </span>
                      <span className="h-px w-10 bg-[var(--gold-400)]/55" />
                    </div>

                    <h3 className="mt-5 max-w-[13ch] font-display text-[clamp(2.3rem,3.6vw,4.1rem)] font-medium leading-[0.98] tracking-[-0.04em] text-white">
                      {moment.headline}
                    </h3>

                    <p
                      className={cn(
                        'mt-6 max-w-[54ch] text-[clamp(1rem,1.15vw,1.16rem)] leading-[1.75] transition-colors duration-500',
                        active ? 'text-white' : 'text-white/62'
                      )}
                    >
                      {moment.body}
                    </p>

                    <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
                      {moment.meta.map((item) => (
                        <div
                          key={item}
                          className={cn(
                            'flex items-center justify-between gap-4 py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] transition-[opacity,color] duration-500 motion-reduce:opacity-100 motion-reduce:transition-none',
                            active ? 'text-white opacity-100' : 'text-white/52 opacity-35'
                          )}
                        >
                          <span>{item}</span>
                          <span className="h-px w-8 bg-[var(--gold-400)]/35" />
                        </div>
                      ))}
                    </div>
                  </div>
                </RevealBlock>

                <div className={cn('md:pl-5', reverse && 'md:order-1 md:pl-0 md:pr-5')}>
                  <FacilityImage
                    placeholderLabel={
                      moment.id === 'location'
                        ? "Photograph of AscendRev's own Philippine site once the location is confirmed. Must be our own premises, not a stock building photo."
                        : moment.id === 'workplace'
                          ? "Photograph of AscendRev's own workspace, taken after fit out. Must be our own premises, not a stock office photo."
                          : "Photograph of AscendRev's own infrastructure setup once installed. Not a stock data center photo."
                    }
                    label={
                      moment.id === 'location'
                        ? 'Makati Business District'
                        : moment.id === 'workplace'
                          ? 'Modern Workplace Environment'
                          : 'Enterprise Infrastructure'
                    }
                    aspect="aspect-[16/10]"
                    annotations={infrastructure ? moment.meta : undefined}
                    active={active}
                    registerTiltTarget={(node) => {
                      tiltTargets.current[index] = node;
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-[clamp(3rem,5vw,4rem)] max-w-[760px] text-center">
          <span aria-hidden="true" className="mx-auto block h-px w-16 bg-[var(--gold-400)]" />
          <p className="mt-6 font-display text-[clamp(1.8rem,2.8vw,3rem)] font-medium tracking-[-0.025em] text-white/86">
            Built for reliability. Designed for performance.
          </p>
          <p className="mx-auto mt-5 max-w-[68ch] text-xs leading-[1.7] text-white/34">{note}</p>
        </div>
      </div>
    </section>
  );
}
