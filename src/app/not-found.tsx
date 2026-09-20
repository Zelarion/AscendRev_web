import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <Section>
      <h1>Page not found</h1>
      <p>
        The page you&apos;re looking for doesn&apos;t exist. Head back to the{' '}
        <Link href="/">homepage</Link>.
      </p>
    </Section>
  );
}
