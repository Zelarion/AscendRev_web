import { site } from '@/content/site';

const siteUrl = `${site.url}/`;

/**
 * Stable JSON-LD node ids. The site-wide graph defines these nodes once and
 * every page's graph points at them, so search engines see one company, one
 * website and one founder rather than a new copy per page.
 */
export const schemaIds = {
  organization: `${siteUrl}#organization`,
  website: `${siteUrl}#website`,
  founder: `${siteUrl}#rio-vidal`,
  logo: `${siteUrl}#logo`,
} as const;
