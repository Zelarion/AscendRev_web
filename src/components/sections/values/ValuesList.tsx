import type { JSX } from 'react';
import type { CorporateValue } from '@/content/values';

interface ValuesListProps {
  values: readonly CorporateValue[];
}

interface ValueItemProps {
  value: CorporateValue;
}

/**
 * One corporate value: number and name, an emphasised principle line, the
 * body paragraph, and a bold closing line. The client's own numbering
 * (`01 —`, `02 —`, `03 —`) is reproduced by joining `number` and `name` with
 * an em dash, matching the source formatting exactly.
 */
function ValueItem({ value }: ValueItemProps): JSX.Element {
  return (
    <article className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-6">
      <h2 className="ar-type-value-title font-display text-[var(--ink)]">
        {value.number} — {value.name}
      </h2>
      <p className="mt-3 font-display text-body-lg italic text-[var(--ink)]">
        {value.principle}
      </p>
      <p className="mt-3 text-body text-[var(--ink-muted)]">{value.body}</p>
      <p className="mt-3 text-body font-semibold text-[var(--ink)]">
        {value.closing}
      </p>
    </article>
  );
}

export default function ValuesList({ values }: ValuesListProps): JSX.Element {
  return (
    <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-5 lg:grid-cols-3">
      {values.map((value) => (
        <ValueItem key={value.name} value={value} />
      ))}
    </div>
  );
}
