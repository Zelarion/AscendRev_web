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
    <Section className="!pt-[calc(var(--header-height)+1rem)] !pb-6 flex min-h-[400px] items-center sm:min-h-[440px] lg:min-h-0 lg:!pt-[var(--section-space)]">
      <Container className="max-w-[1320px]">
        <div className="w-full">
          <h1 className="max-w-none font-display text-h1 text-[var(--ink)] lg:whitespace-nowrap">
            {headline}
          </h1>
          <div className="mt-2 grid w-full items-start gap-8 sm:mt-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:gap-10">
            <p className="text-body leading-relaxed text-[var(--ink-muted)]">{subheadline}</p>
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
        </div>
      </Container>
    </Section>
  );
}
