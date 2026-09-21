import type { Metadata } from 'next';
import Section from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Start a conversation with AscendRev about outsourcing a function to a dedicated Philippine team.',
  alternates: {
    canonical: '/contact/',
  },
};

/**
 * Contact stub (SPEC.md §10 build order: this pass is scaffold only).
 * Real content, "What to Expect" numbered sequence and the two-step
 * enquiry form (SPEC.md §4.4, §6), lands in the pass that also builds
 * public/api/enquiry.php, once copy exists in src/content/contact.ts.
 */
export default function ContactPage() {
  return (
    <Section>
      <h1>Contact</h1>
      <p>
        This is a placeholder for the Contact page. The two-step enquiry form
        and &quot;What to Expect&quot; sequence land in a later build pass,
        once the approved copy exists in <code>src/content/contact.ts</code>.
      </p>
    </Section>
  );
}
