/**
 * The section-level motion language, expressed once.
 *
 * WHY THIS FILE EXISTS ALONGSIDE `src/lib/motion.ts`
 *
 * `src/lib/motion.ts` transcribes DESIGN.md §4, which specifies a 14px rise
 * over 600ms on `ease-out-expo`, and it is consumed by the shared `Reveal` and
 * `Stagger` primitives. The section build brief specifies a different, larger
 * entrance: a 48px rise over 700ms on a three-curve system, staggered 80ms.
 *
 * The two are not reconcilable by picking one at a call site, so this file
 * carries the section language and `src/lib/motion.ts` keeps carrying the
 * primitive language. Both are used, and which one applies is decided by which
 * component is doing the revealing. This divergence is deliberate but it is
 * NOT resolved: it is flagged for the founder to settle, and whichever value
 * wins should end up in exactly one of these two files, not both.
 *
 * Nothing here imports GSAP. Every animation these tokens drive is a plain CSS
 * transition or keyframe, so the sections add no JavaScript animation library
 * of their own on top of the GSAP and Lenis layer already mounted in the root
 * layout.
 */

// --- The three curves -----------------------------------------------------
// Every animation in `src/components/sections/**` names one of these three and
// no others. A fourth curve is how a motion language stops meaning anything.

/** Hovers, buttons, small state changes. The tab underline travels on this. */
export const EASE_UI = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** Scroll entrances. Everything that arrives as the reader scrolls to it. */
export const EASE_REVEAL = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * The hero, and only the hero. A curve this slow to start and this hard to
 * land reads as staged; used twice on a page it reads as sluggish.
 */
export const EASE_DRAMA = 'cubic-bezier(0.77, 0, 0.175, 1)';

// --- Scroll reveal --------------------------------------------------------

/**
 * How far a revealing element travels. Larger than this reads as jumpy on a
 * fast scroll, smaller reads as a rendering fault rather than an entrance.
 */
export const REVEAL_DISTANCE_PX = 48;
export const REVEAL_DURATION_MS = 700;
/** Gap between sibling entrances when a group reveals as a cascade. */
export const REVEAL_STAGGER_MS = 80;

/**
 * Where a reveal fires, as a fraction of viewport height from the top. Matches
 * `REVEAL_START` / `isBelowRevealLine` in `src/lib/motion.ts` so an element is
 * hidden for its entrance precisely when it is still far enough below the fold
 * that hiding it cannot be seen.
 */
export const REVEAL_LINE_FRACTION = 0.85;

// --- Hero choreography ----------------------------------------------------
// Read by `HeroSection` to place each element on the timeline, and by the
// keyframes in `SectionCraftStyles`.

/** One masked headline line rising from `translateY(100%)`. */
export const HERO_LINE_DURATION_MS = 1500;
/** Gap between consecutive headline lines. */
export const HERO_LINE_STAGGER_MS = 500;
/**
 * The supporting paragraph starts while the second headline line is still
 * moving, so the block reads as one entrance rather than as a queue.
 */
export const HERO_SUPPORT_DELAY_MS = 500;
/**
 * The long wait before the buttons is the point. The eye finishes the headline
 * before anything asks for a click; a CTA that arrives with the headline is
 * competing with it.
 */
export const HERO_CTA_DELAY_MS = 1300;
/** Fade-and-rise used by the supporting line and the CTA row. */
export const HERO_SUPPORT_DURATION_MS = 900;

/** One-shot settle on the hero footage, paired with the headline entrance. */
export const HERO_MEDIA_SETTLE_MS = 1200;
export const HERO_MEDIA_SETTLE_SCALE = 1.12;

/**
 * Parallax multiplier for the hero footage. The media moves at 40% of scroll
 * speed, so it lags the copy without ever detaching from it.
 */
export const HERO_PARALLAX_MULTIPLIER = 0.4;
