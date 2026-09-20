import type { Transition, Variants } from 'motion/react';

/**
 * Motion tokens, transcribed verbatim from DESIGN.md §4. Components must
 * import these rather than hardcoding a duration or a cubic-bezier — the
 * whole point of the token table is that a motion-language change is one
 * file, not a grep-and-replace across every component.
 */

// --- Easing -----------------------------------------------------------
// Exported both as arrays (what `motion`'s `transition.ease` expects) and
// as CSS var-reference strings (for inline `style` on elements animated via
// plain CSS transitions, e.g. Header's background/border swap).
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// --- Durations ----------------------------------------------------------
// In seconds, for `motion` components (which take `transition.duration` in
// seconds, not ms).
export const DUR_FAST = 0.15; // hover, focus, press
export const DUR_BASE = 0.25; // state change
export const DUR_SLOW = 0.6; // scroll reveal
export const DUR_EXIT = 0.17; // ~68% of base — exits are faster than entrances

// --- Stagger --------------------------------------------------------------
export const STAGGER_STEP = 0.06; // 60ms cascade
export const STAGGER_MAX_ITEMS = 8; // capped, then instant

/**
 * Inline `style` fragments for plain-CSS (non-`motion`) transitions, so
 * hover/press/state-change durations stay pinned to the same tokens as the
 * `motion`-driven animations instead of drifting to Tailwind's defaults.
 * Spread these directly: `style={hoverTransitionStyle}`.
 */
export const hoverTransitionStyle = {
  transitionDuration: 'var(--dur-fast)',
  transitionTimingFunction: 'var(--ease-out-quart)',
} as const;

export const stateTransitionStyle = {
  transitionDuration: 'var(--dur-base)',
  transitionTimingFunction: 'var(--ease-out-quart)',
} as const;

// --- Shared `motion` variants --------------------------------------------
// Intentionally hold no `transition` themselves (see revealTransition
// below) — a variant is a target state, the transition is how you get
// there, and mixing them makes the per-caller `delay` override unreliable.

/** translateY(14px) + opacity 0 -> 1. The single scroll-reveal shape used
 * everywhere per DESIGN.md §4's motion inventory. */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export const revealTransition: Transition = {
  duration: DUR_SLOW,
  ease: EASE_OUT_EXPO,
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER_STEP },
  },
};

export const staggerItemVariants: Variants = revealVariants;
