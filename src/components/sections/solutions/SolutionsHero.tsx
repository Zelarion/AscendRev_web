import type { JSX } from 'react';
import Image from 'next/image';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { solutions } from '@/content/solutions';

/**
 * Compact editorial hero for `/solutions`.
 *
 * The full central funnel illustration stays centered at its natural ratio.
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
          <p className="mt-3 max-w-[70ch] text-body-lg leading-relaxed text-[var(--ink-muted)] sm:mt-4">
            {subheadline}
          </p>
          <figure className="mx-auto mt-7 w-full max-w-[420px] overflow-hidden rounded-[10px] border border-[var(--border)] bg-[#07111d] sm:mt-9">
            <Image
              src="/images/solutions-revenue-funnel.png"
              alt="Illustrated sales funnel surrounded by lead conversion and revenue analytics dashboards"
              width={726}
              height={754}
              priority
              sizes="(min-width: 420px) 420px, calc(100vw - 2rem)"
              className="h-auto w-full object-contain"
            />
          </figure>
        </div>
      </Container>
    </Section>
  );
}
