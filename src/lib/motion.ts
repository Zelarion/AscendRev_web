/**
 * The motion language, transcribed from DESIGN.md §4 and expressed once so a
 * change to the language is a change to this file, not a grep across every
 * component.
 *
 * This module imports nothing on purpose. Header, Footer and Button are
 * server components that read the CSS-transition tokens at the bottom of the
 * file, so pulling GSAP in here would drag the whole animation library into
 * the server bundle for the sake of two inline style objects. The GSAP
 * registration that pairs with these tokens lives in
 * components/motion/registerMotion.ts, which is a client module.
 *
 * The project also still carries `motion` (v12) from the scaffold pass. The
 * two libraries must not share a component tree: they both want the frame and
 * both want to own the element's transform. Scroll work in this codebase is
 * GSAP + ScrollTrigger, driven by a single `gsap.ticker` that also drives
 * Lenis (see components/motion/SmoothScrollProvider).
 */

// --- Durations ------------------------------------------------------------
// GSAP takes seconds. The CSS custom properties in globals.css carry the same
// values in milliseconds for plain CSS transitions; both are derived from the
// same table in DESIGN.md §4 and must be changed together.
export const DUR_FAST = 0.15; // hover, focus, press
export const DUR_BASE = 0.25; // state change
export const DUR_SLOW = 0.6; // scroll reveal
export const DUR_EXIT = 0.17; // roughly 68% of base; exits are faster than entrances

// --- Reveal geometry ------------------------------------------------------
export const REVEAL_Y = 14; // px, DESIGN.md §4 motion inventory
export const STAGGER_STEP = 0.06; // 60ms cascade
export const STAGGER_MAX_ITEMS = 8; // beyond this, instant rather than a waterfall

/**
 * Where a scroll reveal fires: slightly before the element reaches the very
 * bottom edge of the viewport, which reads as more responsive on a fast
 * scroll. The fraction below is the same number expressed for
 * `isBelowRevealLine`, and the two must stay in step.
 */
export const REVEAL_START = 'top 85%';
const REVEAL_START_FRACTION = 0.85;

// --- Easing ---------------------------------------------------------------
// DESIGN.md specifies exact cubic-beziers. GSAP's named eases are close to
// them but not equal, so CustomEase reproduces the curves exactly and keeps
// the CSS transitions and the GSAP tweens speaking one motion language. The
// names are registered in components/motion/registerMotion.ts.
export const EASE_OUT_QUART = 'ascendrev-out-quart';
export const EASE_OUT_EXPO = 'ascendrev-out-expo';

export const EASE_OUT_QUART_BEZIER = '0.25, 1, 0.5, 1';
export const EASE_OUT_EXPO_BEZIER = '0.16, 1, 0.3, 1';

// --- Reduced motion -------------------------------------------------------

/**
 * DESIGN.md §4 and SPEC.md §9 gate 10: reduced motion is a real alternative,
 * not a blanket `animation: none`. Every primitive in components/motion calls
 * this and returns early rather than animating a shortened version.
 *
 * Read at effect time rather than cached at module scope, so a reader who
 * changes the OS setting gets the new behaviour on their next navigation
 * instead of being stuck with whatever was true when the bundle loaded.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true; // No matchMedia means no way to ask. Fail closed: no motion.
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * True when the element sits far enough below the fold that hiding it now is
 * invisible to the reader.
 *
 * This is what makes DESIGN.md §4's non-negotiable rule hold in practice.
 * Server-rendered HTML ships visible, and a scroll reveal has to start from a
 * hidden state, so a reveal attached to something already on screen would
 * blink it out and back in. Elements already in view are therefore left
 * exactly as the server rendered them and never animate at all.
 *
 * The threshold is REVEAL_START expressed as a number, so an element is
 * skipped precisely when its ScrollTrigger would already have fired.
 */
export function isBelowRevealLine(element: Element): boolean {
  return element.getBoundingClientRect().top > window.innerHeight * REVEAL_START_FRACTION;
}

// --- CSS-transition tokens ------------------------------------------------
// Inline style fragments for components that transition in plain CSS rather
// than through GSAP (hover, focus, press, and the header's border swap).
// Spread directly: `style={hoverTransitionStyle}`. They reference the CSS
// custom properties so the numbers live in exactly one place.

export const hoverTransitionStyle = {
  transitionDuration: 'var(--dur-fast)',
  transitionTimingFunction: 'var(--ease-out-quart)',
} as const;

export const stateTransitionStyle = {
  transitionDuration: 'var(--dur-base)',
  transitionTimingFunction: 'var(--ease-out-quart)',
} as const;

export const exitTransitionStyle = {
  transitionDuration: 'var(--dur-exit)',
  transitionTimingFunction: 'var(--ease-out-quart)',
} as const;
