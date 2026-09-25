'use client';

import { useRef, type JSX } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';

interface ApproachStoryProps {
  stages: readonly [string, string, string];
}

const STORY_STAGES = [
  {
    image: '/images/new1.jpg',
    alt: 'A bright office training room with rows of work tables and stools',
    cropClass: 'scale-[1.2] lg:scale-[1.04]',
    art: 'gold',
  },
  {
    image: '/images/office4.jpg',
    alt: 'An open office floor with rows of blue-partition workstations',
    cropClass: 'scale-[1.12] lg:scale-[1.04]',
    art: 'blue',
  },
  {
    image: '/images/office5.jpg',
    alt: 'A closer view of office workstations with desks and chairs',
    cropClass: 'scale-[1.08] lg:scale-[1.02]',
    art: 'green',
  },
] as const;

const STAGE_COLORS = [
  'text-[var(--green-600)]',
  'text-[var(--steel-600)]',
  'text-[var(--gold-text)]',
] as const;

/**
 * Scroll-linked brand sequence. It stays a readable vertical stack on phones
 * and very short displays; tablets, laptops and desktops get a
 * single pinned horizontal pass driven by normal vertical page scrolling.
 */
export default function ApproachStory({ stages }: ApproachStoryProps): JSX.Element {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const responsiveMotion = gsap.matchMedia();
      responsiveMotion.add(
        '(min-width: 42rem) and (min-height: 34rem) and (prefers-reduced-motion: no-preference)',
        () => {
          registerMotion();
          const panels = gsap.utils.toArray<HTMLElement>('[data-approach-panel]', section);
          if (panels.length < 2) return;

          gsap.set(section, { height: 'calc(100svh - var(--header-height))', minHeight: 0 });
          gsap.set(track, {
            display: 'flex',
            flexDirection: 'row',
            width: `${panels.length * 100}%`,
            height: '100%',
          });
          gsap.set(panels, {
            flex: `0 0 ${100 / panels.length}%`,
            width: `${100 / panels.length}%`,
            height: '100%',
            minHeight: 0,
          });

          const horizontalDistance = () => Math.max(0, track.scrollWidth - section.clientWidth);
          const headerOffset = () => {
            const value = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
            return Number.parseFloat(value) || 84;
          };

          gsap.to(track, {
            x: () => -horizontalDistance(),
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: () => `top top+=${headerOffset()}`,
              end: () => `+=${horizontalDistance()}`,
              pin: true,
              pinSpacing: true,
              scrub: true,
              anticipatePin: 1,
              refreshPriority: 1,
              invalidateOnRefresh: true,
            },
          });

          const progress = section.querySelector<HTMLElement>('[data-approach-progress]');
          if (progress) {
            gsap.fromTo(
              progress,
              { scaleX: 0 },
              {
                scaleX: 1,
                transformOrigin: 'left center',
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: () => `top top+=${headerOffset()}`,
                  end: () => `+=${horizontalDistance()}`,
                  scrub: true,
                },
              }
            );
          }

          section.dataset.scrollStoryReady = 'true';
          return () => delete section.dataset.scrollStoryReady;
        }
      );

      return () => responsiveMotion.revert();
    },
    { scope: sectionRef, dependencies: [stages] }
  );

  return (
    <section
      ref={sectionRef}
      aria-label="How AscendRev turns opportunity into execution"
      className="relative w-full overflow-hidden bg-[var(--surface-page)] text-[var(--text-primary)]"
    >
      <div ref={trackRef} className="flex flex-col">
        {STORY_STAGES.map((story, index) => (
          <article
            key={story.image}
            data-approach-panel
            className={`relative grid min-h-0 w-full shrink-0 items-center overflow-hidden border-t border-[var(--line)] px-[clamp(1.25rem,5vw,5.5rem)] py-5 sm:py-8 lg:min-h-[80svh] lg:py-10 ${
              index === 1 ? 'bg-[var(--surface-band-raised)]' : 'bg-[var(--surface-page)]'
            }`}
          >
            <div className="mx-auto grid w-full max-w-[1540px] items-center gap-3 sm:gap-5 min-[42rem]:grid-cols-[0.9fr_1.1fr] min-[42rem]:gap-4 lg:gap-12 xl:gap-20">
              <div data-approach-copy className="relative z-10 max-w-[690px]">
                <p className="font-mono text-xs font-medium tracking-[0.2em] text-[var(--gold-text)]">
                  {String(index + 1).padStart(2, '0')} <span aria-hidden="true">/</span> 03
                </p>
                <h2 className={`mt-2 max-w-[11ch] font-display text-[clamp(1.8rem,6vw,2.8rem)] font-medium leading-[0.94] tracking-[-0.045em] sm:mt-3 min-[42rem]:text-[clamp(1.85rem,3.1vw,3.25rem)] xl:mt-5 xl:text-[clamp(3rem,4.2vw,5rem)] xl:leading-[0.91] ${STAGE_COLORS[index]}`}>
                  {stages[index]}
                </h2>
                <div className="mt-3 h-px w-20 bg-[var(--gold-text)] sm:mt-5 lg:mt-8" />
                <p className="mt-3 max-w-full text-[clamp(0.56rem,1.5vw,1rem)] font-medium uppercase tracking-[0.03em] text-[var(--text-muted)] sm:mt-4">
                  ASCENDREV <span className="text-[var(--steel-600)]">·</span> PEOPLE · PROCESS · PERFORMANCE
                </p>
              </div>

              <figure className="relative mx-auto w-full max-w-[560px] min-[42rem]:max-w-none min-[42rem]:justify-self-end lg:w-full">
                <div
                  data-approach-art
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-7 -top-8 z-20 aspect-square w-[35%] [transform-style:preserve-3d] sm:-right-10 sm:-top-10 ${
                    story.art === 'gold'
                      ? 'text-[var(--gold-display)]'
                      : story.art === 'blue'
                        ? 'text-[var(--steel-600)]'
                        : 'text-[var(--green-600)]'
                  }`}
                  style={{ perspective: '900px' }}
                >
                  <span
                    className="absolute inset-[4%] rounded-full border-[3px] border-current/65"
                    style={{ transform: 'rotateX(62deg) rotateZ(-24deg) translateZ(18px)' }}
                  />
                  <span
                    className="absolute inset-[19%] rounded-full bg-gradient-to-br from-current to-[var(--surface-band-raised)] opacity-90 shadow-[0_18px_45px_rgba(15,27,51,0.18)]"
                    style={{ transform: 'translateZ(42px)' }}
                  />
                  <span
                    className="absolute bottom-[8%] left-[8%] h-[24%] w-[24%] rounded-full border border-current/70 bg-[var(--surface-page)]/70"
                    style={{ transform: 'translateZ(64px)' }}
                  />
                </div>

                <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-band-raised)] shadow-[0_24px_64px_rgba(15,27,51,0.12)]">
                  <Image
                    src={story.image}
                    alt={story.alt}
                    fill
                    sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 88vw"
                    className={`object-cover ${story.cropClass}`}
                  />
                </div>
                <figcaption className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <span>ASCENDREV</span>
                  <span>0{index + 1}</span>
                </figcaption>
              </figure>
            </div>
          </article>
        ))}
      </div>

      <div
        aria-hidden="true"
        className="ar-approach-progress-rail pointer-events-none absolute bottom-0 left-[clamp(1.25rem,5vw,5.5rem)] right-[clamp(1.25rem,5vw,5.5rem)] z-30 hidden h-[2px] bg-[var(--line)]"
      >
        <span data-approach-progress className="block h-full w-full origin-left bg-[var(--gold-text)]" />
      </div>
    </section>
  );
}
