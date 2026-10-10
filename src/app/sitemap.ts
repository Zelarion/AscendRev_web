import type { MetadataRoute } from 'next';
import { openRoles } from '@/content/careers';
import { site } from '@/content/site';

export const dynamic = 'force-static';

const publicPaths = [
  '/',
  '/solutions/',
  '/capabilities/',
  '/advantage/',
  '/values/',
  '/careers/',
  '/contact/',
  '/privacy/',
  '/terms/',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  // Each open role has its own page; that is the page Google for Jobs indexes.
  const rolePaths = openRoles.map((role) => `/careers/${role.slug}/`);
  return [...publicPaths, ...rolePaths].map((path) => ({
    url: new URL(path, site.url).toString(),
  }));
}
