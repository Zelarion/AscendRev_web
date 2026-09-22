import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { solutions } from '@/content/solutions';
import { solutionsHeroImage } from '@/content/solutionsHeroImage';

/**
 * Compact editorial hero for `/solutions`.
 * The generated executive-office image sits behind the copy with a restrained
 * navy treatment so the page remains consistent with the AscendRev system.
 */
export default function SolutionsHero(): JSX.Element {
  const { headline, subheadline } = solutions.hero;

  return (
    <Section tone="navy" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url("${solutionsHeroImage}")` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,12,24,0.92)_0%,rgba(3,12,24,0.82)_42%,rgba(3,12,24,0.58)_72%,rgba(3,12,24,0.42)_100%)]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[var(--navy-900)]/20" />

      <Container>
        <div className="max-w-[900px]">
          <h1 className="max-w-[22ch] font-display text-h1 text-white">{headline}</h1>
          <p className="mt-8 max-w-[58ch] text-body-lg leading-relaxed text-white/76">
            {subheadline}
          </p>
        </div>
      </Container>
    </Section>
  );
}
