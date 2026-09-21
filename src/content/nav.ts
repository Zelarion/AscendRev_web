/**
 * Primary navigation, resolved per SPEC.md §3. The client's source document
 * listed "Solutions | Industries | The AscendRev Advantage | Leadership" but
 * only specifies four pages, with two of those labels pointing at sections
 * inside other pages rather than standalone routes. Resolved here as four
 * items that map 1:1 to either a page or a same-page anchor, so the header
 * never has to guess which behaviour a label implies.
 */

export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: 'Solutions', href: '/solutions' },
  { label: 'Industries', href: '/#industries' },
  { label: 'Advantage', href: '/advantage' },
  { label: 'Contact', href: '/contact' },
];

/** Global CTA, top right on every page (SPEC.md §3). */
export const globalCta: NavItem = {
  label: 'Request Outsourcing Blueprint',
  href: '/contact',
};

/**
 * Alias for `globalCta`. `src/components/layout/Header.tsx` (owned by another
 * builder, written concurrently with this file) imports the CTA under the
 * name `ctaItem`, SPEC.md never pinned an exact export name for it, so both
 * builders picked independently. Kept as an alias rather than renaming
 * `globalCta` so nothing that already imports the original name breaks;
 * flagged for the orchestrator to pick one canonical name and drop the other.
 */
export const ctaItem = globalCta;
