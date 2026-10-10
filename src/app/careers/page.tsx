import ApplySection from '@/components/sections/careers/ApplySection';
import CareersFaq from '@/components/sections/careers/CareersFaq';
import CareersHero from '@/components/sections/careers/CareersHero';
import HiringProcess from '@/components/sections/careers/HiringProcess';
import RolesBoard from '@/components/sections/careers/RolesBoard';
import WorkplaceGallery from '@/components/sections/careers/WorkplaceGallery';
import PageJsonLd from '@/components/seo/PageJsonLd';
import { careersMeta } from '@/content/careers';
import { createSeoMetadata, type SeoMetadataInput } from '@/lib/seoMetadata';

const seo: SeoMetadataInput = {
  title: careersMeta.title,
  description: careersMeta.description,
  canonicalPath: '/careers/',
};

export const metadata = createSeoMetadata(seo);

/**
 * The careers hub. JobPosting structured data lives on each role's own page,
 * not here: Google for Jobs reads one posting per page, and a listing page
 * marked up with several postings is ignored or flagged.
 */
export default function CareersPage() {
  return (
    <>
      <PageJsonLd {...seo} />
      <CareersHero />
      <RolesBoard />
      <WorkplaceGallery />
      <HiringProcess />
      <ApplySection />
      <CareersFaq />
    </>
  );
}
