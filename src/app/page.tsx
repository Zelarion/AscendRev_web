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
import PageJsonLd from '@/components/seo/PageJsonLd';
import { createSeoMetadata, type SeoMetadataInput } from '@/lib/seoMetadata';

const seo: SeoMetadataInput = {
  title: home.meta.title,
  description: home.meta.description,
  canonicalPath: '/',
  titleIncludesBrand: true,
};

export const metadata = createSeoMetadata(seo);

export default function HomePage() {
  return (
    <>
      <PageJsonLd {...seo} />
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
