import type { JSX } from 'react';
import Button from '@/components/ui/Button';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Reveal from '@/components/ui/Reveal';
import Stagger from '@/components/ui/Stagger';
import { solutions, type HiringColumn } from '@/content/solutions';

/**
 * "We Hire Career Professionals, Not Clock-Punchers." (SPEC.md §4.2, item 3).
 *
 * The brief for this section is that it is two columns and is NOT cards. It is
 * built as a standards sheet instead: a shared top rule, a vertical hairline
 * between the columns, and rows divided by hairlines rather than boxed. The
 * page has just come off an eight-card grid, so repeating the card affordance
 * here would turn the whole page into a stack of identical rectangles, which
 * is exactly what DESIGN.md §3 is guarding against.
 *
 * The two column headings are mono, uppercase and widely tracked. That is the
 * label style, and DESIGN.md §2 permits it for genuine labels while banning it
 * as an eyebrow above a section heading. These sit above list content and name
 * what the list is, which is the case the style exists for. There is no label
 * above the h2.
 */

/** Tracked mono label. Repeated rather than shared: `sections/shared/` belongs
 * to another builder in this pass, so a consolidation pass can lift it later. */
const COLUMN_LABEL =
  'font-mono text-small font-medium uppercase tracking-[0.3em] text-[var(--ink)]';

interface StandardColumnProps {
  column: HiringColumn;
  className?: string;
}

/**
 * One column of the sheet. Every row carries a top hairline including the
 * first, so the group reads as a set with a rule above it rather than as rows
 * that happen to be separated; that is also why no row carries a bottom rule.
 */
function StandardColumn({ column, className }: StandardColumnProps): JSX.Element {
  return (
    <div className={className}>
      <h3 className={COLUMN_LABEL}>{column.heading}</h3>
      <ul className="mt-8">
        {column.items.map((item) => (
          <li
            key={item.text}
            className="border-t border-[var(--border)] py-6 text-body text-[var(--ink-muted)]"
          >
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HiringStandard(): JSX.Element {
  const { heading, intro, standard, screening, note, cta } = solutions.hiring;

  return (
    <Section>
      <Container>
        <h2 className="max-w-[20ch] font-display text-h2 text-[var(--ink)]">{heading}</h2>
        <p className="mt-6 max-w-[68ch] text-body-lg text-[var(--ink-muted)]">{intro}</p>

        {/* gap-x is zero on purpose: the divider is the right column's own
            left border, so the padding either side of it is symmetric and the
            rule sits where a reader expects the fold to be. */}
        <Stagger className="mt-16 grid gap-y-14 md:grid-cols-2 md:gap-y-0">
          <StandardColumn column={standard} className="md:pr-16" />
          <StandardColumn
            column={screening}
            className="md:border-l md:border-[var(--border)] md:pl-16"
          />
        </Stagger>

        <Reveal className="mt-16 flex flex-col gap-8 border-t border-[var(--border)] pt-10 md:flex-row md:items-center md:justify-between md:gap-12">
          <p className="max-w-[52ch] text-body-lg text-[var(--ink)]">{note}</p>
          <Button href={cta.href} size="lg" className="self-start md:self-auto">
            {cta.label}
          </Button>
        </Reveal>
      </Container>
    </Section>
  );
}
