'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
} from 'react';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import { cn } from '@/lib/cn';
import { EASE_UI } from '@/components/sections/shared/motionTokens';
import type { IndustriesContent, IndustryGroup } from '@/content/home';

interface IndustriesSectionProps {
  content: IndustriesContent;
}

/**
 * How the section is presenting itself right now.
 *
 * `stacked` is what the server renders and what a reader without JavaScript
 * keeps. Every group is laid out in full, one after another, with its own
 * heading. That is the whole point: DESIGN.md §4 requires that a failed
 * bundle still show a complete page, and a tab strip with four of its five
 * panels permanently hidden is not a complete page. The tab controls are not
 * rendered at all in this mode, so there are no dead buttons either.
 *
 * `tabs` and `accordion` are chosen on the client from a media query, which is
 * why neither can be the server's guess.
 */
type Presentation = 'stacked' | 'tabs' | 'accordion';

/** SPEC.md §4.1: the tab set falls back to a stacked accordion below 768px. */
const TABS_MEDIA_QUERY = '(min-width: 768px)';

const PANEL_TRANSITION_MS = 260;
const UNDERLINE_TRANSITION_MS = 360;

/** Geometry of the sliding underline, in pixels, relative to the tab rail. */
interface UnderlineRect {
  x: number;
  width: number;
}

/**
 * The argument and the two lists that make up one group, shared by all three
 * presentations so the content cannot drift between them.
 *
 * The two lists are distinguished by treatment rather than by labels, because
 * every visible string on this page comes from `src/content/home.ts` and it
 * supplies no label for either. That turns out to be the better design anyway:
 * a pair of small uppercase headings here would be exactly the section
 * scaffolding DESIGN.md §2 bans.
 *
 * `sectors` are taxonomy tokens, so they are set as uppercase tracked micro
 * labels and read as a classification rail under the argument. `functions` are
 * the work AscendRev actually does, so they are set as full-size hairline rows
 * and read as a list of deliverables.
 */
function GroupBody({ group }: { group: IndustryGroup }): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-12">
      <div className="md:col-span-5">
        <p className="max-w-[46ch] text-body-lg text-white/88">{group.body}</p>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {group.sectors.map((sector) => (
            <li
              key={sector}
              // 0.3em is wide, and these strings vary from "HVAC" to
              // "Residential and commercial developers". They wrap rather than
              // overflow, which is why the row is a wrapping flex and the item
              // is allowed to break.
              className="font-mono text-[0.75rem] font-medium uppercase leading-[1.4] tracking-[0.3em] text-white/82"
            >
              {sector}
            </li>
          ))}
        </ul>
      </div>

      <ul className="border-t border-[var(--border-navy)] md:col-span-6 md:col-start-7">
        {group.functions.map((fn) => (
          <li
            key={fn}
            className="border-b border-[var(--border-navy)] py-4 text-body text-white"
          >
            {fn}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The industries tab set: five groups, five panels, one underline.
 *
 * PROGRESSIVE ENHANCEMENT, AND WHY IT IS BUILT THIS WAY ROUND
 *
 * The obvious build renders the tab strip on the server with one panel visible
 * and four hidden, which ships a page where 80% of this section's content is
 * unreachable without JavaScript and where five buttons do nothing. This one
 * renders every group in full on the server and collapses to the tab set after
 * hydration. The cost is that a reader on a very slow connection could see the
 * long version briefly; the section sits well below the fold, so that is not a
 * layout shift anyone is looking at, and the benefit is that the page is
 * genuinely complete without scripts.
 *
 * ACCESSIBILITY
 *
 * The tab strip is the ARIA tabs pattern: real buttons with `role="tab"`, a
 * roving tabindex so the strip is one stop in the page's tab order, left and
 * right arrows wrapping around the ends, Home and End jumping to them, and
 * automatic activation because the panels are already rendered and switching
 * them costs nothing. Panels that are not showing are `inert` and
 * `aria-hidden`, so they are out of both the tab order and the accessibility
 * tree rather than merely transparent.
 *
 * The accordion below 768px is `<details>` and `<summary>`, which the browser
 * already makes keyboard operable and announces correctly, so it carries no
 * ARIA at all.
 */
export default function IndustriesSection({ content }: IndustriesSectionProps): JSX.Element {
  const { groups } = content;
  const [presentation, setPresentation] = useState<Presentation>('stacked');
  const [activeId, setActiveId] = useState<string>(groups[0]?.id ?? '');
  const [underline, setUnderline] = useState<UnderlineRect | null>(null);
  /**
   * False until the underline has been placed once. The first placement is the
   * underline appearing under the already-selected tab, which should not look
   * like a move; every placement after that is a selection changing, which
   * should.
   */
  const [underlineSettled, setUnderlineSettled] = useState(false);

  const railRef = useRef<HTMLDivElement>(null);
  const tablistRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const query = window.matchMedia(TABS_MEDIA_QUERY);
    const apply = () => setPresentation(query.matches ? 'tabs' : 'accordion');
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  /** Measure the active tab and move the underline onto it. */
  const measureUnderline = useCallback(() => {
    const tab = tabRefs.current.get(activeId);
    if (!tab) {
      setUnderline(null);
      return;
    }
    setUnderline({ x: tab.offsetLeft, width: tab.offsetWidth });
    setUnderlineSettled(true);
  }, [activeId]);

  /**
   * Tab widths are not stable: they change when the web font swaps in over the
   * fallback, and again on any resize. Observing the strip itself rather than
   * the rail around it is what catches the font swap, because the rail is
   * full-width in every case and its own box never changes.
   */
  useEffect(() => {
    if (presentation !== 'tabs') return;
    const tablist = tablistRef.current;
    if (!tablist) return;
    measureUnderline();
    const observer = new ResizeObserver(() => measureUnderline());
    observer.observe(tablist);
    return () => observer.disconnect();
  }, [presentation, measureUnderline]);

  /**
   * Bring the newly selected tab fully into view inside the rail.
   *
   * `scrollIntoView` is the shorter way to write this and the wrong one: it
   * can scroll ancestors as well, which on this page means it can fight Lenis
   * for the window scroll position. Setting `scrollLeft` touches the rail and
   * nothing else.
   */
  const revealTab = useCallback((tab: HTMLButtonElement) => {
    const rail = railRef.current;
    if (!rail) return;
    const leftOverflow = tab.offsetLeft - rail.scrollLeft;
    const rightOverflow = leftOverflow + tab.offsetWidth - rail.clientWidth;
    if (leftOverflow < 0) {
      rail.scrollLeft += leftOverflow;
    } else if (rightOverflow > 0) {
      rail.scrollLeft += rightOverflow;
    }
  }, []);

  const selectTab = useCallback(
    (id: string, moveFocus: boolean) => {
      setActiveId(id);
      const tab = tabRefs.current.get(id);
      if (!tab) return;
      if (moveFocus) tab.focus();
      revealTab(tab);
    },
    [revealTab]
  );

  const onTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      const current = groups.findIndex((group) => group.id === activeId);
      if (current < 0) return;

      let next: number;
      switch (event.key) {
        case 'ArrowRight':
          next = (current + 1) % groups.length;
          break;
        case 'ArrowLeft':
          next = (current - 1 + groups.length) % groups.length;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = groups.length - 1;
          break;
        default:
          return;
      }

      // Only after a key this component handles, so Tab, Shift+Tab and every
      // browser shortcut keep working.
      event.preventDefault();
      selectTab(groups[next].id, true);
    },
    [activeId, groups, selectTab]
  );

  const heading = (
    <>
      <RevealOnScroll>
        <h2 className="max-w-[20ch] font-display text-h1 text-white">{content.heading}</h2>
      </RevealOnScroll>
      <RevealOnScroll>
        <p className="mt-6 max-w-[62ch] text-body-lg text-white/86">{content.intro}</p>
      </RevealOnScroll>
    </>
  );

  return (
    <Section
      id={content.id}
      tone="navy"
      // The bottom padding is trimmed below the standard rhythm because the
      // closing band underneath is the same navy, so the two paddings read as
      // one void rather than as two sections. See the note in ClosingBand.
      className="border-t border-[var(--border-navy)] pb-[clamp(3rem,6vw,5rem)]"
    >
      <Container>
        {heading}

        <div className="mt-[clamp(3rem,6vw,4.5rem)]">
          {presentation === 'stacked' && (
            /*
             * No JavaScript yet, or none at all. Every group in full, each
             * under its own heading, in document order.
             */
            <div className="grid gap-16">
              {groups.map((group) => (
                <section key={group.id} aria-labelledby={`industry-${group.id}`}>
                  <h3
                    id={`industry-${group.id}`}
                    className="mb-8 border-b border-[var(--border-navy)] pb-4 font-sans text-h3 text-white"
                  >
                    {group.label}
                  </h3>
                  <GroupBody group={group} />
                </section>
              ))}
            </div>
          )}

          {presentation === 'tabs' && (
            <>
              <div
                ref={railRef}
                // The rail scrolls rather than wrapping. Five labels of this
                // length do not fit on one line until roughly 1100px, and a
                // two-row tab strip makes the sliding underline meaningless.
                // The vertical padding is what keeps the 3px focus ring from
                // being clipped by the scroll container.
                className="-my-1 overflow-x-auto overflow-y-hidden py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <div
                  ref={tablistRef}
                  role="tablist"
                  aria-label={content.heading}
                  aria-orientation="horizontal"
                  className="relative flex w-max min-w-full gap-8 border-b border-[var(--border-navy)]"
                >
                  {groups.map((group) => {
                    const selected = group.id === activeId;
                    return (
                      <button
                        key={group.id}
                        ref={(node) => {
                          if (node) tabRefs.current.set(group.id, node);
                          else tabRefs.current.delete(group.id);
                        }}
                        type="button"
                        role="tab"
                        id={`industry-tab-${group.id}`}
                        aria-selected={selected}
                        aria-controls={`industry-panel-${group.id}`}
                        // Roving tabindex: the whole strip is one stop in the
                        // page's tab order, and the arrow keys move within it.
                        tabIndex={selected ? 0 : -1}
                        onClick={() => selectTab(group.id, false)}
                        onKeyDown={onTabKeyDown}
                        style={{
                          transitionDuration: '150ms',
                          transitionTimingFunction: EASE_UI,
                        }}
                        className={cn(
                          'min-h-11 whitespace-nowrap px-1 pb-4 text-small font-medium outline-none transition-colors',
                          selected ? 'text-white' : 'text-white/64 hover:text-white'
                        )}
                      >
                        {group.label}
                      </button>
                    );
                  })}

                  {/*
                   * One element travels between the tabs rather than each tab
                   * owning its own underline, so the movement reads as the
                   * selection moving rather than as one mark fading out while
                   * another fades in.
                   *
                   * It is 1px wide and scaled on the X axis, never resized:
                   * DESIGN.md §4 allows transform and opacity and rules out
                   * animating `width`, and a scaled solid colour is
                   * indistinguishable from a resized one.
                   *
                   * Under reduced motion globals.css collapses the transition
                   * duration, so the underline jumps to the new tab exactly as
                   * SPEC.md §4.1 asks.
                   */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-px bg-white"
                    style={{
                      transformOrigin: '0 0',
                      transform: underline
                        ? `translate3d(${underline.x}px, 0, 0) scaleX(${underline.width})`
                        : 'scaleX(0)',
                      transitionProperty: 'transform',
                      transitionDuration: underlineSettled ? `${UNDERLINE_TRANSITION_MS}ms` : '0ms',
                      transitionTimingFunction: EASE_UI,
                    }}
                  />
                </div>
              </div>

              {/*
               * Every panel occupies the same grid cell, so the container is
               * as tall as the tallest panel and switching tabs never resizes
               * the page underneath the reader's cursor. That is also what
               * makes a crossfade possible: both panels are in the same place
               * at the same time for the length of the transition.
               */}
              <div className="mt-[clamp(2.5rem,5vw,4rem)] grid">
                {groups.map((group) => {
                  const selected = group.id === activeId;
                  return (
                    <div
                      key={group.id}
                      role="tabpanel"
                      id={`industry-panel-${group.id}`}
                      aria-labelledby={`industry-tab-${group.id}`}
                      aria-hidden={!selected}
                      inert={!selected}
                      // Focusable so a keyboard reader can scroll a panel
                      // whose content runs past the viewport.
                      tabIndex={selected ? 0 : -1}
                      className={cn(
                        '[grid-area:1/1] outline-none',
                        selected ? 'opacity-100' : 'pointer-events-none opacity-0'
                      )}
                      style={{
                        transitionProperty: 'opacity',
                        transitionDuration: `${PANEL_TRANSITION_MS}ms`,
                        transitionTimingFunction: EASE_UI,
                      }}
                    >
                      <GroupBody group={group} />
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {presentation === 'accordion' && (
            <div className="border-t border-[var(--border-navy)]">
              {groups.map((group, index) => (
                <details
                  key={group.id}
                  // The first group is open so the section is never a wall of
                  // closed rows with nothing to read.
                  open={index === 0}
                  className="group border-b border-[var(--border-navy)]"
                >
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-sans text-h3 text-white outline-none [&::-webkit-details-marker]:hidden">
                    {group.label}
                    {/*
                     * Drawn with borders rather than an icon component so the
                     * chevron can rotate with the element's own open state in
                     * CSS, with no JavaScript and no second render.
                     */}
                    <span
                      aria-hidden="true"
                      className="mr-1 h-2 w-2 shrink-0 rotate-45 border-b border-r border-white transition-transform group-open:rotate-[225deg]"
                      style={{
                        transitionDuration: '200ms',
                        transitionTimingFunction: EASE_UI,
                      }}
                    />
                  </summary>
                  <div className="pb-8 pt-2">
                    <GroupBody group={group} />
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
