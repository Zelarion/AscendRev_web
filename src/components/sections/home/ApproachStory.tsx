'use client';

import { useRef, type JSX } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';
import { prefersReducedMotion } from '@/lib/motion';

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
 * Scroll-linked brand sequence. The server-rendered default is a readable
 * vertical stack; when motion is allowed, GSAP turns it into a pinned
 * horizontal story at phone, tablet, and desktop widths.
 */
export default function ApproachStory({ stages }: ApproachStoryProps): JSX.Element {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track || prefersReducedMotion()) return;

      registerMotion();

      // Keep the same scroll-led horizontal story on phones, tablets, and
      // desktop. Reduced-motion visitors returned above and retain the
      // readable vertical stack.
      const panels = gsap.utils.toArray<HTMLElement>('[data-approach-panel]', section);
      if (panels.length < 2) return;

      section.style.height = 'calc(100svh - var(--header-height))';
      section.style.minHeight = '0px';
      track.style.display = 'flex';
      track.style.flexDirection = 'row';
      track.style.width = `${panels.length * 100}%`;
      track.style.height = '100%';
      panels.forEach((panel) => {
        panel.style.flex = `0 0 ${100 / panels.length}%`;
        panel.style.width = `${100 / panels.length}%`;
        panel.style.height = '100%';
        panel.style.minHeight = '0px';
      });
      section.dataset.scrollStoryReady = 'true';

      const horizontalDistance = () => Math.max(0, track.scrollWidth - section.clientWidth);
      const pinDistance = () => {
        const width = window.innerWidth;
        const readingRoom = width < 768 ? 1.8 : width < 1024 ? 1.35 : 1;
        return Math.max(1, Math.ceil(horizontalDistance() * readingRoom));
      };
      const headerOffset = () => {
        const value = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
        return Number.parseFloat(value) || 96;
      };
      const horizontal = gsap.to(track, {
        x: () => -horizontalDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: () => `top top+=${headerOffset()}`,
          end: () => `+=${pinDistance()}`,
          pin: true,
          // This is a standalone section in the page's normal block flow.
          // Keep its scroll distance in the document so the video story and
          // every section after it retain their measured positions on refresh.
          pinSpacing: true,
          pinType: 'fixed',
          // Keep the pin and its horizontal track on the same progress. A
          // numeric scrub eases the track behind the pin; on a quick touch
          // scroll the pin can reach its end and leave before the track does.
          scrub: true,
          anticipatePin: 1,
          // The downstream sticky office story is registered asynchronously
          // after its image sequence loads. Refresh this pin before measuring
          // that later trigger so its spacer is included in the page flow.
          refreshPriority: 1,
          invalidateOnRefresh: true,
        },
      });

      panels.forEach((panel, index) => {
        const art = panel.querySelector<HTMLElement>('[data-approach-art]');
        const copy = panel.querySelector<HTMLElement>('[data-approach-copy]');
        if (art) {
          gsap.to(art, {
            y: index % 2 === 0 ? -22 : 22,
            rotationY: index % 2 === 0 ? 14 : -14,
            rotationZ: index % 2 === 0 ? -4 : 4,
            ease: 'none',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: horizontal,
              start: 'left right',
              end: 'right left',
              scrub: 0.65,
            },
          });
        }
        if (copy && index > 0) {
          gsap.fromTo(
            copy,
            { x: 36, opacity: 0.45 },
            {
              x: 0,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                containerAnimation: horizontal,
                start: 'left 82%',
                end: 'left 38%',
                scrub: true,
              },
            }
          );
        }
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
              end: () => `+=${pinDistance()}`,
              scrub: true,
            },
          }
        );
      }

      return () => {
        delete section.dataset.scrollStoryReady;
      };
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
            <div className="mx-auto grid w-full max-w-[1540px] items-center gap-4 sm:gap-5 md:grid-cols-[0.95fr_1.05fr] md:gap-8 lg:gap-20">
              <div data-approach-copy className="relative z-10 max-w-[690px]">
                <p className="font-mono text-xs font-medium tracking-[0.2em] text-[var(--gold-text)]">
                  {String(index + 1).padStart(2, '0')} <span aria-hidden="true">/</span> 03
                </p>
                <h2 className={`mt-4 max-w-[11ch] font-display text-[clamp(2.15rem,8vw,3.4rem)] font-medium leading-[0.94] tracking-[-0.045em] md:mt-4 md:text-[clamp(2.55rem,5vw,4rem)] lg:mt-6 lg:text-[clamp(3.25rem,7.2vw,7.8rem)] lg:leading-[0.91] ${STAGE_COLORS[index]}`}>
                  {stages[index]}
                </h2>
                <div className="mt-5 h-px w-20 bg-[var(--gold-text)] sm:mt-7 lg:mt-10" />
                <p className="mt-4 max-w-[38ch] text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)] sm:mt-5 sm:text-sm sm:tracking-[0.15em] lg:text-base">
                  ASCENDREV <span className="text-[var(--steel-600)]">·</span> PEOPLE · PROCESS · PERFORMANCE
                </p>
              </div>

              <figure className="relative mx-auto w-full max-w-[560px] md:w-full md:justify-self-end lg:max-w-[440px] lg:w-[min(40vw,440px)]">
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

                <div className="relative aspect-[16/10] overflow-hidden rounded-[8px] border border-[var(--line-strong)] bg-[var(--surface-band-raised)] shadow-[0_24px_64px_rgba(15,27,51,0.12)] lg:aspect-[4/5]">
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
        className="pointer-events-none absolute bottom-0 left-[clamp(1.25rem,5vw,5.5rem)] right-[clamp(1.25rem,5vw,5.5rem)] z-30 hidden h-[2px] bg-[var(--line)] md:block"
      >
        <span data-approach-progress className="block h-full w-full origin-left bg-[var(--gold-text)]" />
      </div>
    </section>
  );
}
