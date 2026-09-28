import type { JSX } from 'react';
import Image from 'next/image';
import Container from '@/components/layout/Container';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import Stagger from '@/components/ui/Stagger';
import { capabilities } from '@/content/capabilities';

const SERVICE_AREAS = [
  {
    heading: 'Sales & revenue',
    groupHeadings: [
      'Generate Demand',
      'Convert More Opportunities',
      'Grow Existing Revenue',
    ],
  },
  {
    heading: 'Customer experience',
    groupHeadings: ['Serve More Customers'],
  },
  {
    heading: 'Business operations',
    groupHeadings: ['Strengthen Cash Flow'],
  },
] as const;

export default function OperatingModelSection(): JSX.Element {
  return (
    <section
      aria-labelledby="operating-model-heading"
      className="w-full border-y border-[var(--line)] bg-[var(--surface-page)] py-[var(--section-space,clamp(3.5rem,8vw,8rem))]"
    >
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <RevealOnScroll as="header">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gold-text)]">
                Operating model
              </p>
              <h2
                id="operating-model-heading"
                className="mt-4 font-display text-h2 text-[var(--navy-900)]"
              >
                Sales, customer experience and business operations.
              </h2>
            </RevealOnScroll>

            <Stagger className="mt-7 grid gap-3 sm:mt-8">
              {SERVICE_AREAS.map((area) => {
                const services = area.groupHeadings
                  .map((heading) =>
                    capabilities.groups.find((group) => group.heading === heading)
                  )
                  .flatMap((group) => group?.services ?? []);

                return (
                  <article
                    key={area.heading}
                    className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-[0_8px_28px_rgba(11,31,59,0.04)] sm:p-5"
                  >
                    <h3 className="font-display text-h3 text-[var(--navy-900)]">
                      {area.heading}
                    </h3>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {services.map((service) => (
                        <li
                          key={service}
                          className="rounded-full border border-[var(--line)] bg-[var(--surface-page)] px-3 py-1.5 text-xs font-medium leading-5 text-[var(--text-muted)] sm:text-sm"
                        >
                          {service}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </Stagger>
          </div>

          <RevealOnScroll delayMs={100}>
            <figure className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface-band)] p-3 sm:p-6 lg:p-8">
              <Image
                src="/images/ascendrev-operating-model.png"
                alt="A person, circular process arrows and a rising chart connected by a gold line."
                width={1448}
                height={1086}
                sizes="(min-width: 1024px) 560px, (min-width: 640px) 80vw, 100vw"
                className="mx-auto block h-auto w-full max-w-[620px] object-contain"
              />
            </figure>
          </RevealOnScroll>
        </div>
      </Container>
    </section>
  );
}
