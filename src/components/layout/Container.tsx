import type { JSX, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * The page's horizontal measure: max-w-[1200px], centred, with the
 * responsive gutter from DESIGN.md §3 (`clamp(1.25rem, 5vw, 4rem)`).
 * Full-bleed navy bands (Section tone="navy") wrap a Container rather than
 * being one, so the band's background spans the viewport while its content
 * still lines up with everything else.
 */
export default function Container({ children, className }: ContainerProps): JSX.Element {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-[clamp(1.25rem,5vw,4rem)]', className)}>
      {children}
    </div>
  );
}
