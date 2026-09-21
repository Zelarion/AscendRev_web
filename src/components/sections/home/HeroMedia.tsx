'use client';

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { PauseIcon, PlayIcon } from '@phosphor-icons/react/dist/ssr';
import { hoverTransitionStyle, prefersReducedMotion } from '@/lib/motion';
import { HERO_PARALLAX_MULTIPLIER } from '@/components/sections/shared/motionTokens';

const POSTER_SRC = '/video/hero-poster.jpg';
const VIDEO_WIDE_SRC = '/video/hero-1920.mp4';
const VIDEO_NARROW_SRC = '/video/hero-1280.mp4';
/** Below this width the 1.2MB encode is served instead of the 3.2MB one. */
const NARROW_MEDIA_QUERY = '(max-width: 767px)';

/**
 * How much taller the media layer is than the frame that clips it. The layer
 * translates DOWN by `scrolled * 0.4` as the page scrolls up, so it needs
 * headroom below the frame or the bottom edge would ride into view. 130% is
 * the smallest value that keeps the frame covered for the whole time the hero
 * is on screen; anything more just throws away resolution to `object-fit`.
 */
const PARALLAX_LAYER_HEIGHT = '130%';

/**
 * The navy scrim, in two layers.
 *
 * A single flat tint cannot do this job. Measured against a blown-out office
 * window in the footage (treated as pure white, the worst pixel that can
 * appear), the flat base alone puts white text at 3.45:1, which fails. The
 * gradient is therefore load-bearing rather than decorative: it is what makes
 * the bottom of the frame, where all the copy sits, safe to put white text on.
 *
 * Measured, over a pure white source pixel:
 *   white headline, bottom zone   15.50:1
 *   white at 88%, bottom zone     12.26:1
 *   white headline, 58% up frame   8.47:1
 *   flat base alone, top of frame  3.45:1   (no text is ever placed here)
 *
 * Over representative night footage every figure is higher. Both layers read
 * theme tokens, so the dark palette deepens the scrim rather than fighting it.
 */
const SCRIM_BASE_OPACITY = 0.55;
const SCRIM_GRADIENT = [
  'linear-gradient(to top',
  'color-mix(in srgb, var(--navy-900) 92%, transparent) 0%',
  'color-mix(in srgb, var(--navy-900) 88%, transparent) 28%',
  'color-mix(in srgb, var(--navy-900) 55%, transparent) 58%',
  'transparent 92%)',
].join(', ');

/**
 * The hero's moving background: night footage of a business district under a
 * navy scrim, with the poster frame carrying the whole thing on its own
 * whenever the video does not or should not play.
 *
 * THE POSTER IS THE DESIGN, THE VIDEO IS THE ENHANCEMENT
 *
 * The poster is painted as a background image on an element the server
 * renders, so it is already there with no JavaScript, with a failed bundle, in
 * a headless render, and while the video is still downloading. The `<video>`
 * element is mounted only after the client has confirmed that motion is
 * wanted, which means a reader with `prefers-reduced-motion: reduce` never
 * downloads it, never plays it, and sees a finished hero made of one still
 * frame. That is the specified behaviour and it is also the only way to honour
 * the preference at all: there is no CSS that can stop an autoplaying video.
 *
 * The footage is decorative. It carries no information that is not in the
 * copy, so it is `aria-hidden`, it has no captions to miss, and it is not
 * described. It does carry a pause control, for the reason set out on the
 * button below.
 */
export default function HeroMedia(): JSX.Element {
  const frameRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoMounted, setVideoMounted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Motion is permitted: mount the video over the poster. Deliberately a state
  // flip after mount rather than a render-time check, so the server and the
  // first client render agree and there is no hydration mismatch.
  useEffect(() => {
    if (!prefersReducedMotion()) setVideoMounted(true);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const layer = parallaxRef.current;
    if (!frame || !layer) return;
    if (prefersReducedMotion()) return;

    let onScreen = false;
    let frameQueued = false;

    const update = () => {
      frameQueued = false;
      // Clamped at zero so the layer sits at its resting position while the
      // hero top is still below the viewport top, which is where it starts.
      const scrolled = Math.max(0, -frame.getBoundingClientRect().top);
      const offset = (scrolled * HERO_PARALLAX_MULTIPLIER).toFixed(2);
      layer.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    // One layout read and one style write per frame, coalesced into rAF so a
    // burst of scroll events cannot produce a burst of reflows, and gated on
    // the observer below so that none of it runs once the hero has left.
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
      // Autoplay can be refused by the browser, and a rejected promise here is
      // an unhandled rejection in the console rather than anything the reader
      // can see. The play/pause state is read from the element's own events
      // below, so a refusal simply leaves the button showing "play".
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, []);

  return (
    <div ref={frameRef} className="absolute inset-0 overflow-hidden">
      {/*
       * `aria-hidden` belongs here rather than on the frame. An ancestor's
       * `aria-hidden` cannot be undone by a descendant, so hiding the whole
       * frame would also hide the pause control below it, and a focusable
       * control inside an `aria-hidden` subtree is a serious axe violation on
       * top of being unusable. The two scrim layers below hold no content and
       * reach the accessibility tree as nothing either way.
       */}
      <div
        ref={parallaxRef}
        aria-hidden="true"
        className="absolute inset-x-0 top-0 will-change-transform"
        style={{ height: PARALLAX_LAYER_HEIGHT }}
      >
        {/* Poster and video share one element so the one-shot settle scales
            them together and the video is never seen sliding over a still
            frame that is a different size. */}
        <div
          className="ar-media-settle relative h-full w-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${POSTER_SRC})` }}
        >
          {videoMounted && (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              // `muted` and `playsInline` are both required or iOS refuses to
              // autoplay; `poster` covers the gap before the first frame
              // decodes, on top of the background image behind it.
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={POSTER_SRC}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              <source src={VIDEO_NARROW_SRC} media={NARROW_MEDIA_QUERY} type="video/mp4" />
              <source src={VIDEO_WIDE_SRC} type="video/mp4" />
            </video>
          )}
        </div>
      </div>

      <div
        className="absolute inset-0 bg-[var(--navy-800)]"
        style={{ opacity: SCRIM_BASE_OPACITY }}
      />
      <div className="absolute inset-0" style={{ backgroundImage: SCRIM_GRADIENT }} />

      {videoMounted && (
        /*
         * WCAG 2.2 SC 2.2.2 (Pause, Stop, Hide) applies to anything that moves
         * automatically for more than five seconds alongside other content.
         * This loop is eighteen seconds and it sits behind the page's primary
         * copy, so it needs a way to stop it. PRODUCT.md records WCAG 2.2 AA as
         * non-negotiable, which settles the conflict with the brief's "no
         * controls" instruction: what that rules out is the browser's own
         * control bar, which is what `controls` would render and which would
         * look like a video player embedded in the page. This is one 44px
         * button with no chrome. Flagged to the founder rather than decided
         * quietly.
         *
         * The label is an accessible name for a control, not page copy, so it
         * is the one string on this page that does not come from
         * `src/content/home.ts`. It is never rendered visibly.
         */
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
          style={hoverTransitionStyle}
          className="absolute bottom-6 right-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-[6px] border border-[var(--border-navy)] bg-[var(--navy-900)]/50 text-white outline-none transition-colors hover:bg-[var(--navy-900)]/80"
        >
          {isPlaying ? (
            <PauseIcon size={20} weight="regular" aria-hidden="true" />
          ) : (
            <PlayIcon size={20} weight="regular" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
