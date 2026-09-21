import type { JSX } from 'react';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

/**
 * The no-flash theme script, for the document <head>.
 *
 * Render this as the first child of `<head>` in src/app/layout.tsx:
 *
 *   <html lang="en-CA" suppressHydrationWarning …>
 *     <head>
 *       <ThemeScript />
 *     </head>
 *
 * It is a small blocking script by design. It has to run before the first
 * paint or the reader sees a frame of the wrong palette, and there is no
 * asynchronous way to be earlier than paint. The cost is a few dozen bytes
 * parsed inline, with no request, which is cheaper than the reflow a flash
 * would cause.
 *
 * `suppressHydrationWarning` belongs on <html> because this script mutates
 * that element's attributes before React hydrates, which React would
 * otherwise report as server and client disagreeing.
 *
 * Note what this does NOT do. It does not decide the theme for a first-time
 * visitor: globals.css already answers `prefers-color-scheme` on its own, so
 * a reader who has never touched the toggle gets the right palette with no
 * JavaScript at all. This script exists only to reapply an explicit choice the
 * reader made on a previous visit, which is the one case CSS cannot know
 * about.
 *
 * `dangerouslySetInnerHTML` is the documented way to emit an inline script in
 * React and is safe here for the reason the name warns about: the content is a
 * compile-time constant from src/lib/theme.ts with no interpolation of
 * anything a request, a URL, or a reader can influence.
 */
export default function ThemeScript(): JSX.Element {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
