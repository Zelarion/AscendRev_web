import type { JSX } from 'react';
import {
  EASE_DRAMA,
  EASE_REVEAL,
  HERO_LINE_DURATION_MS,
  HERO_MEDIA_SETTLE_MS,
  HERO_MEDIA_SETTLE_SCALE,
  HERO_SUPPORT_DURATION_MS,
} from '@/components/sections/shared/motionTokens';

/**
 * The few rules the sections need that cannot be written as utility classes:
 * three keyframe sets, and two document-level treatments (text selection and
 * the scrollbar).
 *
 * WHERE THIS BELONGS, EVENTUALLY
 *
 * `::selection` and `::-webkit-scrollbar` are document-wide and should live in
 * `src/app/globals.css` so they apply on every route. That file is owned by
 * another pass, so they are declared here and mounted from the homepage
 * instead. Promoting these two blocks into globals.css and deleting them from
 * this file is a clean, behaviour-preserving follow-up; the keyframes below
 * can move with them or stay here.
 *
 * `href` plus `precedence` is React 19's documented mechanism for a stylesheet
 * rendered from a component: React hoists it into `<head>` and renders it once
 * however many times the component appears. If the hoist ever stops happening
 * the rules still apply, because a `<style>` element styles the whole document
 * wherever it sits.
 *
 * WHY THE HERO ENTRANCE IS A CSS ANIMATION AND NOT A SCRIPT
 *
 * The hero is the one animation on this page that is above the fold at load,
 * which rules out the reveal pattern used everywhere else: server-render
 * visible, hide after mount, then animate. Doing that here would paint the
 * headline in place and then yank it back down as the bundle hydrates. A CSS
 * animation is applied before the first paint instead, so the reader's first
 * frame already shows the entrance, it needs no JavaScript at all, and
 * `prefers-reduced-motion` switches it off in the same place it is defined.
 */
const CSS = `
:root {
  --ar-ease-reveal: ${EASE_REVEAL};
  --ar-ease-drama: ${EASE_DRAMA};
}

/* ---- Hero entrance ------------------------------------------------------
 * Each headline line sits in an overflow-hidden wrapper and rises from fully
 * below it, so the line is uncovered rather than faded in. The mask reveal is
 * used on the hero headline and nowhere else: repeated down a page it stops
 * reading as an entrance and starts reading as a transition effect.
 *
 * The "backwards" fill mode is what holds each element in its start state
 * during its own delay. Without it the whole hero would paint in place first
 * and then jump back to the start of its animation.
 *
 * Note for anyone editing this string: it is a JavaScript template literal, so
 * a backtick anywhere in here silently ends it and the file stops parsing.
 * Use quotes. */
@keyframes ar-line-rise {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

@keyframes ar-fade-rise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* The footage settles out of a slight push-in as the headline arrives, so the
 * frame and the type resolve as one movement rather than two. */
@keyframes ar-media-settle {
  from { transform: scale(${HERO_MEDIA_SETTLE_SCALE}); }
  to   { transform: scale(1); }
}

@keyframes ar-nav-enter {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes ar-watch-enter {
  from { opacity: 0; transform: translateY(-50%) translateX(18px); }
  to   { opacity: 1; transform: translateY(-50%) translateX(0); }
}

@keyframes ar-watch-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(223, 184, 79, 0.12); }
  50% { box-shadow: 0 0 0 11px rgba(223, 184, 79, 0); }
}

.ar-line-rise {
  animation: ar-line-rise ${HERO_LINE_DURATION_MS}ms var(--ar-ease-drama) backwards;
}

.ar-fade-rise {
  animation: ar-fade-rise ${HERO_SUPPORT_DURATION_MS}ms var(--ar-ease-reveal) backwards;
}

.ar-media-settle {
  animation: ar-media-settle ${HERO_MEDIA_SETTLE_MS}ms var(--ar-ease-reveal) backwards;
}

.ar-nav-shell {
  animation: ar-fade-rise 700ms var(--ar-ease-reveal) 40ms backwards;
}

.ar-nav-item {
  animation: ar-nav-enter 620ms var(--ar-ease-reveal) backwards;
}

.ar-watch-entrance {
  animation: ar-watch-enter 900ms var(--ar-ease-reveal) 1250ms backwards;
}

.ar-watch-pulse {
  animation: ar-watch-pulse 2600ms ease-in-out 2200ms infinite;
}

/* ---- Text selection -----------------------------------------------------
 * Both values are tokens, so the pair inverts correctly with the palette:
 * dark steel behind near-white text on the light theme, light steel behind
 * near-black on the dark one. Measured 6.37:1 and 7.77:1. */
::selection {
  background-color: var(--link);
  color: var(--surface-page);
}

/* ---- Scrollbar ----------------------------------------------------------
 * The two standard properties cover Firefox; the pseudo-elements cover WebKit
 * and Blink. The thumb is the brand steel rather than a grey, which is the
 * entire reason to style it at all. */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--link) transparent;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: var(--link);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-primary);
}

/* ---- Reduced motion -----------------------------------------------------
 * DESIGN.md section 4 wants a real alternative rather than a fast version of
 * the animation. Dropping the animation entirely resets the name, the delay
 * and the fill mode together, so each element renders exactly where the markup
 * already put it: the headline is in place, the footage is unscaled, and
 * nothing waits its turn.
 *
 * This restates rather than relies on the blanket rule in globals.css, which
 * collapses animation-duration but leaves animation-delay alone. Under that
 * rule alone the CTA would still sit invisible for 1.3 seconds and then
 * appear, which is worse than either the animation or no animation at all. */
@media (prefers-reduced-motion: reduce) {
  .ar-line-rise,
  .ar-fade-rise,
  .ar-media-settle,
  .ar-nav-shell,
  .ar-nav-item,
  .ar-watch-entrance,
  .ar-watch-pulse {
    animation: none !important;
  }
}
`;

export default function SectionCraftStyles(): JSX.Element {
  return (
    <style href="ascendrev-sections" precedence="default">
      {CSS}
    </style>
  );
}
