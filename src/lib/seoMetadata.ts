import type { Metadata } from 'next';
import { site } from '@/content/site';

const socialPreviewImage = {
  url: '/ascendrev-og-preview.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'AscendRev logo and rising-growth icon above the tagline Dedicated Team. Targeted Solutions. Accelerated Revenue.',
};

interface SeoMetadataInput {
  title: string;
  description: string;
  canonicalPath: string;
}

/** Build consistent page metadata while keeping each route's copy and URL. */
export function createSeoMetadata({
  title,
  description,
  canonicalPath,
}: SeoMetadataInput): Metadata {
  const brandedTitle = `${title} | ${site.name}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: 'en_CA',
      url: canonicalPath,
      title: brandedTitle,
      description,
      images: [socialPreviewImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: brandedTitle,
      description,
      images: [socialPreviewImage.url],
    },
  };
}
