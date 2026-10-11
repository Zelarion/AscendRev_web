import CareersHero from '@/components/sections/careers/CareersHero';
import JobPostings from '@/components/sections/careers/JobPostings';
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
 * The careers page, exactly as Rio specified: his heading and line, then
 * "Ready to grow with us?" and the job postings, nothing else.
 *
 * JobPosting structured data lives on each posting's own page, not here:
 * Google for Jobs reads one posting per page, and a listing page marked up
 * with several postings is ignored or flagged.
 */
export default function CareersPage() {
  return (
    <>
      <PageJsonLd {...seo} />
      <CareersHero />
      <JobPostings />
    </>
  );
}
