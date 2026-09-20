import type { Metadata } from 'next';
import Section from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'The AscendRev Advantage',
  description:
    "AscendRev's leadership and Philippine operations infrastructure — what's behind the team North American clients work with.",
  alternates: {
    canonical: '/advantage/',
  },
};

/**
 * Advantage stub (SPEC.md §10 build order: this pass is scaffold only).
 * Real content — Leadership block at #leadership, Infrastructure block —
 * lands once copy exists in src/content/advantage.ts. Note SPEC.md §4.3: the
 * Infrastructure block is explicitly blocked pending SPEC.md §7 item 3
 * (facility photography) and must render as ImagePlaceholder plus
 * commitment-tense copy until that is resolved, not as a normal section.
 */
export default function AdvantagePage() {
  return (
    <Section>
      <h1>The AscendRev Advantage</h1>
      <p>
        This is a placeholder for the Advantage page. The Leadership and
        Infrastructure sections land in a later build pass, once the approved
        copy exists in <code>src/content/advantage.ts</code>.
      </p>
    </Section>
  );
}
