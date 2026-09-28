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
  description:
    'AscendRev builds dedicated sales, customer experience, and business operations teams for North American companies, delivered from the Philippines.',
  applicationName: site.name,
  authors: [{ name: site.legalName }],
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_CA',
    url: site.url,
    title: `${site.name} | ${site.tagline}`,
    description:
      'AscendRev builds dedicated sales, customer experience, and business operations teams for North American companies, delivered from the Philippines.',
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
    description:
      'AscendRev builds dedicated sales, customer experience, and business operations teams for North American companies, delivered from the Philippines.',
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
          {`document.documentElement.dataset.ascendrevLoader = 'active'; window.setTimeout(() => { if (document.documentElement.dataset.ascendrevLoader === 'active') delete document.documentElement.dataset.ascendrevLoader; }, 15000);`}
        </Script>
      </head>
      <body>
        <OrganizationJsonLd />
        <PageLoader />
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
