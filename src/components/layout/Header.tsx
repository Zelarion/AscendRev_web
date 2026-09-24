'use client';

import { type JSX, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, List, X } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { hoverTransitionStyle } from '@/lib/motion';
import { navItems, ctaItem } from '@/content/nav';
import ThemeToggle from '@/components/ui/ThemeToggle';

const SCROLL_FLOAT_ENTER_PX = 220;
const SCROLL_FLOAT_EXIT_PX = 90;

function isActiveRoute(pathname: string, href: string): boolean {
  if (href.includes('#')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header(): JSX.Element {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled((current) => {
        if (current) return y > SCROLL_FLOAT_EXIT_PX;
        return y > SCROLL_FLOAT_ENTER_PX;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!focusable.length) return;

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
        'fixed inset-x-0 top-0 isolate z-[1000] w-full transition-[padding] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
        scrolled ? 'px-3 pt-3 sm:px-5 sm:pt-4 lg:px-7' : 'px-0 pt-0'
      )}
    >
      <div
        className={cn(
          'ar-nav-shell mx-auto flex h-[88px] w-full items-center justify-between border px-4 backdrop-blur-[22px] sm:h-[100px] sm:px-6 lg:px-8 xl:px-10',
          'transition-[max-width,border-radius,background-color,border-color,box-shadow] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          scrolled
            ? 'max-w-[1540px] rounded-[18px] border-white/14 bg-[var(--nav-glass-scrolled)] shadow-[0_18px_55px_rgba(0,0,0,0.24)]'
            : 'max-w-[100vw] rounded-none border-x-transparent border-t-transparent border-b-white/10 bg-[var(--nav-glass)] shadow-[0_8px_28px_rgba(0,0,0,0.12)]'
        )}
      >
        <Link
          href="/"
          aria-label="AscendRev home"
          className="ar-nav-item inline-flex min-h-11 shrink-0 items-center outline-none"
          style={{ animationDelay: '90ms' }}
        >
          <span className="relative isolate inline-flex items-center justify-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-5 -inset-y-3 -z-10 rounded-full blur-[12px]"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.28) 42%, rgba(255,255,255,0.08) 66%, rgba(255,255,255,0) 82%)',
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- static export keeps the logo self-contained. */}
            <img
              src="/ascendrev-logo.png"
              alt="AscendRev"
              width={206}
              height={68}
              className="h-[60px] w-auto object-contain sm:h-[70px] lg:h-[78px]"
            />
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 xl:flex xl:gap-7 2xl:gap-9">
          {navItems.map((item, index) => {
            const active = isActiveRoute(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="ar-nav-item relative inline-flex min-h-11 items-center px-1 text-[15px] font-medium text-white/94 outline-none transition-colors after:absolute after:bottom-[7px] after:left-1/2 after:h-px after:w-0 after:bg-[var(--gold-400)] after:transition-all after:duration-300 hover:text-white hover:after:left-0 hover:after:w-full xl:text-base"
                style={{ ...hoverTransitionStyle, animationDelay: `${160 + index * 70}ms` }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 xl:flex xl:gap-5">
          <div className="ar-nav-item" style={{ animationDelay: '470ms' }}>
            <ThemeToggle className="rounded-full text-white/95 hover:bg-white/8" />
          </div>
          <Link
            href={ctaItem.href}
            className="ar-nav-item group inline-flex min-h-12 min-w-[255px] items-center justify-center gap-4 rounded-[9px] border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-7 text-[15px] font-semibold text-[var(--gold-ink)] shadow-[0_8px_24px_rgba(197,151,49,0.22)] outline-none transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(197,151,49,0.32)] hover:brightness-105 active:translate-y-0 xl:min-w-[285px] xl:text-base"
            style={{ animationDelay: '540ms' }}
          >
            <span>{ctaItem.label}</span>
            <ArrowRight
              size={20}
              weight="regular"
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="flex items-center gap-1 xl:hidden">
          <ThemeToggle className="rounded-full text-white/95 hover:bg-white/8" />
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-sheet"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-white outline-none transition-colors hover:bg-white/10 active:scale-[0.98]"
            style={hoverTransitionStyle}
          >
            <List
              size={24}
              weight="regular"
              className={cn(
                'absolute transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                menuOpen ? '-rotate-12 scale-90 opacity-0' : 'rotate-0 scale-100 opacity-100'
              )}
            />
            <X
              size={24}
              weight="regular"
              className={cn(
                'absolute transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                menuOpen ? 'rotate-0 scale-100 opacity-100' : 'rotate-12 scale-90 opacity-0'
              )}
            />
          </button>
        </div>
      </div>

      <div
        aria-hidden={!menuOpen}
        className={cn(
          'fixed inset-0 z-[1080] bg-black/40 backdrop-blur-[1px] transition-opacity duration-500 ease-out xl:hidden',
          menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={closeMenu}
      />

      <div
        id="mobile-nav-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal={menuOpen ? 'true' : undefined}
        aria-hidden={!menuOpen}
        aria-label="Mobile navigation"
        className={cn(
          'fixed inset-y-0 right-0 z-[1100] flex min-h-0 w-[calc(100%-0.75rem)] max-w-[620px] flex-col overflow-hidden border-l border-white/10 bg-[var(--nav-glass-scrolled)] px-5 pb-6 pt-5 shadow-[-18px_0_55px_rgba(0,0,0,0.32)] backdrop-blur-[24px] sm:w-[88vw] sm:px-7 sm:pb-7 sm:pt-6 md:w-[78vw] xl:hidden',
          'transition-[transform,opacity] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
          menuOpen
            ? 'pointer-events-auto translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-full opacity-100'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between border-b border-white/10 pb-4 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none',
            menuOpen ? 'translate-x-0 opacity-100 delay-150' : 'translate-x-3 opacity-0 delay-0'
          )}
        >
          <p className="text-sm font-medium tracking-[0.16em] text-white/55 uppercase">Navigation</p>
          <button
            ref={closeButtonRef}
            type="button"
            tabIndex={menuOpen ? 0 : -1}
            onClick={closeMenu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white outline-none transition-colors hover:bg-white/10 active:scale-[0.98]"
            aria-label="Close navigation"
            style={hoverTransitionStyle}
          >
            <X size={24} weight="regular" />
          </button>
        </div>

        <nav aria-label="Mobile primary" className="flex flex-1 flex-col justify-center gap-2 py-6">
          {navItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={menuOpen ? 0 : -1}
              onClick={closeMenu}
              className={cn(
                'inline-flex min-h-12 items-center border-b border-white/8 py-3 font-display text-[clamp(1.9rem,8vw,3rem)] font-medium leading-none text-white outline-none transition-[color,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[var(--gold-300)] motion-reduce:transition-none',
                menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0'
              )}
              style={{ transitionDelay: menuOpen ? `${210 + index * 70}ms` : '0ms' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={ctaItem.href}
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
          className={cn(
            'group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-[9px] border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 text-center text-sm font-semibold text-[var(--gold-ink)] outline-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          )}
          style={{ transitionDelay: menuOpen ? `${250 + navItems.length * 70}ms` : '0ms' }}
        >
          <span>{ctaItem.label}</span>
          <ArrowRight size={19} weight="regular" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
