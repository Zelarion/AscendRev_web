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
  { label: 'Staff Parking', src: '/images/parking2.jpg', alt: 'Staff parking entrance with attendant and vehicles.' },
  { label: 'Elevator', src: '/images/elev.jpg', alt: 'Elevator in the AscendRev building.' },
  { label: 'Lobby', src: '/images/lobby1.jpg', alt: 'Reception and lobby seating area.' },
  { label: 'Stairs', src: '/images/staircase1.jpg', alt: 'Interior staircase connecting the building floors.' },
  { label: 'Washrooms', src: '/images/bathroom2.jpg', alt: 'Washroom sinks and mirrors.' },
  { label: 'AscendRev Campus', src: '/images/outside.jpg', alt: 'Exterior of the AscendRev campus with its building sign.' },
] as const;

const FRAME_COUNT = 72;
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
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  context.clearRect(0, 0, width, height);
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
  const [framesReady, setFramesReady] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cancelled = false;
    const images = Array.from({ length: FRAME_COUNT }, (_, index) => {
      const image = new window.Image();
      image.decoding = 'async';
      image.src = frameUrl(index);
      return image;
    });

    imagesRef.current = images;
    void Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }
            image.onload = () => resolve();
            image.onerror = () => resolve();
          }),
      ),
    ).then(() => {
      if (!cancelled) setFramesReady(images.every((image) => image.naturalWidth > 0));
    });

    return () => {
      cancelled = true;
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
        const image = images[Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frame)))];
        if (image?.naturalWidth) drawCover(canvas, image, context);
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
          scrub: 0.65,
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

      const resizeObserver = new ResizeObserver(() => drawRef.current(playhead.frame));
      resizeObserver.observe(canvas);
      ScrollTrigger.refresh();

      return () => {
        resizeObserver.disconnect();
        drawRef.current = () => undefined;
      };
    },
    { scope: rootRef, dependencies: [framesReady, stages] },
  );

  useGSAP(
    () => {
      const gallery = rootRef.current?.querySelector<HTMLElement>('[data-facilities-gallery]');
      const track = gallery?.querySelector<HTMLElement>('[data-facilities-track]');
      if (!gallery || !track) return;

      const media = gsap.matchMedia();
      media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const distance = () => Math.max(0, track.scrollWidth - gallery.clientWidth);
        if (distance() <= 0) return;

        registerMotion();
        gallery.classList.add(styles.scrollDriven);
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: gallery,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        return () => gallery.classList.remove(styles.scrollDriven);
      });

      return () => media.revert();
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
        <div className={styles.galleryViewport} tabIndex={0} aria-label="Scroll through facility photos">
          <div className={styles.galleryTrack} data-facilities-track>
            {FACILITIES.map((facility, index) => (
              <figure className={styles.facilityCard} key={facility.label}>
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
