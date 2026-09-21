import type { JSX } from 'react';
import { cn } from '@/lib/cn';

interface ImagePlaceholderProps {
  label: string;
  /** CSS aspect-ratio value, e.g. '16 / 9' or '4 / 5'. */
  ratio?: string;
  minWidth?: number;
  className?: string;
}

/**
 * Every unsupplied image slot renders this instead of a grey box, per
 * SPEC.md §5: bordered, dashed, and stating in visible text exactly what
 * belongs there, at what aspect ratio, and at what minimum resolution, so
 * an unfilled slot is impossible to miss in review.
 *
 * `data-image-placeholder` is a required, literal attribute: SPEC.md §9
 * gate 2 greps the production build output for this exact string and fails
 * the build if it's still present. Do not rename or remove it.
 */
export default function ImagePlaceholder({
  label,
  ratio = '16 / 9',
  minWidth,
  className,
}: ImagePlaceholderProps): JSX.Element {
  return (
    <div
      data-image-placeholder
      role="img"
      aria-label={`Image placeholder: ${label}`}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-[var(--ink-muted)]',
        className
      )}
      style={{ aspectRatio: ratio }}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className="font-mono text-[0.75rem] uppercase leading-[1.4] tracking-[0.06em]">
        Ratio {ratio}
        {minWidth ? `, min ${minWidth}px wide` : ''}
      </p>
    </div>
  );
}
