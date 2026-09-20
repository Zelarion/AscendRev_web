import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from 'next/font/google';
import SkipLink from '@/components/layout/SkipLink';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { site } from '@/content/site';
import './globals.css';

/**
 * Self-hosted via next/font at build time (DESIGN.md §2) — no render-blocking
 * request to Google and no third-party call from a PIPEDA-scoped page.
 * `display: 'swap'` so text is never invisible while the font loads.
 */
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-newsreader',
  display: 'swap',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

/**
 * SPEC.md §8: canonical base `https://ascend-rev.ca` — WITH the hyphen. The
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
    'AscendRev places dedicated front-office and back-office teams — sales, support, help desk — with North American businesses, executed from the Philippines.',
  applicationName: site.name,
  authors: [{ name: site.legalName }],
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_CA',
    url: site.url,
    title: `${site.name} | ${site.tagline}`,
    description:
      'AscendRev places dedicated front-office and back-office teams — sales, support, help desk — with North American businesses, executed from the Philippines.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} | ${site.tagline}`,
    description:
      'AscendRev places dedicated front-office and back-office teams — sales, support, help desk — with North American businesses, executed from the Philippines.',
    images: ['/og-image.png'],
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
    <html
      lang="en-CA"
      className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body>
        <SkipLink />
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
