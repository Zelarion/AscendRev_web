import type { Metadata } from 'next';
import Section from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: "AscendRev's privacy policy, covering how personal information submitted through this site is collected, used, and retained.",
  alternates: {
    canonical: '/privacy/',
  },
};

/**
 * Privacy stub (SPEC.md §10 build order: this pass is scaffold only).
 * SPEC.md §3: to be built from the document already prepared in
 * `requirements/`. SPEC.md §7 item 7 makes this page a hard prerequisite for
 * launch, the enquiry form collects personal information from people in
 * Canada, so this cannot ship as a placeholder past the content pass.
 */
export default function PrivacyPage() {
  return (
    <Section>
      <h1>Privacy Policy</h1>
      <p>
        This is a placeholder for the Privacy Policy page. The real policy
        text is built from the client&apos;s prepared document in a later
        pass, once it exists in <code>src/content</code>.
      </p>
    </Section>
  );
}
