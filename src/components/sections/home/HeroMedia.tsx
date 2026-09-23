'use client';

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { PauseIcon, PlayIcon } from '@phosphor-icons/react/dist/ssr';
import { hoverTransitionStyle, prefersReducedMotion } from '@/lib/motion';
import { HERO_PARALLAX_MULTIPLIER } from '@/components/sections/shared/motionTokens';

const POSTER_SRC = '/video/hero-poster.jpg';
const VIDEO_SRC = '/video/Video-Speed-Up.mp4';
const PARALLAX_LAYER_HEIGHT = '126%';

interface HeroMediaProps {
  sideWords: readonly string[];
}

export default function HeroMedia({ sideWords }: HeroMediaProps): JSX.Element {
  const frameRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoMounted, setVideoMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

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
      const offset = (scrolled * HERO_PARALLAX_MULTIPLIER).toFixed(2);
      layer.style.transform = `translate3d(0, ${offset}px, 0)`;
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

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, []);

  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden">
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
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={POSTER_SRC}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-[var(--navy-900)]/28" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,14,28,0.95)_0%,rgba(4,18,35,0.82)_34%,rgba(5,21,40,0.46)_61%,rgba(5,18,34,0.24)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,14,28,0.9)_0%,rgba(3,14,28,0.46)_20%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_66%_44%,transparent_0%,rgba(2,12,25,0.08)_45%,rgba(2,12,25,0.34)_100%)]" />

      {videoMounted && (
        <>
          <div className="ar-fade-rise absolute right-[clamp(2rem,7vw,8rem)] top-[63%] z-10 hidden -translate-y-1/2 flex-col gap-1 text-[10px] font-medium tracking-[0.24em] text-white/52 xl:flex">
            {sideWords.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </div>

          <button
            type="button"
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
            style={hoverTransitionStyle}
            className="absolute bottom-6 right-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[rgba(4,16,31,0.5)] text-white/78 outline-none backdrop-blur-md transition-colors hover:border-white/30 hover:bg-[rgba(4,16,31,0.8)] xl:bottom-[8.75rem] xl:right-[3.25rem]"
          >
            {isPlaying ? (
              <PauseIcon size={18} weight="regular" aria-hidden="true" />
            ) : (
              <PlayIcon size={18} weight="regular" aria-hidden="true" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
