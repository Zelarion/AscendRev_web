import { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from 'next';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SPEC.md §1: static export for shared cPanel hosting. No Node server at runtime,
// no API routes, no database. `images.unoptimized` is required by `output: 'export'`
// because Next's on-demand image optimizer needs a server process we deliberately
// do not run.
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Emit `out/privacy/index.html` rather than `out/privacy.html`. Apache serves
  // directory-style URLs through DirectoryIndex with no configuration at all,
  // whereas flat files need `MultiViews` or a mod_rewrite rule to resolve
  // `/privacy`. Routing therefore survives a lost or overwritten .htaccess —
  // that file still ships (HTTPS, caching, security headers, 404) but nothing
  // load-bearing depends on it. Canonical URLs carry the same trailing slash so
  // the advertised URL is the one Apache serves, with no redirect hop.
  trailingSlash: true,
  // Pins the workspace root to this project. Without it, Next.js walks up and
  // finds an unrelated package-lock.json outside the repo and warns that it
  // may have inferred the wrong root — harmless here, but silencing it keeps
  // real build output from getting lost in noise.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
