import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export const dynamic = 'force-static';

/**
 * Web app manifest. Search engines and phones read the icon set from here, so
 * it lists the same square mark at every size `layout.tsx` links directly.
 * Colours are the literal values of `--color-navy-900` and `--color-bg` in
 * globals.css, because a manifest cannot read CSS custom properties.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.legalName,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#0f1b33',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
