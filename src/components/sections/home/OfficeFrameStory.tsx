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
    eyebrow: 'Boardroom · Direction',
    detail: 'A focused conversation turns the operating challenge into a practical brief.',
    place: 'Boardroom',
    tag: '01 / ALIGN',
    accent: 'green',
  },
  {
    eyebrow: 'Hallway · Connection',
    detail: 'The right roles connect the plan to the daily work that moves it forward.',
    place: 'Office hallway',
    tag: '02 / BUILD',
    accent: 'blue',
  },
  {
    eyebrow: 'Workspace · Momentum',
    detail: 'A prepared team gives your business more room to deliver and grow.',
    place: 'Furnished workspace',
    tag: '03 / GROW',
    accent: 'gold',
  },
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
 * Scroll-scrubbed, static-host friendly visual story. Its actual poster and all
 * three chapter descriptions remain in the HTML; canvas playback enhances the
 * experience only when motion is available and the visitor permits it.
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
      const sceneMarkers = gsap.utils.toArray<HTMLElement>('[data-office-marker]', root);
      const progress = root.querySelector<HTMLElement>('[data-office-progress]');
      const orbit = root.querySelector<HTMLElement>('[data-office-orbit]');
      const callout = root.querySelector<HTMLElement>('[data-office-callout]');

      gsap.set(sceneCards, { autoAlpha: 0, y: 22, clipPath: 'inset(0 0 24% 0)' });
      gsap.set(sceneMarkers, { opacity: 0.4, scale: 0.86, transformOrigin: 'center' });
      gsap.set(sceneCards[0], { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0)' });
      gsap.set(sceneMarkers[0], { opacity: 1, scale: 1 });

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
      if (orbit) timeline.to(orbit, { rotation: 280, scale: 1.1, duration: 3 }, 0);
      if (callout) timeline.to(callout, { y: -24, duration: 3 }, 0);

      sceneCards.forEach((card, index) => {
        const start = index;
        const marker = sceneMarkers[index];
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
          if (marker) {
            timeline.to(sceneMarkers[index - 1], { opacity: 0.4, scale: 0.86, duration: 0.12 }, start - 0.06);
            timeline.to(marker, { opacity: 1, scale: 1, duration: 0.12 }, start);
          }
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

  return (
    <section ref={rootRef} data-office-story className={styles.section} aria-labelledby="office-story-title">
      <div className={styles.intro}>
        <p className={styles.kicker}>A dedicated team, built around your work</p>
        <h2 id="office-story-title">People, process, and a place to move forward.</h2>
        <p className={styles.introDetail}>
          See the path from a clear brief to a team ready to deliver.
        </p>
      </div>

      <div data-office-runway className={styles.runway}>
        <div className={styles.stage}>
          <div className={styles.posterFrame}>
            <Image
              src={frameUrl(0)}
              alt="AscendRev's boardroom, the first scene in a three-part view of its office."
              fill
              priority={false}
              sizes="100vw"
              className={styles.poster}
            />
          </div>
          <canvas ref={canvasRef} aria-hidden="true" className={`${styles.canvas} ${framesReady ? styles.canvasReady : ''}`} />
          <div aria-hidden="true" className={styles.scrim} />

          <div className={styles.topline}>
            <span className={styles.brandMark}>ASCENDREV <i>·</i> OFFICE</span>
            <span className={styles.liveNote}>{framesReady ? 'SCROLL TO EXPLORE' : 'OFFICE STORY'}</span>
          </div>

          <div className={styles.copyRail}>
            <div className={styles.sceneCopy} data-office-scene data-accent={SCENES[0].accent}>
              <p className={styles.sceneEyebrow}>{SCENES[0].eyebrow}</p>
              <h3>{stages[0]}</h3>
              <p className={styles.sceneDetail}>{SCENES[0].detail}</p>
            </div>
            <div className={styles.sceneCopy} data-office-scene data-accent={SCENES[1].accent}>
              <p className={styles.sceneEyebrow}>{SCENES[1].eyebrow}</p>
              <h3>{stages[1]}</h3>
              <p className={styles.sceneDetail}>{SCENES[1].detail}</p>
            </div>
            <div className={styles.sceneCopy} data-office-scene data-accent={SCENES[2].accent}>
              <p className={styles.sceneEyebrow}>{SCENES[2].eyebrow}</p>
              <h3>{stages[2]}</h3>
              <p className={styles.sceneDetail}>{SCENES[2].detail}</p>
            </div>
          </div>

          <div className={styles.sceneIndex} aria-label="Story scenes">
            {SCENES.map((scene, index) => (
              <div key={scene.tag} className={styles.sceneIndexItem}>
                <span className={styles.sceneMarker} data-office-marker aria-hidden="true">0{index + 1}</span>
                <span className={styles.sceneName}>{scene.place}</span>
              </div>
            ))}
          </div>

          <div data-office-callout className={styles.callout} aria-hidden="true">
            <span className={styles.calloutOrbit} data-office-orbit>
              <span className={styles.orbitDot} />
              <span className={styles.orbitDotSecondary} />
            </span>
            <span className={styles.calloutText}>A practical plan.<br />A team built to deliver.</span>
          </div>

          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} data-office-progress />
          </div>
        </div>
      </div>

      <div className={styles.chapters}>
        {SCENES.map((scene, index) => (
          <article key={scene.tag} className={styles.chapter}>
            <span className={styles.chapterNumber}>0{index + 1}</span>
            <div>
              <h3>{stages[index]}</h3>
              <p>{scene.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
