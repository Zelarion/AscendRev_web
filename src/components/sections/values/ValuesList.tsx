'use client';

import { useEffect, useRef, useState, type JSX } from 'react';
import type { CorporateValue } from '@/content/values';

interface ValuesListProps {
  values: readonly CorporateValue[];
}

/**
 * Stacked value statements with a restrained scroll-led emphasis. The browser
 * keeps normal scroll behavior and every value remains visible in the markup.
 */
export default function ValuesList({ values }: ValuesListProps): JSX.Element {
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const nodes = itemRefs.current.filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const index = visible[0]?.target.getAttribute('data-value-step');
        if (index !== null && index !== undefined) setActiveIndex(Number(index));
      },
      { rootMargin: '-43% 0px -43% 0px', threshold: 0.1 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [values.length]);

  return (
    <div className="relative mt-6 lg:mt-0">
      <div aria-hidden="true" className="absolute bottom-8 left-[15px] top-8 w-px bg-[var(--border)] sm:left-[18px]" />
      <div
        aria-hidden="true"
        className="absolute left-[14px] top-8 w-[3px] rounded-full bg-[var(--gold-text)] transition-[height] duration-500 motion-reduce:transition-none sm:left-[17px]"
        style={{ height: `${((activeIndex + 1) / values.length) * 100}%` }}
      />
      <ol className="relative m-0 list-none space-y-4 p-0 sm:space-y-5">
        {values.map((value, index) => {
          const active = index === activeIndex;
          return (
            <li
              key={value.name}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              data-value-step={index}
              aria-current={active ? 'step' : undefined}
            >
              <article className={`relative rounded-[10px] border bg-[var(--surface-raised)] py-5 pl-[3.25rem] pr-5 transition-[border-color,background-color,box-shadow] duration-500 motion-reduce:transition-none sm:py-6 sm:pl-[4rem] sm:pr-6 ${active ? 'border-[var(--gold-text)]/55 shadow-[0_12px_30px_rgba(15,27,51,0.06)]' : 'border-[var(--border)]'}`}>
                <span aria-hidden="true" className={`absolute left-0 top-5 flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-semibold tracking-[0.08em] sm:h-8 sm:w-8 ${active ? 'border-[var(--gold-text)] bg-[var(--navy-900)] text-white' : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink-muted)]'}`}>
                  {value.number}
                </span>
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}
