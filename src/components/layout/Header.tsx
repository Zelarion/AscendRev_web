'use client';

import { Fragment, type JSX, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, CaretDown, List, X } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { hoverTransitionStyle } from '@/lib/motion';
import { navItems, ctaItem } from '@/content/nav';

const SCROLL_FLOAT_ENTER_PX = 220;
const SCROLL_FLOAT_EXIT_PX = 90;
const REVENUE_IMPACT_HREF = '/#revenue-impact';
const SOLUTIONS_HREFS = new Set(['/solutions/', '/capabilities/', REVENUE_IMPACT_HREF]);
const solutionNavItems = navItems.filter((item) => SOLUTIONS_HREFS.has(item.href));
const primaryDesktopNavItems = navItems.filter((item) => !SOLUTIONS_HREFS.has(item.href));
const desktopNavItemClass = 'ar-nav-item relative inline-flex min-h-11 items-center whitespace-nowrap px-1 text-[12px] font-medium text-white/95 outline-none transition-colors after:absolute after:bottom-[4px] after:left-1/2 after:h-px after:w-0 after:bg-[var(--gold-400)] after:transition-all after:duration-300 hover:text-[var(--gold-300)] hover:after:left-0 hover:after:w-full wide-nav:text-[12px] xl:wide-nav:text-[14px]';

function isActiveRoute(pathname: string, href: string): boolean {
  if (href.includes('#')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header(): JSX.Element {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState('');
  const [storyNavHidden, setStoryNavHidden] = useState(false);
  const [footerNavHidden, setFooterNavHidden] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const solutionsButtonRef = useRef<HTMLButtonElement>(null);
  const solutionsMenuRef = useRef<HTMLDivElement>(null);
  const solutionsCloseTimerRef = useRef<number | null>(null);
  const solutionsPointerInsideRef = useRef(false);
  const solutionsOpenSourceRef = useRef<'hover' | 'focus' | 'keyboard' | 'click' | null>(null);
  const suppressSolutionsFocusOpenRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastScrollYRef = useRef(0);
  const firstScrollCheckRef = useRef(true);
  const storyNavHiddenRef = useRef(false);
  const footerNavHiddenRef = useRef(false);

  const handleHomeLinkClick = (event: ReactMouseEvent<HTMLAnchorElement>): void => {
    if (pathname !== '/') return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setMenuOpen(false);
    closeSolutionsMenu();
    window.dispatchEvent(new Event('ascendrev:scroll-to-top'));
  };

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const movingDown = !firstScrollCheckRef.current && y > lastScrollYRef.current;
      const movingUp = !firstScrollCheckRef.current && y < lastScrollYRef.current;
      const story = document.querySelector<HTMLElement>('[data-office-story]');
      const storyRect = story?.getBoundingClientRect();
      const inStory = Boolean(
        storyRect && storyRect.top < window.innerHeight && storyRect.bottom > 0
      );
      const footer = document.querySelector<HTMLElement>('[data-site-footer]');
      const footerRect = footer?.getBoundingClientRect();
      const inFooter = Boolean(
        footerRect && footerRect.top < window.innerHeight && footerRect.bottom > 0
      );

      let hideForFooter = footerNavHiddenRef.current;
      if (!inFooter || menuOpen) hideForFooter = false;
      else if (movingDown) hideForFooter = true;
      else if (movingUp) hideForFooter = false;

      let hideForStory = storyNavHiddenRef.current;
      if (!inStory || menuOpen) {
        hideForStory = false;
      } else if (storyRect) {
        if (y > lastScrollYRef.current) hideForStory = true;
        else if (y < lastScrollYRef.current) hideForStory = false;
        else if (firstScrollCheckRef.current && storyRect.top <= 0) hideForStory = true;
      }

      if ((hideForStory || hideForFooter) && headerRef.current?.contains(document.activeElement)) {
        const focusedItem = document.activeElement;
        if (focusedItem instanceof HTMLElement) focusedItem.blur();
      }
      storyNavHiddenRef.current = hideForStory;
      footerNavHiddenRef.current = hideForFooter;
      setStoryNavHidden(hideForStory);
      setFooterNavHidden(hideForFooter);
      lastScrollYRef.current = y;
      firstScrollCheckRef.current = false;

      setScrolled((current) => {
        if (current) return y > SCROLL_FLOAT_EXIT_PX;
        return y > SCROLL_FLOAT_ENTER_PX;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuOpen]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }, []);

  const closeSolutionsMenu = useCallback((restoreFocus = false) => {
    if (solutionsCloseTimerRef.current) {
      window.clearTimeout(solutionsCloseTimerRef.current);
      solutionsCloseTimerRef.current = null;
    }
    setSolutionsOpen(false);
    solutionsOpenSourceRef.current = null;
    if (restoreFocus && document.activeElement !== solutionsButtonRef.current) {
      suppressSolutionsFocusOpenRef.current = true;
      solutionsButtonRef.current?.focus();
      window.requestAnimationFrame(() => {
        suppressSolutionsFocusOpenRef.current = false;
      });
    }
  }, []);

  const openSolutionsMenu = useCallback((source: 'hover' | 'focus' | 'keyboard' | 'click') => {
    if (solutionsCloseTimerRef.current) {
      window.clearTimeout(solutionsCloseTimerRef.current);
      solutionsCloseTimerRef.current = null;
    }
    solutionsOpenSourceRef.current = source;
    setSolutionsOpen(true);
  }, []);

  const scheduleSolutionsClose = useCallback(() => {
    if (solutionsCloseTimerRef.current) window.clearTimeout(solutionsCloseTimerRef.current);
    solutionsCloseTimerRef.current = window.setTimeout(() => {
      solutionsCloseTimerRef.current = null;
      const focusInside = Boolean(solutionsMenuRef.current?.contains(document.activeElement));
      if (solutionsPointerInsideRef.current || focusInside) return;
      setSolutionsOpen(false);
      solutionsOpenSourceRef.current = null;
    }, 140);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    closeSolutionsMenu();
    setCurrentHash(window.location.hash);
  }, [pathname, closeSolutionsMenu]);

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => () => {
    if (solutionsCloseTimerRef.current) window.clearTimeout(solutionsCloseTimerRef.current);
  }, []);

  const isSolutionItemActive = useCallback((href: string) => {
    if (href === REVENUE_IMPACT_HREF) return pathname === '/' && currentHash === '#revenue-impact';
    return isActiveRoute(pathname, href);
  }, [currentHash, pathname]);
  const solutionsActive = solutionNavItems.some((item) => isSolutionItemActive(item.href));
  const headerHidden = storyNavHidden || footerNavHidden;

  useEffect(() => {
    if (!solutionsOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!solutionsMenuRef.current?.contains(event.target as Node)) {
        closeSolutionsMenu();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSolutionsMenu(true);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [solutionsOpen, closeSolutionsMenu]);

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
    <>
    <header
      ref={headerRef}
      data-tone="navy"
      data-office-nav-hidden={headerHidden ? 'true' : undefined}
      aria-hidden={headerHidden || undefined}
      inert={headerHidden}
      className={cn(
        'fixed inset-x-0 top-0 isolate z-[var(--z-nav)] w-full px-0 pt-0 transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
        headerHidden ? 'pointer-events-none -translate-y-[125%] opacity-0' : 'translate-y-0 opacity-100'
      )}
    >
      <div
        className={cn(
          'ar-nav-shell relative isolate mx-auto flex h-[var(--header-height)] w-full items-center justify-between border-b border-white/15 bg-transparent px-4 text-white backdrop-blur-[22px] sm:px-6 lg:px-8 xl:px-10',
          'transition-[background-color,border-color,box-shadow] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          scrolled
            ? 'shadow-[0_8px_28px_rgba(0,0,0,0.2)]'
            : 'shadow-none'
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#001c41]"
        >
          <picture className="block h-full w-full">
            <source media="(max-width: 31.999rem)" srcSet="/images/ascendrev-header-desktop.webp" />
            <source media="(min-width: 120rem)" srcSet="/images/ascendrev-header-background-desktop.webp" />
            <source media="(min-width: 44rem)" srcSet="/images/ascendrev-header-integrated-desktop.webp" />
            <source media="(min-width: 32rem)" srcSet="/images/ascendrev-header-tablet.webp" />
            <img
              src="/images/ascendrev-header-mobile.webp"
              alt=""
              width={2172}
              height={724}
              className="h-full w-full object-cover object-[50%_44%] min-[120rem]:object-[50%_47%]"
            />
          </picture>
        </div>
        {/* On large desktop screens, separate the wordmark from its background artwork
            so the logo remains proportional instead of scaling with the full banner. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- transparent client-supplied logo lockup overlays the desktop art. */}
        <img
          src="/ascendrev-loader-logo-transparent.png"
          alt=""
          aria-hidden="true"
          width={2172}
          height={724}
          className="pointer-events-none absolute left-[clamp(2rem,4vw,4.5rem)] top-1/2 z-10 hidden h-[var(--header-height)] w-[min(20vw,380px)] max-w-[380px] -translate-y-1/2 object-cover object-[50%_30%] min-[120rem]:block"
        />
        <Link
          href="/"
          onClick={handleHomeLinkClick}
          aria-label="AscendRev Outsourcing and Offshoring Solutions home"
          className="absolute inset-y-0 left-0 z-20 w-[47vw] max-w-[calc(100vw-5.5rem)] outline-none md:w-[38vw] md:max-w-none wide-nav:w-[30vw]"
        >
          <span className="sr-only">AscendRev home</span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[11.2vw] top-[68%] -translate-y-1/2 whitespace-nowrap font-sans text-[clamp(6px,1.8vw,7px)] font-semibold uppercase leading-none tracking-[0.05em] text-white min-[32rem]:hidden"
          >
            Outsourcing &amp; Offshoring Solutions
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden flex-nowrap items-center justify-between gap-x-2 wide-nav:ml-[29vw] wide-nav:mr-4 wide-nav:flex wide-nav:flex-1 wide-nav:min-w-0">
          {primaryDesktopNavItems.map((item, index) => (
            <Fragment key={item.href}>
              <Link
                href={item.href}
                onClick={item.href === '/' ? handleHomeLinkClick : undefined}
                aria-current={isActiveRoute(pathname, item.href) ? 'page' : undefined}
                className={desktopNavItemClass}
                style={{ ...hoverTransitionStyle, animationDelay: `${160 + index * 70}ms` }}
              >
                {item.label}
              </Link>
              {item.href === '/' && (
                <div
                  ref={solutionsMenuRef}
                  className="relative flex shrink-0 items-center"
                  onPointerEnter={(event) => {
                    if (event.pointerType !== 'touch') {
                      solutionsPointerInsideRef.current = true;
                      openSolutionsMenu('hover');
                    }
                  }}
                  onPointerLeave={(event) => {
                    if (event.pointerType !== 'touch') {
                      solutionsPointerInsideRef.current = false;
                      scheduleSolutionsClose();
                    }
                  }}
                  onFocus={(event) => {
                    const previousFocused = event.relatedTarget;
                    if (previousFocused instanceof Node && event.currentTarget.contains(previousFocused)) return;
                    if (suppressSolutionsFocusOpenRef.current) {
                      suppressSolutionsFocusOpenRef.current = false;
                      return;
                    }
                    openSolutionsMenu('focus');
                  }}
                  onBlur={(event) => {
                    const nextFocused = event.relatedTarget;
                    if (!(nextFocused instanceof Node) || !event.currentTarget.contains(nextFocused)) scheduleSolutionsClose();
                  }}
                >
                  <button
                    ref={solutionsButtonRef}
                    type="button"
                    aria-expanded={solutionsOpen}
                    aria-controls="desktop-solutions-links"
                    aria-label={solutionsActive ? 'Solutions, current section' : 'Solutions'}
                    onClick={() => {
                      if (solutionsOpen && solutionsOpenSourceRef.current === 'click') closeSolutionsMenu();
                      else openSolutionsMenu('click');
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
                      event.preventDefault();
                      const targetDirection = event.key === 'ArrowUp' ? 'last' : 'first';
                      openSolutionsMenu('keyboard');
                      window.setTimeout(() => {
                        window.requestAnimationFrame(() => {
                          window.requestAnimationFrame(() => {
                            const panel = document.getElementById('desktop-solutions-links');
                            if (!panel || panel.getAttribute('aria-hidden') === 'true' || panel.hasAttribute('inert')) return;
                            const links = panel.querySelectorAll<HTMLAnchorElement>('a[href]');
                            const target = targetDirection === 'last' ? links[links.length - 1] : links[0];
                            target?.focus();
                          });
                        });
                      }, 0);
                    }}
                    data-active={solutionsActive || undefined}
                    className={cn(
                      desktopNavItemClass,
                      (solutionsOpen || solutionsActive) && 'text-[var(--gold-300)] after:left-0 after:w-full',
                      'focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--gold-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-800)]'
                    )}
                  >
                    <span>SOLUTIONS</span>
                    <CaretDown
                      size={14}
                      weight="bold"
                      aria-hidden="true"
                      className={cn('transition-transform duration-200 motion-reduce:transition-none', solutionsOpen && 'rotate-180')}
                    />
                  </button>
                  <div
                    id="desktop-solutions-links"
                    aria-hidden={!solutionsOpen}
                    inert={!solutionsOpen}
                    className={cn(
                      'absolute left-0 top-full z-[var(--z-dropdown)] w-[min(22rem,84vw)] pt-2 transition-[opacity,transform,visibility] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                      solutionsOpen
                        ? 'visible translate-y-0 scale-100 opacity-100'
                        : 'invisible translate-y-1 scale-[0.985] opacity-0'
                    )}
                  >
                    <nav aria-label="Solutions links" className="flex flex-col gap-1 rounded-xl border border-[var(--border)] border-t-2 border-t-[var(--gold-400)] bg-white p-2 text-[var(--navy-900)] shadow-[0_16px_38px_rgba(15,27,51,0.2)]">
                      {solutionNavItems.map((solutionItem) => {
                        const active = isSolutionItemActive(solutionItem.href);
                        const solutionClassName = cn(
                          'group flex min-h-12 items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-[background-color,color,transform] duration-150 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[var(--steel-600)] focus-visible:ring-offset-2',
                          active
                            ? 'bg-[var(--navy-800)] text-white'
                            : 'text-[var(--navy-900)] hover:bg-[var(--navy-800)] hover:text-white active:scale-[0.99]'
                        );
                        const activeArrowClassName = cn(
                          'shrink-0 transition-transform duration-150 motion-reduce:transition-none group-hover:translate-x-0.5',
                          active ? 'text-[var(--gold-300)]' : 'text-[var(--steel-600)] group-hover:text-[var(--gold-300)]'
                        );
                        return solutionItem.href === REVENUE_IMPACT_HREF ? (
                          <a
                            key={solutionItem.href}
                            href={solutionItem.href}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => closeSolutionsMenu()}
                            className={solutionClassName}
                          >
                            {solutionItem.label}
                            <ArrowRight size={16} weight="regular" aria-hidden="true" className={activeArrowClassName} />
                          </a>
                        ) : (
                          <Link
                            key={solutionItem.href}
                            href={solutionItem.href}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => closeSolutionsMenu()}
                            className={solutionClassName}
                          >
                            {solutionItem.label}
                            <ArrowRight size={16} weight="regular" aria-hidden="true" className={activeArrowClassName} />
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-4 wide-nav:flex">
          <Link
            href={ctaItem.href}
            className="ar-nav-item group inline-flex min-h-12 min-w-[255px] items-center justify-center gap-4 rounded-[9px] border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-7 text-[15px] font-semibold text-[var(--gold-ink)] shadow-[0_8px_24px_rgba(197,151,49,0.22)] outline-none transition-[transform,box-shadow,filter] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(197,151,49,0.32)] hover:brightness-105 active:translate-y-0 wide-nav:min-w-[255px] wide-nav:gap-2 wide-nav:px-3 wide-nav:text-sm xl:min-w-[285px] xl:px-6 xl:text-[15px]"
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

        <div className="ml-auto flex items-center gap-1 wide-nav:hidden">
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

    </header>
    {portalReady && createPortal(<>
      <div
        aria-hidden={!menuOpen}
        className={cn(
          'fixed inset-0 z-[var(--z-nav-backdrop)] bg-black/40 backdrop-blur-[1px] transition-opacity duration-500 ease-out motion-reduce:transition-none wide-nav:hidden',
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
          'fixed inset-y-0 right-0 z-[var(--z-nav-sheet)] flex min-h-0 w-[min(88vw,26rem)] flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--nav-glass-scrolled)] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-[-18px_0_55px_rgba(0,0,0,0.32)] backdrop-blur-[24px] sm:px-7 wide-nav:hidden',
          'transition-[transform,opacity] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          menuOpen
            ? 'pointer-events-auto translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-full opacity-100'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between border-b border-[var(--border)] pb-3 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none motion-reduce:delay-0',
            menuOpen ? 'translate-x-0 opacity-100 delay-150' : 'translate-x-3 opacity-0 delay-0'
          )}
        >
          <p className="text-sm font-medium tracking-[0.16em] text-[var(--ink-muted)] uppercase">Navigation</p>
          <button
            ref={closeButtonRef}
            type="button"
            tabIndex={menuOpen ? 0 : -1}
            onClick={closeMenu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink)] outline-none transition-colors hover:bg-[var(--surface-band-raised)] active:scale-[0.98]"
            aria-label="Close navigation"
            style={hoverTransitionStyle}
          >
            <X size={24} weight="regular" />
          </button>
        </div>

        <nav aria-label="Mobile primary" className="flex min-h-0 flex-1 flex-col justify-center gap-0 overflow-y-auto py-4">
          {navItems.map((item, index) => {
            const className = cn(
              'inline-flex min-h-10 items-center border-b border-[var(--border)] py-2 font-display text-[clamp(1.125rem,3vw,1.375rem)] font-medium leading-tight text-[var(--navy-900)] outline-none transition-[color,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[var(--accent)] motion-reduce:transition-none motion-reduce:delay-0',
              menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-5 opacity-0'
            );
            const style = { transitionDelay: menuOpen ? `${130 + index * 45}ms` : `${(navItems.length - index - 1) * 28}ms` };
            return item.href === REVENUE_IMPACT_HREF ? (
              <a
                key={item.href}
                href={item.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={closeMenu}
                className={className}
                style={style}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={(event) => {
                  closeMenu();
                  if (item.href === '/') handleHomeLinkClick(event);
                }}
                className={className}
                style={style}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href={ctaItem.href}
          tabIndex={menuOpen ? 0 : -1}
          onClick={closeMenu}
          className={cn(
            'group mt-4 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[9px] border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 text-center text-sm font-semibold text-[var(--gold-ink)] outline-none transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:delay-0',
            menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          )}
          style={{ transitionDelay: menuOpen ? `${150 + navItems.length * 45}ms` : '0ms' }}
        >
          <span>{ctaItem.label}</span>
          <ArrowRight size={19} weight="regular" aria-hidden="true" />
        </Link>
      </div>
    </>, document.body)}
    </>
  );
}
