import type { Metadata } from 'next';
import SkipLink from '@/components/layout/SkipLink';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
    'AscendRev places dedicated front-office and back-office teams, sales, support, help desk, with North American businesses, executed from the Philippines.',
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
      'AscendRev places dedicated front-office and back-office teams, sales, support, help desk, with North American businesses, executed from the Philippines.',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} | ${site.tagline}`,
    description:
      'AscendRev places dedicated front-office and back-office teams, sales, support, help desk, with North American businesses, executed from the Philippines.',
    images: ['/og-image.jpg'],
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
    <html lang="en-CA">
      <body>
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
