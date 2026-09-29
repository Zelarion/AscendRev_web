import HiringStandard from '@/components/sections/solutions/HiringStandard';
import Screening from '@/components/sections/solutions/Screening';
import SolutionsClosing from '@/components/sections/solutions/SolutionsClosing';
import IndustriesSection from '@/components/sections/home/IndustriesSection';
import { home } from '@/content/home';
import { solutions } from '@/content/solutions';
import { createSeoMetadata } from '@/lib/seoMetadata';

/**
 * `/solutions`: Revenue Impact leads, followed by team standards, screening,
 * and the closing call to action.
 *
 * Title and description come from `solutions.meta` rather than being written
 * again here, so the page's copy has exactly one source. The title is rendered
 * through the root layout's `%s | AscendRev` template.
 */
export const metadata = createSeoMetadata({
  title: solutions.meta.title,
  description: solutions.meta.description,
  canonicalPath: '/solutions/',
});

export default function SolutionsPage() {
  return (
    <>
      <IndustriesSection content={home.revenueImpact} />
      <HiringStandard />
      <Screening />
      <SolutionsClosing />
    </>
  );
}
