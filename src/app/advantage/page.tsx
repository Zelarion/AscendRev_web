import AdvantageHero from '@/components/sections/advantage/AdvantageHero';
import InfrastructureBlock from '@/components/sections/advantage/InfrastructureBlock';
import LeadershipBlock from '@/components/sections/advantage/LeadershipBlock';
import { advantage } from '@/content/advantage';
import { createSeoMetadata } from '@/lib/seoMetadata';

/**
 * `/advantage`, section order per SPEC.md §4.3: compact navy hero, leadership
 * at `#leadership`, infrastructure, closing band.
 *
 * Title and description come from `advantage.meta`, so the page's copy has one
 * source. The title is rendered through the root layout's `%s | AscendRev`
 * template.
 */
export const metadata = createSeoMetadata({
  title: advantage.meta.title,
  description: advantage.meta.description,
  canonicalPath: '/advantage/',
});

export default function AdvantagePage() {
  return (
    <>
      <AdvantageHero />
      <LeadershipBlock />
      <InfrastructureBlock />
    </>
  );
}
