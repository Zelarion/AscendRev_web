import type { Metadata } from 'next';
import Section from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: "AscendRev's terms of use for this website.",
  alternates: {
    canonical: '/terms/',
  },
};

/**
 * Terms stub (SPEC.md §10 build order: this pass is scaffold only).
 * SPEC.md §3: to be built from the document already prepared in
 * `requirements/`. The footer links to this page, so it must exist before
 * launch or the footer ships broken.
 */
export default function TermsPage() {
  return (
    <Section>
      <h1>Terms of Use</h1>
      <p>
        This is a placeholder for the Terms of Use page. The real terms text
        is built from the client&apos;s prepared document in a later pass,
        once it exists in <code>src/content</code>.
      </p>
    </Section>
  );
}
