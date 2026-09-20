/**
 * Visually hidden until focused, then jumps keyboard/screen-reader users
 * straight to `#main` (the landmark `src/app/layout.tsx` is expected to put
 * on the page's `<main>`). Positioned off-screen via `transform` only (never
 * `display:none`), so it stays in the focus order and its own motion
 * (translate on focus) obeys DESIGN.md §4's "transform/opacity only" rule.
 *
 * No explicit focus-ring class: this sits on the light `--surface`
 * background, which is exactly what globals.css's global `:focus-visible`
 * rule (steel-600) already targets by default.
 */
import type { JSX } from 'react';
export default function SkipLink(): JSX.Element {
  return (
    <a
      href="#main"
      className="fixed left-4 top-4 z-[--z-toast] -translate-y-[calc(100%+1rem)] bg-[--surface] px-4 py-3 text-sm font-medium text-[--ink] outline-none transition-transform focus:translate-y-0"
      style={{
        transitionDuration: 'var(--dur-fast)',
        transitionTimingFunction: 'var(--ease-out-quart)',
      }}
    >
      Skip to main content
    </a>
  );
}
