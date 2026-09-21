/**
 * Theme resolution for the class-based (attribute-based) dark mode.
 *
 * Two independent mechanisms decide what the reader sees, and they are
 * deliberately layered so that the slower one is never load-bearing:
 *
 *  1. CSS alone (globals.css). `@media (prefers-color-scheme: dark)` is
 *     scoped to `:root:not([data-theme='light'])`, so a first-time visitor
 *     whose OS is dark gets the dark palette with no JavaScript at all, and
 *     therefore with no possible flash. This is the default path.
 *  2. This module. It only exists to honour an *explicit* choice the reader
 *     made earlier, which by definition disagrees with the OS setting.
 *     THEME_INIT_SCRIPT writes `data-theme` in <head> before first paint;
 *     ThemeToggle writes it again when the reader flips the switch.
 *
 * Because (1) covers the common case, (2) can stay tiny: the inline script
 * sets the attribute only when a valid explicit choice is stored, and does
 * nothing otherwise.
 *
 * Every localStorage access is wrapped: a private window, blocked site data,
 * or a full quota makes the accessor itself throw, not merely return null.
 */

export type Theme = 'light' | 'dark';

/**
 * What the reader chose. 'system' means "no explicit choice", which is the
 * initial state and the state after a reset. It is not a third palette.
 */
export type ThemePreference = Theme | 'system';

/** localStorage key. Namespaced so it cannot collide on a shared origin. */
export const THEME_STORAGE_KEY = 'ascendrev-theme';

/** Attribute written on <html>. Matches the selectors in globals.css. */
export const THEME_ATTRIBUTE = 'data-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * Fail closed on anything unrecognised: a stored value that is not exactly
 * 'light' or 'dark' is treated as no choice at all, never coerced into one.
 */
function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/** The reader's stored choice, or 'system' if there is none or it is unreadable. */
export function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Persist an explicit choice, or clear it when returning to 'system'.
 * Returns nothing: a failed write is not an error the reader can act on, and
 * the theme still applies for this page view either way.
 */
export function storePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // Private window, blocked storage, or quota exceeded. The choice applies
    // to this page view regardless; it just will not survive a reload.
  }
}

/** What the operating system is currently asking for. */
export function readSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/** The palette actually in effect: the explicit choice if there is one, else the OS. */
export function resolveTheme(preference: ThemePreference): Theme {
  return preference === 'system' ? readSystemTheme() : preference;
}

/**
 * Write the attribute that globals.css keys off.
 *
 * Removing the attribute for 'system' is the point rather than an
 * optimisation: with no attribute present, `:root:not([data-theme='light'])`
 * matches and the media query takes over again, so the page starts tracking
 * the OS live instead of freezing at whatever it happened to be.
 */
export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') {
    root.removeAttribute(THEME_ATTRIBUTE);
  } else {
    root.setAttribute(THEME_ATTRIBUTE, preference);
  }
}

/** Subscribe to OS theme changes. Returns an unsubscribe function. */
export function watchSystemTheme(onChange: (theme: Theme) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const query = window.matchMedia(DARK_QUERY);
  const handler = (event: MediaQueryListEvent) => onChange(event.matches ? 'dark' : 'light');
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}

/**
 * The blocking <head> script, as source text.
 *
 * Deliberately blocking and deliberately tiny. It runs before first paint so
 * a reader who chose dark on a light machine never sees a white flash. It
 * writes the attribute only for an explicit stored choice, because the
 * no-choice case is already handled by the media query in CSS.
 *
 * Kept as a single statement with no external references so it survives
 * minification and needs no separate request. Written with the literal key
 * rather than an interpolated constant so the string is auditable on sight;
 * the test in this module's consumers pins the two together.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("${THEME_ATTRIBUTE}",t)}}catch(e){}`;
