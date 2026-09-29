/**
 * Primary navigation, resolved per SPEC.md §3 and revised against the client's
 * September 2026 feedback.
 *
 * Labels are the client's own wording and are deliberately not shortened. The
 * full menu sheet remains available through tablet widths; desktop groups the
 * framework, capabilities, and revenue destinations under SOLUTIONS so its
 * main row can stay readable beside the CTA on laptops.
 *
 * The revenue-gap problem/solution framework is part of `/solutions/`; it is
 * not a separate navigation destination.
 */

export interface NavItem {
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { label: 'HOME', href: '/' },
  { label: 'PROBLEM-SOLUTION FRAMEWORK', href: '/solutions/' },
  { label: 'CAPABILITIES', href: '/capabilities/' },
  { label: 'OUR DIFFERENCE', href: '/advantage/' },
  { label: 'OUR VALUES', href: '/values/' },
  { label: 'CONTACT', href: '/contact/' },
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
