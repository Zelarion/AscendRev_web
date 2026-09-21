/**
 * Section-level building blocks shared across pages.
 *
 * Everything here is page-agnostic on purpose: the Solutions and Advantage
 * pages need the same scroll entrance, the same three easing curves and the
 * same document-level craft styles as the homepage, and duplicating any of
 * them is how a motion language drifts apart one page at a time.
 */

export { default as RevealOnScroll } from './RevealOnScroll';
export { default as SectionCraftStyles } from './SectionCraftStyles';
export * from './motionTokens';
