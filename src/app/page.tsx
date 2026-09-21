import type { Metadata } from 'next';
import { ClosingBand, HeroSection, IndustriesSection, PillarsSection } from '@/components/sections/home';
import SectionCraftStyles from '@/components/sections/shared/SectionCraftStyles';
import { home } from '@/content/home';

export const metadata: Metadata = {
  title: home.meta.title,
  description: home.meta.description,
  alternates: {
    canonical: '/',
  },
};

/**
 * Landing-page build is intentionally staged. The approved direction is being
 * implemented from the top down, so this branch currently renders only the
 * navigation and hero. The remaining homepage sections will be added after the
 * top-of-page composition is signed off.
 */
export default function HomePage() {
  return (
    <>
      <SectionCraftStyles />
      <HeroSection content={home.hero} />
      <PillarsSection content={home.pillars} />
      <IndustriesSection content={home.industries} />
      <ClosingBand content={home.closing} />
    </>
  );
}
