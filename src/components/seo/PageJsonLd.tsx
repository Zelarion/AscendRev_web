import { site } from '@/content/site';
import { socialPreviewImage, type SeoMetadataInput } from '@/lib/seoMetadata';
import { schemaIds } from '@/lib/schemaIds';
import JsonLdScript from './JsonLdScript';

/**
 * Per-route WebPage and BreadcrumbList. Takes the same input as
 * `createSeoMetadata`, so a page's title, description and URL come from one
 * object and the structured data can never disagree with the <head> tags.
 */
export default function PageJsonLd({
  title,
  description,
  canonicalPath,
}: SeoMetadataInput) {
  const pageUrl = new URL(canonicalPath, site.url).toString();
  const homeUrl = new URL('/', site.url).toString();
  const isHome = pageUrl === homeUrl;
  const breadcrumbId = `${pageUrl}#breadcrumb`;

  const webPage = {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: title,
    description,
    inLanguage: 'en-CA',
    isPartOf: { '@id': schemaIds.website },
    about: { '@id': schemaIds.organization },
    // Gives search results a clear thumbnail candidate for every page.
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: new URL(socialPreviewImage.url, site.url).toString(),
      width: socialPreviewImage.width,
      height: socialPreviewImage.height,
    },
    ...(isHome ? {} : { breadcrumb: { '@id': breadcrumbId } }),
  };

  // The home page is the breadcrumb root, so a trail there would be one item.
  const graph = isHome
    ? [webPage]
    : [
        webPage,
        {
          '@type': 'BreadcrumbList',
          '@id': breadcrumbId,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: homeUrl },
            { '@type': 'ListItem', position: 2, name: title, item: pageUrl },
          ],
        },
      ];

  return <JsonLdScript data={{ '@context': 'https://schema.org', '@graph': graph }} />;
}
