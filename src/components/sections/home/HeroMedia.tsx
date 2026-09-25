'use client';

import { useEffect, useRef, useState, type JSX } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { HERO_PARALLAX_MULTIPLIER } from '@/components/sections/shared/motionTokens';

const POSTER_SRC = '/video/hero-poster.jpg';
const MOBILE_VIDEO_SRC = '/video/hero-1280.mp4';
const DESKTOP_VIDEO_SRC = '/video/hero-1920.mp4';
const PARALLAX_LAYER_HEIGHT = '126%';

interface HeroMediaProps {
  sideWords: readonly string[];
}

export default function HeroMedia({ sideWords }: HeroMediaProps): JSX.Element {
  const frameRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoMounted, setVideoMounted] = useState(false);
  const [videoSrc, setVideoSrc] = useState(MOBILE_VIDEO_SRC);

  useEffect(() => {
    const updateVideoSource = () => {
      setVideoSrc(window.matchMedia('(min-width: 1280px)').matches ? DESKTOP_VIDEO_SRC : MOBILE_VIDEO_SRC);
    };

    updateVideoSource();
    window.addEventListener('resize', updateVideoSource, { passive: true });
    return () => window.removeEventListener('resize', updateVideoSource);
  }, []);

  useEffect(() => {
    if (!prefersReducedMotion()) setVideoMounted(true);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const layer = parallaxRef.current;
    if (!frame || !layer || prefersReducedMotion()) return;

    let onScreen = false;
    let frameQueued = false;

    const update = () => {
      frameQueued = false;
      const scrolled = Math.max(0, -frame.getBoundingClientRect().top);
      // Keep the enlarged footage inside the hero while it moves at a slower
      // rate than the page. Clamping to its overscan prevents empty edges.
      const travel = Math.max(0, layer.offsetHeight - frame.clientHeight);
      const offset = Math.min(scrolled * HERO_PARALLAX_MULTIPLIER, travel).toFixed(2);
      layer.style.transform = `translate3d(0, -${offset}px, 0)`;
    };

    const onScroll = () => {
      if (!onScreen || frameQueued) return;
      frameQueued = true;
      window.requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      if (onScreen) update();
    });

    observer.observe(frame);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      layer.style.removeProperty('transform');
    };
  }, []);

  return (
    <figure
      ref={frameRef}
      aria-label="Salcedo Street, Makati City at night"
      className="pointer-events-none absolute inset-0 z-0 m-0 h-full w-full overflow-hidden bg-[#061329]"
    >
      <div
        ref={parallaxRef}
        aria-hidden="true"
        className="absolute inset-x-0 top-0 will-change-transform"
        style={{ height: PARALLAX_LAYER_HEIGHT }}
      >
        <div
          className="ar-media-settle relative h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${POSTER_SRC})` }}
        >
          {videoMounted && (
            <video
              id="hero-background-video"
              ref={videoRef}
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={POSTER_SRC}
              src={videoSrc}
            />
          )}
        </div>
      </div>

      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,16,35,0.90)_0%,rgba(4,20,42,0.74)_38%,rgba(4,20,42,0.28)_72%,rgba(4,20,42,0.12)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(4,16,35,0.58)_0%,rgba(4,16,35,0.08)_42%,rgba(4,16,35,0.22)_100%)]" />

      <div className="absolute bottom-5 left-[clamp(1.25rem,5vw,5.5rem)] z-[1] flex flex-col gap-1 text-[9px] font-medium tracking-[0.2em] text-white/70 sm:bottom-7 sm:text-[10px]">
        {sideWords.map((word) => (
          <span key={word}>{word}</span>
        ))}
      </div>

      <figcaption className="sr-only">Salcedo Street, Makati City · Night view from Ayala</figcaption>

    </figure>
  );
}
