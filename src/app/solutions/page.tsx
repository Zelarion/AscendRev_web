import type { Metadata } from 'next';
import Section from '@/components/layout/Section';

export const metadata: Metadata = {
  title: 'Solutions',
  description:
    'The infrastructure behind fast-growing North American enterprises — the outsourced functions AscendRev staffs and how teams are hired and screened.',
  alternates: {
    canonical: '/solutions/',
  },
};

/**
 * Solutions stub (SPEC.md §10 build order: this pass is scaffold only).
 * Real content — service grid (the eight functions), "No Warm Bodies"
 * hiring-standard section, closing band (SPEC.md §4.2) — lands once copy
 * exists in src/content/solutions.ts.
 */
export default function SolutionsPage() {
  return (
    <Section>
      <h1>Solutions</h1>
      <p>
        This is a placeholder for the Solutions page. The service grid and
        hiring-standard content land in a later build pass, once the approved
        copy exists in <code>src/content/solutions.ts</code>.
      </p>
    </Section>
  );
}
