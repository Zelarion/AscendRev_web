import type { Metadata } from 'next';
import {
  CareerStatsSection,
  ClosingBand,
  HeroSection,
  IndustriesSection,
  PillarsSection,
} from '@/components/sections/home';
import OfficeFrameStory from '@/components/sections/home/OfficeFrameStory';
import SectionCraftStyles from '@/components/sections/shared/SectionCraftStyles';
import { home } from '@/content/home';

export const metadata: Metadata = {
  title: home.meta.title,
  description: home.meta.description,
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      <SectionCraftStyles />
      <HeroSection content={home.hero} />
      <OfficeFrameStory />
      <PillarsSection content={home.pillars} />
      <IndustriesSection content={home.industries} />
      <CareerStatsSection />
      <ClosingBand content={home.closing} />
    </>
  );
}
