'use client';

import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';
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
  { label: 'Guards on Duty', src: '/images/guards-on-duty-privacy.webp', alt: 'A uniformed security guard monitoring the parking entrance.' },
  { label: 'Elevator', src: '/images/elev.jpg', alt: 'Elevator in the AscendRev building.' },
  { label: 'Lobby', src: '/images/lobby1.jpg', alt: 'Reception and lobby seating area.' },
  { label: 'Stairs', src: '/images/staircase1.jpg', alt: 'Interior staircase connecting the building floors.' },
  { label: 'Washroom Vanity', src: '/images/washroom-vanity-clean.webp', alt: 'Close view of the washroom vanity, sinks, and mirrors.' },
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
  const galleryTweenRef = useRef<gsap.core.Tween | null>(null);
  const pendingTourReturnRef = useRef(false);
  const [framesReady, setFramesReady] = useState(false);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [tourBypassed, setTourBypassed] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || tourBypassed) return;
    let cancelled = false;
    const runway = rootRef.current?.querySelector<HTMLElement>('[data-office-runway]');
    if (!runway) return;
    const images = Array.from({ length: FRAME_COUNT }, () => {
      const image = new window.Image();
      image.decoding = 'async';
      return image;
    });
    imagesRef.current = images;

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
        image.removeAttribute('src');
      });
    };
  }, [tourBypassed]);

  useGSAP(
    () => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const images = imagesRef.current;
      const context = canvas?.getContext('2d', { alpha: false });
      if (!root || !canvas || !context || !framesReady || tourBypassed || prefersReducedMotion()) return;
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
    { scope: rootRef, dependencies: [framesReady, stages, tourBypassed] },
  );

  useGSAP(
    () => {
      const gallery = rootRef.current?.querySelector<HTMLElement>('[data-facilities-gallery]');
      const viewport = gallery?.querySelector<HTMLElement>('[data-facilities-viewport]');
      const track = gallery?.querySelector<HTMLElement>('[data-facilities-track]');
      if (!gallery || !viewport || !track || showAllFacilities || prefersReducedMotion()) return;

      registerMotion();
      // Killing a scrubbed tween removes its pin spacer but may leave its last
      // inline transform behind. Every newly mounted tour must begin on card 1.
      gsap.set(track, { x: 0 });
      const horizontalDistance = (): number => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const horizontalTour = gsap.to(track, {
        x: () => -horizontalDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: gallery,
          pin: viewport,
          start: 'top top',
          end: () => `+=${horizontalDistance()}`,
          scrub: 0.35,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      galleryTweenRef.current = horizontalTour;

      const refresh = (): void => ScrollTrigger.refresh();
      window.addEventListener('resize', refresh, { passive: true });
      return () => {
        window.removeEventListener('resize', refresh);
        horizontalTour.scrollTrigger?.kill(true);
        horizontalTour.kill();
        if (galleryTweenRef.current === horizontalTour) galleryTweenRef.current = null;
      };
    },
    { scope: rootRef, dependencies: [showAllFacilities, stages], revertOnUpdate: true },
  );

  useLayoutEffect(() => {
    if (!pendingTourReturnRef.current || showAllFacilities || tourBypassed) return;

    // React has restored the tour DOM before this effect. Read the gallery's
    // layout position from the top of the document after pin refresh; its rect
    // at a mid-page scroll can include pin offsets from upstream triggers.
    const scheduledFrames: number[] = [];
    const nextFrame = (callback: FrameRequestCallback): void => {
      scheduledFrames.push(window.requestAnimationFrame(callback));
    };
    let topAttempts = 0;
    const moveToGalleryStart = (): void => {
      window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
      nextFrame(() => {
        // CSS scroll-behavior is smooth globally. Do not measure until the
        // explicit instant move has actually put the document at its origin.
        if (Math.abs(window.scrollY) > 1) {
          if (topAttempts++ < 5) moveToGalleryStart();
          return;
        }

        ScrollTrigger.refresh();
        nextFrame(() => {
          if (Math.abs(window.scrollY) > 1) {
            if (topAttempts++ < 5) moveToGalleryStart();
            return;
          }

          const gallery = rootRef.current?.querySelector<HTMLElement>('[data-facilities-gallery]');
          if (!gallery) return;
          // With scrollY verified at zero, this is its layout position. The
          // refreshed trigger start aligns the viewport exactly with pin start.
          const trigger = galleryTweenRef.current?.scrollTrigger;
          const top = trigger?.start ?? gallery.getBoundingClientRect().top;
          window.scrollTo({ left: 0, top, behavior: 'instant' });
          nextFrame(() => {
            const currentGallery = rootRef.current?.querySelector<HTMLElement>('[data-facilities-gallery]');
            if (!currentGallery) return;
            const currentTrigger = galleryTweenRef.current?.scrollTrigger;
            const pinStart = currentTrigger?.start;
            if (pinStart !== undefined && Math.abs(window.scrollY - pinStart) > 1) {
              window.scrollTo({ left: 0, top: pinStart, behavior: 'instant' });
            }
            currentTrigger?.animation?.progress(0);
            ScrollTrigger.update();
            const track = currentGallery.querySelector<HTMLElement>('[data-facilities-track]');
            if (track) gsap.set(track, { x: 0 });
            currentGallery.focus({ preventScroll: true });
            pendingTourReturnRef.current = false;
          });
        });
      });
    };
    moveToGalleryStart();

    return () => {
      scheduledFrames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
  }, [showAllFacilities, tourBypassed]);

  const openAllFacilities = (): void => {
    // ScrollTrigger reparents a pinned element into its spacer. Revert that DOM
    // mutation before React inserts the grid heading or changes gallery classes.
    const tour = galleryTweenRef.current;
    tour?.scrollTrigger?.kill(true);
    tour?.kill();
    galleryTweenRef.current = null;
    setFramesReady(false);
    setTourBypassed(true);
    setShowAllFacilities(true);
    window.requestAnimationFrame(() => {
      rootRef.current?.querySelector('[data-facilities-gallery]')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'start' });
      rootRef.current?.querySelector<HTMLElement>('#all-facilities-title')?.focus({ preventScroll: true });
    });
  };

  const returnToTour = (): void => {
    // Keep this safe if a future layout change allows a trigger to survive grid mode.
    const tour = galleryTweenRef.current;
    tour?.scrollTrigger?.kill(true);
    tour?.kill();
    galleryTweenRef.current = null;
    pendingTourReturnRef.current = true;
    setShowAllFacilities(false);
    setTourBypassed(false);
  };

  return (
    <section ref={rootRef} data-office-story className={styles.section} aria-labelledby="office-story-title">
      <div className={styles.intro}>
        <h2 id="office-story-title" tabIndex={-1}>Our Facilities in Action</h2>
        <p className={styles.introDescription}>Take a scroll-driven tour, or skip straight to every facility photo.</p>
        <button className={styles.viewAllButton} type="button" onClick={openAllFacilities} aria-controls="all-facilities-grid" aria-expanded={showAllFacilities}>
          View all facilities <span aria-hidden="true">→</span>
        </button>
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

      <div id="all-facilities-grid" className={`${styles.facilitiesGallery} ${showAllFacilities ? styles.allFacilitiesMode : ''}`} data-facilities-gallery role="region" aria-label="AscendRev facilities photo gallery" tabIndex={-1}>
        {showAllFacilities && <h3 className={styles.galleryTitle} id="all-facilities-title" tabIndex={-1}>All AscendRev facilities</h3>}
        <div className={styles.galleryViewport} data-facilities-viewport>
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
                  <span className={styles.facilityNumber}>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <figcaption>{facility.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        {showAllFacilities && <button className={styles.returnButton} type="button" onClick={returnToTour}>Return to facilities tour</button>}
      </div>
      <span className={styles.srOnly}>Frame-by-frame visual tour, with {stages.length} scenes.</span>
    </section>
  );
}
