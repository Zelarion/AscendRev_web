import type { Metadata } from 'next';
import Script from 'next/script';
import '@fontsource-variable/newsreader/standard.css';
import SkipLink from '@/components/layout/SkipLink';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import { SmoothScrollProvider } from '@/components/motion';
import PageLoader from '@/components/ui/PageLoader';
import { site } from '@/content/site';
import './globals.css';

/**
 * SPEC.md §8: canonical base `https://ascend-rev.ca`, WITH the hyphen. The
 * client's own requirements document has this wrong in places (SPEC.md §7
 * item 2); every URL this build emits must use the correct domain, and
 * SPEC.md §9 gate 11 fails the production build if the hyphen-less form
 * appears anywhere in the output.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.legalName }],
  // Google's result favicon wants a square icon in a multiple of 48px, and some
  // crawlers only ever try /favicon.ico, so the same mark ships in every form.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_CA',
    url: site.url,
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: [
      {
        url: '/ascendrev-og-preview.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'AscendRev logo and rising-growth icon above the tagline Dedicated Team. Targeted Solutions. Accelerated Revenue.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    images: ['/ascendrev-og-preview.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA" suppressHydrationWarning>
      <head>
        <Script id="ascendrev-loader-bootstrap" strategy="beforeInteractive">
          {`(() => {
            const loaderRoot = document.documentElement;
            const startedAt = performance.now();
            let lastDomChangeAt = startedAt;
            let released = false;
            let checkingLayout = false;
            loaderRoot.dataset.ascendrevLoaderStartedAt = String(startedAt);
            loaderRoot.dataset.ascendrevLoader = 'active';

            const observer = new MutationObserver(() => {
              lastDomChangeAt = performance.now();
            });
            observer.observe(loaderRoot, {
              subtree: true,
              childList: true,
            });

            // Mirrors PageLoader.tsx: literals only, this is an inline bootstrap
            // string and cannot import BOOT_STABILITY_MS (80) / BOOT_MAX_MS (1200).
            const release = () => {
              released = true;
              observer.disconnect();
              window.clearInterval(poll);
              loaderRoot.dataset.ascendrevLoader = 'expired';
              delete loaderRoot.dataset.ascendrevLoaderStartedAt;
            };

            const poll = window.setInterval(() => {
              if (released) return;
              // Hard cap: release unconditionally so a running animation
              // (Lenis, framer-motion) can never stall the boot cover forever.
              if (performance.now() - startedAt >= 1200) {
                release();
                return;
              }
              if (checkingLayout || document.readyState === 'loading') return;
              const main = document.getElementById('main');
              if (!main) return;
              const stylesPending = Array.from(document.querySelectorAll('link[rel~="stylesheet"]'))
                .some((link) => !link.disabled && link.sheet === null);
              if (stylesPending || performance.now() - lastDomChangeAt < 80) return;

              checkingLayout = true;
              window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
                checkingLayout = false;
                if (released) return;
                const currentMain = document.getElementById('main');
                const currentStylesPending = Array.from(document.querySelectorAll('link[rel~="stylesheet"]'))
                  .some((link) => !link.disabled && link.sheet === null);
                if (
                  !currentMain
                  || currentStylesPending
                  || performance.now() - lastDomChangeAt < 80
                ) return;

                currentMain.getBoundingClientRect();
                release();
              }));
            }, 40);

            document.addEventListener('DOMContentLoaded', () => {
              lastDomChangeAt = performance.now();
            }, { once: true });
          })();`}
        </Script>
        {/* Loader and header both paint this logo first; fetch it with the HTML. */}
        <link rel="preload" as="image" href="/ascendrev-loader-logo-transparent.webp" fetchPriority="high" />
        <noscript><style>{`.page-loader-boot { display: none !important; }`}</style></noscript>
      </head>
      <body>
        <PageLoader />
        <OrganizationJsonLd />
        <SkipLink />
        <Header />
        <SmoothScrollProvider>
          <main id="main" className="relative z-[var(--z-sticky)]">
            {children}
          </main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
