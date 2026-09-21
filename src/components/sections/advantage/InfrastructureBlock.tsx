import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import Reveal from '@/components/ui/Reveal';
import Stagger from '@/components/ui/Stagger';
import { advantage } from '@/content/advantage';

/**
 * Infrastructure block (SPEC.md §4.3, item 3, blocked pending §7 item 3).
 *
 * This section describes a Philippine operation that does not exist yet. Three
 * decisions follow from that and none of them are stylistic:
 *
 *  1. The status line stating so is the first thing under the heading, before
 *     a single commitment is made, set the same way as the leadership
 *     attribution: full-strength `--ink`, weight 500, between ink hairlines.
 *     A reader who reads only the heading and the next block has still been
 *     told the facility is not built.
 *  2. The image slot renders `ImagePlaceholder`. No photograph of this
 *     workspace exists, and DESIGN.md §5 forbids substituting one that is not
 *     AscendRev's own. The placeholder is also what fails the production build
 *     (SPEC.md §9 gate 2) while the slot is unfilled, which is the intended
 *     behaviour.
 *  3. The slot is not styled as a hero image and is not captioned as though a
 *     photograph were imminent. It sits at a modest measure and carries the
 *     content's own note directly beneath it, which is a statement about what
 *     will never appear on this page. The empty frame and that sentence are
 *     meant to be read together.
 *
 * The commitments are last, so the page states what is true before it states
 * what is promised.
 */

const SECTION_LABEL =
  'font-mono text-small font-medium uppercase tracking-[0.3em] text-[var(--ink)]';

export default function InfrastructureBlock(): JSX.Element {
  const { heading, status, intro, image, commitmentsHeading, commitments, note } =
    advantage.infrastructure;

  return (
    <Section>
      <Container>
        <h2 className="max-w-[20ch] font-display text-h2 text-[var(--ink)]">{heading}</h2>

        {/* Same treatment as the leadership attribution, and for the same
            reason: h3 scale, ink rules top and bottom, immediately under the
            heading and ahead of every promise the section goes on to make. */}
        <p className="mt-10 max-w-[68ch] border-y border-[var(--ink)] py-6 text-h3 text-[var(--ink)]">
          {status}
        </p>

        <p className="mt-10 max-w-[68ch] text-body-lg text-[var(--ink-muted)]">{intro}</p>

        <Reveal as="div" className="mt-16">
          <figure className="max-w-[820px]">
            <ImagePlaceholder
              label={image.label}
              ratio={image.ratio}
              minWidth={image.minWidth}
              className="rounded-[10px]"
            />
            <figcaption className="mt-6 max-w-[68ch] text-body text-[var(--ink-muted)]">
              {note}
            </figcaption>
          </figure>
        </Reveal>

        <div className="mt-20">
          <h3 className={SECTION_LABEL}>{commitmentsHeading}</h3>
          {/* Two columns at md and above. Every row carries a top hairline,
              including the first of each column, so the rule pattern stays
              identical whether the list is one column or two. */}
          <Stagger as="ul" className="mt-8 grid gap-x-16 md:grid-cols-2">
            {commitments.map((commitment) => (
              <li
                key={commitment.text}
                className="border-t border-[var(--border)] py-6 text-body text-[var(--ink-muted)]"
              >
                {commitment.text}
              </li>
            ))}
          </Stagger>
        </div>
      </Container>
    </Section>
  );
}
