import type { JSX } from 'react';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import { cn } from '@/lib/cn';
import type { TrustBandContent } from '@/content/home';

interface TrustBandProps {
  content: TrustBandContent;
}

/**
 * The credential rail, directly under the hero and still on navy.
 *
 * WHY IT LOOKS NOTHING LIKE THE PILLARS BELOW IT
 *
 * Both sections are hairline-divided, because that is the vocabulary DESIGN.md
 * §3 sets for this page, and two hairline-divided sections in a row would read
 * as the same section twice. So they are divided along different axes and at
 * different densities: this band is three short columns separated by vertical
 * rules, compact, with no headings and no icons. The pillars are wide
 * horizontal rows separated by full-width rules, each with an icon and a
 * heading. Same material, opposite rhythm.
 *
 * It is also deliberately quiet. Everything here is a fact about a company
 * registered a fortnight ago, and PRODUCT.md is explicit that overclaiming is
 * this page's failure mode. Three sentences and a rule read as more confident
 * than three sentences in boxes.
 *
 * `pendingApproval` items render exactly like any other. SPEC.md §9 gate 3
 * fails the production build while a flagged claim is still in the output, and
 * `data-pending-approval` puts the flag in the markup so that gate can find it
 * without having to recognise the copy.
 */
export default function TrustBand({ content }: TrustBandProps): JSX.Element {
  return (
    <Section
      tone="navy"
      // Tighter than the standard section rhythm. This is a rail between the
      // hero and the first real section rather than a destination, and full
      // section padding would make it read as one. The top hairline is what
      // separates it from the hero, which is the same navy.
      className="border-t border-[var(--border-navy)] py-[clamp(3rem,6vw,4.5rem)]"
    >
      <Container>
        <RevealOnScroll>
          <p className="max-w-[46ch] text-body-lg text-white">{content.lead}</p>
        </RevealOnScroll>

        <RevealOnScroll
          as="ul"
          stagger
          delayMs={120}
          className="mt-10 grid gap-y-6 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-0"
        >
          {content.items.map((item, index) => (
            <li
              key={item.text}
              data-pending-approval={item.pendingApproval ? 'true' : undefined}
              className={cn(
                'border-[var(--border-navy)]',
                // The rule separates, so the first item never carries one, and
                // it turns with the layout: a horizontal rule above each item
                // while they are stacked, a vertical rule beside each item once
                // they sit side by side.
                index > 0 && 'border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8'
              )}
            >
              <p className="max-w-[38ch] text-body text-white/86">{item.text}</p>
            </li>
          ))}
        </RevealOnScroll>
      </Container>
    </Section>
  );
}
