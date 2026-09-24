import type { JSX, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionProps {
  children: ReactNode;
  /** 'light' = --bg page surface. 'navy' = white-primary feature band.
   * The legacy tone name also selects the band focus-ring token. */
  tone?: 'light' | 'navy';
  /** 'large' = hero / closing-band rhythm with phone-first vertical spacing.
   * 'default' = standard section rhythm with a tighter phone measure. */
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
      // globals.css uses this tone key to select the band focus-ring token.
      // Set it on every section so the focus style stays consistent.
      data-tone={tone}
      className={cn(
        'w-full',
        size === 'large'
          ? 'py-[var(--section-space-large,clamp(4.25rem,12vw,10rem))]'
          : 'py-[var(--section-space,clamp(3.5rem,8vw,8rem))]',
        tone === 'navy'
          ? 'bg-[var(--surface-band)] text-[var(--text-on-band)]'
          : 'bg-[var(--bg)] text-[var(--ink)]',
        className
      )}
    >
      {children}
    </section>
  );
}
