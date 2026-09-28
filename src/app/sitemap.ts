import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export const dynamic = 'force-static';

const publicPaths = [
  '/',
  '/solutions/',
  '/capabilities/',
  '/advantage/',
  '/values/',
  '/contact/',
  '/privacy/',
  '/terms/',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: new URL(path, site.url).toString(),
  }));
}
