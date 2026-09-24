import type { JSX } from 'react';
import { cn } from '@/lib/cn';

/**
 * The three accents this page cycles a glyph through. Tied to the site's
 * existing semantic tokens (`--green-600`, `--steel-600`, `--gold-500`) so
 * the icons stay correct in dark mode without their own overrides.
 */
export type GlyphAccent = 'green' | 'blue' | 'gold';

const ACCENT_TEXT_COLOR: Record<GlyphAccent, string> = {
  green: 'text-[var(--green-600)]',
  blue: 'text-[var(--steel-600)]',
  gold: 'text-[var(--gold-500)]',
};

/** Cycle order callers map an item's index through, so nine or six items in
 * a row never repeat the same accent twice in succession. */
export const GLYPH_ACCENT_CYCLE: readonly GlyphAccent[] = ['green', 'blue', 'gold'];

interface GlyphIconProps {
  glyph: string;
  accent: GlyphAccent;
  className?: string;
}

/**
 * A subtle line-glyph inside a small geometric container: 1px hairline
 * border, muted fill, the glyph itself carrying the only colour. Used for
 * both the nine-service grid and the six screening steps, the two places on
 * this page that need "icon plus label, nothing else."
 *
 * `aria-hidden`: the glyph is decorative. The sibling label text is the
 * accessible name for the entry, same as before this icon existed.
 */
export default function GlyphIcon({ glyph, accent, className }: GlyphIconProps): JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-base leading-none',
        ACCENT_TEXT_COLOR[accent],
        className
      )}
    >
      {glyph}
    </span>
  );
}
