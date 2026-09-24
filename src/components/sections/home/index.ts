/**
 * The homepage's sections, in the order SPEC.md §4.1 puts them on the page.
 * `src/app/page.tsx` imports from here rather than from the individual files,
 * so the page reads as a list of sections and nothing else.
 */

export { default as HeroSection } from './HeroSection';
export { default as TrustBand } from './TrustBand';
export { default as PillarsSection } from './PillarsSection';
export { default as IndustriesSection } from './IndustriesSection';
export { default as ClosingBand } from './ClosingBand';
export { default as CareerStatsSection } from './CareerStatsSection';
