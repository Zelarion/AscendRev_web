import type { Metadata } from 'next';
import {
  ClosingBand,
  HeroSection,
  IndustriesSection,
  PillarsSection,
  TrustBand,
} from '@/components/sections/home';
import SectionCraftStyles from '@/components/sections/shared/SectionCraftStyles';
import { home } from '@/content/home';

/**
 * Title and description come from `home.meta` rather than being written here,
 * because SPEC.md §2 puts every client-facing string in `src/content/*.ts` and
 * the page title is one. The root layout applies the `%s | AscendRev` template
 * (`src/app/layout.tsx`), which is why the brand name is absent from the title
 * itself.
 */
export const metadata: Metadata = {
  title: home.meta.title,
  description: home.meta.description,
  alternates: {
    canonical: '/',
  },
};

/**
 * The homepage, in the order SPEC.md §4.1 specifies: hero, trust band,
 * pillars, industries, closing band.
 *
 * Every visible string on this page comes from `src/content/home.ts`. Nothing
 * here decides what the page says; it decides only where each piece sits and
 * how it arrives.
 *
 * `SectionCraftStyles` carries the hero's keyframes and the document-level
 * selection and scrollbar treatment. It is mounted here rather than in the
 * root layout because the layout is owned by another pass; see the note in
 * that file about promoting the two document-level blocks into globals.css.
 */
export default function HomePage() {
  return (
    <>
      <SectionCraftStyles />
      <HeroSection content={home.hero} />
      <TrustBand content={home.trustBand} />
      <PillarsSection content={home.pillars} />
      <IndustriesSection content={home.industries} />
      <ClosingBand content={home.closing} />
    </>
  );
}
