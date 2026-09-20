import type { Metadata } from 'next';
import Section from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'Outsourcing and Offshoring Teams for North American Businesses',
  description:
    'AscendRev places dedicated front-office and back-office teams — sales, support, help desk — with North American businesses, executed from the Philippines.',
  alternates: {
    canonical: '/',
  },
};

/**
 * Homepage stub (SPEC.md §10 build order: this pass is scaffold only).
 * Real sections — Hero, trust band, Pillars, Industries tabs, closing band
 * (SPEC.md §4.1) — land in a later pass, per the content-risk register
 * (SPEC.md §7) and once copy exists in src/content/home.ts.
 */
export default function HomePage() {
  return (
    <Section>
      <h1>AscendRev</h1>
      <p>
        This is a placeholder for the AscendRev homepage. Hero, trust band,
        Pillars, Industries, and closing band content land in a later build
        pass, once the approved copy exists in <code>src/content/home.ts</code>.
      </p>
    </Section>
  );
}
