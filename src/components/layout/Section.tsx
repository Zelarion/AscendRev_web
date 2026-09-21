import type { JSX, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionProps {
  children: ReactNode;
  /** 'light' = --bg off-white band. 'navy' = full-bleed --navy-800 band.
   * This prop is how the page alternates bands per DESIGN.md §1, it is
   * the only place band colour is decided. */
  tone?: 'light' | 'navy';
  /** 'large' = hero / closing-band rhythm (clamp(7rem,14vw,11rem)).
   * 'default' = standard section rhythm (clamp(5rem,10vw,8rem)). */
  size?: 'default' | 'large';
  id?: string;
  className?: string;
}

export default function Section({
  children,
  tone = 'light',
  size = 'default',
  id,
  className,
}: SectionProps): JSX.Element {
  return (
    <section
      id={id}
      // globals.css keys its "light ring on navy surfaces" focus-visible
      // override off this exact attribute, see the accessibility-floor
      // comment there. Set unconditionally (not just for tone="navy") so
      // the contract is visible on every Section instance, not just the
      // navy ones.
      data-tone={tone}
      className={cn(
        'w-full',
        size === 'large' ? 'py-[clamp(7rem,14vw,11rem)]' : 'py-[clamp(5rem,10vw,8rem)]',
        tone === 'navy' ? 'bg-[var(--navy-800)] text-white' : 'bg-[var(--bg)] text-[var(--ink)]',
        className
      )}
    >
      {children}
    </section>
  );
}
