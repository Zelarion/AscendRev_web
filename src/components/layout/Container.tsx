import type { JSX, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * The page's horizontal measure: max-w-[1200px], centred, using the shared
 * responsive `--site-gutter` token. Its fallback keeps the component safe in
 * isolated previews that do not load the site's global design tokens.
 * Full-bleed navy bands (Section tone="navy") wrap a Container rather than
 * being one, so the band's background spans the viewport while its content
 * still lines up with everything else.
 */
export default function Container({ children, className }: ContainerProps): JSX.Element {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1200px] px-[var(--site-gutter,clamp(1.25rem,5vw,4rem))]',
        className
      )}
    >
      {children}
    </div>
  );
}
