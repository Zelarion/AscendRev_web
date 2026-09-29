import {
  CareerStatsSection,
  ClosingBand,
  HeroSection,
  PillarsSection,
} from '@/components/sections/home';
import OfficeFrameStory from '@/components/sections/home/OfficeFrameStory';
import OperatingModelSection from '@/components/sections/home/OperatingModelSection';
import SectionCraftStyles from '@/components/sections/shared/SectionCraftStyles';
import { home } from '@/content/home';
import { createSeoMetadata } from '@/lib/seoMetadata';

export const metadata = createSeoMetadata({
  title: home.meta.title,
  description: home.meta.description,
  canonicalPath: '/',
});

export default function HomePage() {
  return (
    <>
      <SectionCraftStyles />
      <HeroSection content={home.hero} />
      <OfficeFrameStory />
      <PillarsSection content={home.pillars} />
      <OperatingModelSection />
      <CareerStatsSection />
      <ClosingBand content={home.closing} />
    </>
  );
}
