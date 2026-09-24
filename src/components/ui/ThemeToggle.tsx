'use client';

import { useCallback, useEffect, useState, type JSX } from 'react';
import { Moon, Sun } from '@phosphor-icons/react/dist/ssr';
import {
  applyTheme,
  readStoredPreference,
  resolveTheme,
  storePreference,
  watchSystemTheme,
  type Theme,
} from '@/lib/theme';
import { hoverTransitionStyle } from '@/lib/motion';
import { cn } from '@/lib/cn';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Switches between the light and dark palettes.
 *
 * A real <button> with `aria-pressed`, not a styled checkbox and not a
 * decorative switch: pressed means dark is on. The label is a full sentence
 * for assistive technology and the icon carries it visually, so the control is
 * legible both ways. 44px square, which is the touch-target floor in
 * DESIGN.md §6, and the focus ring comes from the global `:focus-visible` rule
 * in globals.css rather than being redefined here.
 *
 * Two things are deliberately split apart:
 *
 *  - The ICON is chosen by CSS, keyed off the same `data-theme` attribute and
 *    `prefers-color-scheme` query that pick the palette. It is therefore
 *    correct in the server-rendered HTML and correct on the first paint, with
 *    no JavaScript involved and no flash of the wrong glyph.
 *  - `aria-pressed` cannot work that way, because there is no CSS that writes
 *    an attribute. It starts false, matching the server render so hydration
 *    has nothing to disagree about, and is corrected in the first effect. The
 *    window where it is briefly wrong is one frame and closes before any
 *    assistive technology reads the tree.
 *
 * Flipping the toggle stores an explicit choice. Until that happens the page
 * tracks the operating system live, so a reader who never touches this control
 * still gets their system palette, including when they change it mid-visit.
 */
export default function ThemeToggle({ className }: ThemeToggleProps): JSX.Element {
  const [theme, setTheme] = useState<Theme>('light');
  const [hasExplicitChoice, setHasExplicitChoice] = useState(false);

  useEffect(() => {
    const preference = readStoredPreference();
    setHasExplicitChoice(preference !== 'system');
    setTheme(resolveTheme(preference));
  }, []);

  // While no explicit choice exists, the operating system is the source of
  // truth and can change under us. The CSS already follows it; this keeps the
  // button's own state in step so its label does not go stale.
  useEffect(() => {
    if (hasExplicitChoice) return;
    return watchSystemTheme(setTheme);
  }, [hasExplicitChoice]);

  const handleClick = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storePreference(next);
      setHasExplicitChoice(true);
      return next;
    });
  }, []);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isDark}
      // Names the control and its state in one phrase, so a screen reader
      // announces "Dark mode, toggle button, pressed" rather than leaving the
      // reader to infer what the icon meant.
      aria-label="Dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-[6px] outline-none transition-colors',
        'text-[var(--ink)] hover:bg-[var(--surface-band-raised)]',
        className
      )}
      style={hoverTransitionStyle}
    >
      {/* Both glyphs ship; CSS shows one. `theme-icon-light` is visible while
          the light palette is active and hidden while the dark one is, and
          `theme-icon-dark` is the mirror of it. The rules live in globals.css
          next to the palette they track, so the two cannot drift apart. */}
      <Sun size={20} weight="regular" aria-hidden="true" className="theme-icon-light" />
      <Moon size={20} weight="regular" aria-hidden="true" className="theme-icon-dark" />
    </button>
  );
}
