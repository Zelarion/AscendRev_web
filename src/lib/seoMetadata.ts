import type { Metadata } from 'next';
import { site } from '@/content/site';

export const socialPreviewImage = {
  url: '/ascendrev-og-preview.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'AscendRev logo and rising-growth icon above the tagline Dedicated Team. Targeted Solutions. Accelerated Revenue.',
};

export interface SeoMetadataInput {
  title: string;
  description: string;
  canonicalPath: string;
  /**
   * The title already carries the brand (the home page leads with it), so
   * use it as written instead of appending "| AscendRev" a second time.
   */
  titleIncludesBrand?: boolean;
}

/** Build consistent page metadata while keeping each route's copy and URL. */
export function createSeoMetadata({
  title,
  description,
  canonicalPath,
  titleIncludesBrand = false,
}: SeoMetadataInput): Metadata {
  const brandedTitle = titleIncludesBrand ? title : `${title} | ${site.name}`;

  return {
    title: titleIncludesBrand ? { absolute: title } : title,
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
