/**
 * Primary navigation, resolved per SPEC.md §3 and revised against the client's
 * 23 September 2026 feedback, which renamed three tabs and added a fourth.
 *
 * Labels are the client's own wording and are deliberately not shortened. That
 * costs horizontal room: six items averaging fourteen characters do not fit on
 * one row beside the logo and the CTA at the `lg` breakpoint, so `Header.tsx`
 * now reveals the desktop row at `xl` and uses the menu below that. Shortening
 * the labels would buy the row back if the client ever prefers it.
 *
 * "Our Revenue Impact" is an anchor into the home page rather than a route,
 * because that section lives on the home page. Everything else is a real page.
 */

export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Solutions', href: '/solutions/' },
  { label: 'Our Revenue Impact', href: '/#revenue-impact' },
  { label: 'The AscendRev Difference', href: '/advantage/' },
  { label: 'Our Corporate Values', href: '/values/' },
  { label: 'Contact', href: '/contact/' },
];

/**
 * Global CTA, top right on every page (SPEC.md §3). The label tracks the
 * enquiry form's own heading, "Request for Solution Blueprint", so the button
 * and the page it lands on say the same thing.
 */
export const ctaItem: NavItem = {
  label: 'Request Solution Blueprint',
  href: '/contact/',
};
