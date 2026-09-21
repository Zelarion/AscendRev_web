import type { Metadata } from 'next';
import HiringStandard from '@/components/sections/solutions/HiringStandard';
import ServiceGrid from '@/components/sections/solutions/ServiceGrid';
import SolutionsClosing from '@/components/sections/solutions/SolutionsClosing';
import SolutionsHero from '@/components/sections/solutions/SolutionsHero';
import { solutions } from '@/content/solutions';

/**
 * `/solutions`, section order per SPEC.md §4.2: compact navy hero, the
 * eight-function grid, the hiring standard, closing band.
 *
 * Title and description come from `solutions.meta` rather than being written
 * again here, so the page's copy has exactly one source. The title is rendered
 * through the root layout's `%s | AscendRev` template.
 */
export const metadata: Metadata = {
  title: solutions.meta.title,
  description: solutions.meta.description,
  alternates: {
    canonical: '/solutions/',
  },
};

export default function SolutionsPage() {
  return (
    <>
      <SolutionsHero />
      <ServiceGrid />
      <HiringStandard />
      <SolutionsClosing />
    </>
  );
}
