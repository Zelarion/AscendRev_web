import type { JSX } from 'react';
import type { CorporateValue } from '@/content/values';

interface ValuesListProps {
  values: readonly CorporateValue[];
}

interface ValueItemProps {
  value: CorporateValue;
  /** First item carries no top rule; every item after it does, so the rule
   * reads as a divider between values rather than a rule under each one. */
  withDivider: boolean;
}

/**
 * One corporate value: number and name, an emphasised principle line, the
 * body paragraph, and a bold closing line. The client's own numbering
 * (`01 —`, `02 —`, `03 —`) is reproduced by joining `number` and `name` with
 * an em dash, matching the source formatting exactly.
 */
function ValueItem({ value, withDivider }: ValueItemProps): JSX.Element {
  return (
    <article
      className={
        withDivider
          ? 'border-t border-[var(--border)] pt-9 sm:pt-12'
          : undefined
      }
    >
      <h2 className="font-display text-h2 text-[var(--ink)]">
        {value.number} — {value.name}
      </h2>
      <p className="mt-3 font-display text-body-lg italic text-[var(--ink)] sm:mt-4">
        {value.principle}
      </p>
      <p className="mt-4 max-w-[68ch] text-body text-[var(--ink-muted)] sm:mt-5">{value.body}</p>
      <p className="mt-4 max-w-[68ch] text-body font-semibold text-[var(--ink)] sm:mt-5">
        {value.closing}
      </p>
    </article>
  );
}

export default function ValuesList({ values }: ValuesListProps): JSX.Element {
  return (
    <div className="mt-9 space-y-9 sm:mt-12 sm:space-y-12 lg:mt-14 lg:space-y-14">
      {values.map((value, index) => (
        <ValueItem key={value.name} value={value} withDivider={index > 0} />
      ))}
    </div>
  );
}
