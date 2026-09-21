'use client';

import { type JSX, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, X } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { hoverTransitionStyle, stateTransitionStyle } from '@/lib/motion';
import { navItems, ctaItem } from '@/content/nav';
import ThemeToggle from '@/components/ui/ThemeToggle';

const SCROLL_THRESHOLD_PX = 80;

/**
 * A nav item is "active" if its route matches the current pathname. Hash
 * targets (e.g. `/#industries`) are homepage-section links, not separate
 * routes, so they're matched against the path with the hash stripped.
 */
function isActiveRoute(pathname: string, href: string): boolean {
  const path = href.split('#')[0] || '/';
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

// The header carries a solid --navy-800 background on every route, so its
// white nav text is readable regardless of what the page beneath it renders.
// See the className below for why the originally specified transparent-over-
// hero treatment was dropped.
//
// Focus-ring colour is NOT set here: globals.css defines a global
// `:focus-visible` rule (steel-600) plus a `[data-tone='navy']
// :focus-visible` override (steel-400), written unlayered so it beats any
// Tailwind utility regardless of specificity. Marking this header
// `data-tone="navy"` below is what wires every focusable element inside it
// into that lighter ring automatically, no per-element focus class needed.

export default function Header(): JSX.Element {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  // Close the sheet on route change (e.g. a link was activated some other
  // way, like browser back/forward) so it never survives a navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Focus trap + Esc-to-close + body scroll lock, scoped to the open sheet.
  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== 'Tab' || !sheetRef.current) return;

      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen, closeMenu]);

  return (
    <header
      data-tone="navy"
      className={cn(
        // Solid navy at every scroll position, and `sticky` rather than `fixed`.
        // Transparency was the original intent (DESIGN.md §4), but it only reads
        // correctly above a navy hero: on /privacy, /terms and /404 the nav is
        // white-on-off-white and vanishes until the reader scrolls 80px. Since
        // the hero band is itself --navy-800, a solid navy header is visually
        // identical there anyway, so the effect costs nothing and the failure
        // mode disappears. Only the hairline animates on scroll.
        // `sticky` keeps the header in flow, so <main> needs no compensating
        // top padding and content can never slide underneath it.
        'sticky top-0 z-[var(--z-sticky)] border-b bg-[var(--navy-800)] transition-[border-color]',
        scrolled ? 'border-[var(--border-navy)]' : 'border-transparent'
      )}
      style={stateTransitionStyle}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1200px] items-center justify-between px-[clamp(1.25rem,5vw,4rem)]">
        <Link
          href="/"
          aria-label="AscendRev home"
          className="flex min-h-11 items-center outline-none"
        >
          {/* This is the transparent holding-page asset, preserving the white
              interior details of the supplied shield logo. */}
          <span className="relative isolate inline-flex items-center justify-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-5 -z-10 rounded-full blur-[16px]"
              style={{
                background:
                  'radial-gradient(ellipse 62% 78% at 50% 50%, rgba(255,255,255,.92) 0%, rgba(255,255,255,.48) 42%, rgba(255,255,255,0) 82%)',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- static export
                keeps the logo free of an image-optimizer dependency. */}
            <img
              src="/ascendrev-logo.png"
              alt="AscendRev"
              width={120}
              height={52}
              className="h-12 w-auto object-contain md:h-14"
            />
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center text-sm text-white outline-none transition-colors',
                  active ? 'font-semibold' : 'font-medium'
                )}
                style={hoverTransitionStyle}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href={ctaItem.href}
            className="inline-flex min-h-11 items-center justify-center rounded-[6px] bg-[var(--green-600)] px-5 text-sm font-medium text-white outline-none transition-colors hover:bg-[var(--green-500)] active:scale-[0.98] active:bg-[var(--green-700)]"
            style={hoverTransitionStyle}
          >
            {ctaItem.label}
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-sheet"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center text-white outline-none transition-colors hover:bg-white/10 active:scale-[0.98] md:hidden"
            style={hoverTransitionStyle}
          >
            {menuOpen ? <X size={24} weight="regular" /> : <List size={24} weight="regular" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav-sheet"
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className="fixed inset-x-0 bottom-0 top-20 z-[var(--z-modal)] flex min-h-0 flex-col bg-[var(--navy-800)] px-[clamp(1.25rem,5vw,4rem)] pb-6 pt-5 md:hidden"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-navy)] pb-4">
            <p className="text-sm font-medium text-[var(--steel-400)]">Navigation</p>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeMenu}
              className="inline-flex h-11 w-11 items-center justify-center text-white outline-none transition-colors hover:bg-white/10 active:scale-[0.98]"
              aria-label="Close navigation"
              style={hoverTransitionStyle}
            >
              <X size={24} weight="regular" />
            </button>
          </div>

          <nav aria-label="Mobile primary" className="flex flex-1 flex-col gap-2 py-5">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={closeMenu}
                  className={cn(
                    'inline-flex min-h-11 items-center text-2xl text-white outline-none',
                    active ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href={ctaItem.href}
            onClick={closeMenu}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[6px] bg-[var(--green-600)] px-5 py-3 text-center text-sm font-medium text-white outline-none transition-colors hover:bg-[var(--green-500)] active:scale-[0.98] active:bg-[var(--green-700)]"
            style={hoverTransitionStyle}
          >
            {ctaItem.label}
          </Link>
        </div>
      )}
    </header>
  );
}
