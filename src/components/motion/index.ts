/**
 * The motion layer's public surface.
 *
 * Sections import from here rather than reaching into individual files, so the
 * set of primitives a page is allowed to use is visible in one place and a new
 * one-off animation has to be added deliberately rather than appearing inline
 * in a section.
 *
 * `registerMotion` is intentionally not re-exported. It is an internal detail
 * of these primitives, and a section that needs it is writing its own
 * animation instead of composing one of these.
 */

export { default as SmoothScrollProvider } from './SmoothScrollProvider';
export { default as ThemeScript } from './ThemeScript';
export { default as SplitReveal } from './SplitReveal';
export { default as WordReveal } from './WordReveal';
export { default as ScrubScene } from './ScrubScene';
export { default as CountUp } from './CountUp';
export type { ScrubLayer } from './ScrubScene';
