'use client';

import { useEffect, useRef, useState, type JSX } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';
import { prefersReducedMotion } from '@/lib/motion';
import styles from './OfficeFrameStory.module.css';

interface OfficeFrameStoryProps {
  stages: readonly [string, string, string];
}

const SCENES = [
  {
    place: 'Boardroom',
    accent: 'green',
  },
  {
    place: 'Hallway',
    accent: 'blue',
  },
  {
    place: 'Workspace',
    accent: 'gold',
  },
] as const;

const FACILITIES = [
  { label: 'Hallway', src: '/images/hallway1.jpg', alt: 'Interior hallway at the AscendRev campus.' },
  { label: 'Operations', src: '/images/office4.jpg', alt: 'Cubicles and workstations on the operations floor.' },
  { label: 'Break / Coffee Area', src: '/images/new1.jpg', alt: 'Shared cafeteria and break area.' },
  { label: 'Boardroom', src: '/images/office3.jpg', alt: 'Boardroom meeting space with a conference table and seating.' },
  { label: 'Staff Parking', src: '/images/parking1.jpg', alt: 'Covered staff parking with vehicles.' },
  { label: 'Guards on Duty', src: '/images/parking2.jpg', alt: 'A uniformed security guard monitoring the parking entrance.' },
  { label: 'Elevator', src: '/images/elev.jpg', alt: 'Elevator in the AscendRev building.' },
  { label: 'Lobby', src: '/images/lobby1.jpg', alt: 'Reception and lobby seating area.' },
  { label: 'Stairs', src: '/images/staircase1.jpg', alt: 'Interior staircase connecting the building floors.' },
  { label: 'Washroom Vanity', src: '/images/bathroom2.jpg', alt: 'Close view of the washroom vanity, sinks, and mirrors.' },
  { label: 'Washroom Stall', src: '/images/bathroom1.jpg', alt: 'A private washroom stall and its entrance.' },
  { label: 'AscendRev Campus', src: '/images/outside.jpg', alt: 'Exterior of the AscendRev campus with its building sign.' },
] as const;

const FRAME_COUNT = 72;
const FRAME_LOAD_CONCURRENCY = 4;
const FRAME_BASE = '/video/approach-frames/frame-';

function frameUrl(index: number): string {
  return `${FRAME_BASE}${String(index + 1).padStart(3, '0')}.webp`;
}

function drawCover(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  context: CanvasRenderingContext2D,
): void {
  const rect = canvas.getBoundingClientRect();
  // A 1x backing store avoids the large fill-rate cost of redrawing 72 full-screen
  // images at retina resolution on every scroll update.
  const ratio = Math.min(window.devicePixelRatio || 1, 1.1);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
}

/**
 * Scroll-scrubbed frame sequence with an accessible, responsive facilities
 * gallery. The poster and gallery remain available when motion is reduced.
 */
export default function OfficeFrameStory({ stages }: OfficeFrameStoryProps): JSX.Element {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const drawRef = useRef<(frame: number) => void>(() => undefined);
  const pumpFramesRef = useRef<() => void>(() => undefined);
  const requestedFrameRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);
  const drawRafRef = useRef<number | null>(null);
  const [framesReady, setFramesReady] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cancelled = false;
    const images = Array.from({ length: FRAME_COUNT }, () => {
      const image = new window.Image();
      image.decoding = 'async';
      return image;
    });
    imagesRef.current = images;

    const runway = rootRef.current?.querySelector<HTMLElement>('[data-office-runway]');
    if (!runway) return;

    // Keep the home page light on first paint. Begin loading the sequence shortly
    // before its pinned section enters the viewport, with a small bounded queue.
    let started = false;
    const pending = new Set(Array.from({ length: FRAME_COUNT }, (_, index) => index));
    let active = 0;

    const pump = (): void => {
      if (cancelled || !started) return;
      while (active < FRAME_LOAD_CONCURRENCY && pending.size > 0) {
        const requested = requestedFrameRef.current;
        let nextIndex = -1;
        let nearestDistance = Number.POSITIVE_INFINITY;
        pending.forEach((index) => {
          const distance = Math.abs(index - requested);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nextIndex = index;
          }
        });
        if (nextIndex < 0) return;

        pending.delete(nextIndex);
        active += 1;
        const image = images[nextIndex];
        let settled = false;
        const finish = (): void => {
          if (settled) return;
          settled = true;
          active -= 1;
          if (cancelled) return;
          if (nextIndex === 0 && image.naturalWidth > 0) setFramesReady(true);
          if (nextIndex === requestedFrameRef.current && image.naturalWidth > 0) {
            drawRef.current(requestedFrameRef.current);
          }
          pump();
        };

        image.onload = () => {
          void image.decode().catch(() => undefined).then(finish);
        };
        image.onerror = finish;
        image.src = frameUrl(nextIndex);
      }
    };

    const startLoading = (): void => {
      if (started || cancelled) return;
      started = true;
      pump();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          startLoading();
        }
      },
      { rootMargin: '500px 0px' },
    );
    observer.observe(runway);
    pumpFramesRef.current = pump;

    return () => {
      cancelled = true;
      observer.disconnect();
      pumpFramesRef.current = () => undefined;
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const images = imagesRef.current;
      const context = canvas?.getContext('2d', { alpha: false });
      if (!root || !canvas || !context || !framesReady || prefersReducedMotion()) return;
      const runway = root.querySelector<HTMLElement>('[data-office-runway]');
      if (!runway) return;

      registerMotion();
      drawRef.current = (frame) => {
        const nextFrame = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frame)));
        requestedFrameRef.current = nextFrame;
        pumpFramesRef.current();
        if (nextFrame === lastDrawnFrameRef.current || drawRafRef.current !== null) return;

        drawRafRef.current = window.requestAnimationFrame(() => {
          drawRafRef.current = null;
          const image = images[nextFrame];
          // A newer scroll position can arrive before this callback runs.
          const latestFrame = requestedFrameRef.current;
          const latestImage = images[latestFrame];
          if (latestFrame !== nextFrame) {
            if (latestImage?.naturalWidth) {
              drawCover(canvas, latestImage, context);
              lastDrawnFrameRef.current = latestFrame;
            }
            return;
          }
          if (image?.naturalWidth) {
            drawCover(canvas, image, context);
            lastDrawnFrameRef.current = nextFrame;
          }
        });
      };
      drawRef.current(0);

      const playhead = { frame: 0 };
      const sceneCards = gsap.utils.toArray<HTMLElement>('[data-office-scene]', root);
      const progress = root.querySelector<HTMLElement>('[data-office-progress]');

      gsap.set(sceneCards, { autoAlpha: 0, y: 22, clipPath: 'inset(0 0 24% 0)' });
      gsap.set(sceneCards[0], { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)' });

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: runway,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(playhead, {
        frame: FRAME_COUNT - 1,
        duration: 3,
        onUpdate: () => drawRef.current(playhead.frame),
      }, 0);

      if (progress) timeline.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 3 }, 0);

      sceneCards.forEach((card, index) => {
        const start = index;
        if (index > 0) {
          timeline.to(sceneCards[index - 1], {
            autoAlpha: 0,
            y: -16,
            clipPath: 'inset(0 0 20% 0)',
            duration: 0.16,
          }, start - 0.08);
          timeline.fromTo(card, {
            autoAlpha: 0,
            y: 28,
            clipPath: 'inset(0 0 28% 0)',
          }, {
            autoAlpha: 1,
            y: 0,
            clipPath: 'inset(0 0 0% 0)',
            duration: 0.18,
          }, start);
        }
      });

      const resizeObserver = new ResizeObserver(() => {
        lastDrawnFrameRef.current = -1;
        drawRef.current(playhead.frame);
      });
      resizeObserver.observe(canvas);
      ScrollTrigger.refresh();

      return () => {
        resizeObserver.disconnect();
        drawRef.current = () => undefined;
        if (drawRafRef.current !== null) {
          window.cancelAnimationFrame(drawRafRef.current);
          drawRafRef.current = null;
        }
      };
    },
    { scope: rootRef, dependencies: [framesReady, stages] },
  );

  useGSAP(
    () => {
      const gallery = rootRef.current?.querySelector<HTMLElement>('[data-facilities-gallery]');
      const cards = gallery?.querySelectorAll<HTMLElement>('[data-facility-card]');
      if (!gallery || !cards?.length || prefersReducedMotion()) return;

      registerMotion();
      gsap.set(cards, { autoAlpha: 0, y: 18 });
      const revealTriggers = ScrollTrigger.batch(cards, {
        start: 'top 88%',
        once: true,
        onEnter: (visibleCards) => {
          gsap.to(visibleCards, {
            autoAlpha: 1,
            y: 0,
            duration: 0.42,
            stagger: 0.055,
            ease: 'power2.out',
            overwrite: true,
          });
        },
      });

      return () => revealTriggers.forEach((trigger) => trigger.kill());
    },
    { scope: rootRef, dependencies: [stages] },
  );

  return (
    <section ref={rootRef} data-office-story className={styles.section} aria-labelledby="office-story-title">
      <div className={styles.intro}>
        <h2 id="office-story-title">Our Facilities in Action</h2>
      </div>

      <div data-office-runway className={styles.runway}>
        <div className={styles.stage}>
          <div className={styles.posterFrame}>
            <Image
              src={frameUrl(0)}
              alt="A frame from the AscendRev facilities tour."
              fill
              priority={false}
              sizes="100vw"
              className={styles.poster}
            />
          </div>
          <canvas ref={canvasRef} aria-hidden="true" className={`${styles.canvas} ${framesReady ? styles.canvasReady : ''}`} />
          <div aria-hidden="true" className={styles.scrim} />

          <div className={styles.copyRail}>
            <div className={styles.sceneCopy} data-office-scene data-accent={SCENES[0].accent}>
              <h3>{SCENES[0].place}</h3>
            </div>
            <div className={styles.sceneCopy} data-office-scene data-accent={SCENES[1].accent}>
              <h3>{SCENES[1].place}</h3>
            </div>
            <div className={styles.sceneCopy} data-office-scene data-accent={SCENES[2].accent}>
              <h3>{SCENES[2].place}</h3>
            </div>
          </div>

          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} data-office-progress />
          </div>
        </div>
      </div>

      <div className={styles.facilitiesGallery} data-facilities-gallery aria-label="AscendRev facilities photo gallery">
        <div className={styles.galleryViewport}>
          <div className={styles.galleryTrack} data-facilities-track>
            {FACILITIES.map((facility, index) => (
              <figure className={styles.facilityCard} data-facility-card key={facility.label}>
                <div className={styles.facilityImage}>
                  <Image
                    src={facility.src}
                    alt={facility.alt}
                    fill
                    sizes="(max-width: 767px) 82vw, (max-width: 1023px) 48vw, 30vw"
                    className={styles.facilityPhoto}
                  />
                  <span className={styles.facilityNumber}>0{index + 1}</span>
                </div>
                <figcaption>{facility.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
      <span className={styles.srOnly}>Frame-by-frame visual tour, with {stages.length} scenes.</span>
    </section>
  );
}
