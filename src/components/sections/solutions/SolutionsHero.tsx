import type { JSX } from 'react';
import Image from 'next/image';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { solutions } from '@/content/solutions';

/**
 * Compact editorial hero for `/solutions`.
 *
 * Rio's supplied conference-room photo sits in a contained panel beside the
 * copy; the surrounding hero stays on the semantic white page surface.
 */
export default function SolutionsHero(): JSX.Element {
  const { headline, subheadline } = solutions.hero;

  return (
    <Section className="!pt-[calc(var(--header-height)+1rem)] flex min-h-[400px] items-center sm:min-h-[440px] lg:min-h-[520px] lg:!pt-[var(--section-space)]">
      <Container>
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:gap-16">
          <div>
            <h1 className="max-w-[22ch] font-display text-h1 text-[var(--ink)]">{headline}</h1>
            <p className="mt-4 max-w-[58ch] text-body-lg leading-relaxed text-[var(--ink-muted)]">
              {subheadline}
            </p>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] lg:aspect-[4/3]">
            <Image
              src="/images/office3.jpg"
              alt="Conference room with a central table and surrounding chairs"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
