'use client';

import { createElement, type JSX, type ReactNode } from 'react';
import { useReveal } from '@/lib/useReveal';
import { cn } from '@/lib/cn';

type StaggerElement = 'div' | 'ul' | 'ol' | 'section';

interface StaggerProps {
  children: ReactNode;
  as?: StaggerElement;
  className?: string;
}

/**
 * Reveals its direct children on a 60ms cascade, capped at 8 items; past the
 * cap every child reveals together, because a 60ms step across twenty cards
 * is a waterfall rather than a reveal (DESIGN.md §4).
 *
 * Unlike the previous implementation, this does not wrap each child in an
 * extra animated <div>. The children ARE the grid or list items, so
 * `className` can carry the grid directly and the DOM stays the shape the
 * section author wrote:
 *
 *   <Stagger className="grid gap-6 md:grid-cols-3">{cards}</Stagger>
 *   <Stagger as="ul" className="flex flex-col gap-3">{items}</Stagger>
 *
 * That also fixes a real bug in the wrapper approach: an interposed <div>
 * between a `<ul>` and its `<li>` children is invalid HTML and breaks the
 * list semantics a screen reader announces.
 *
 * Same visible-by-default guarantee as Reveal: nothing is hidden by the
 * server, children already on screen are never touched, and reduced motion
 * skips the whole thing.
 */
export default function Stagger({ children, as = 'div', className }: StaggerProps): JSX.Element {
  const ref = useReveal<HTMLElement>({ stagger: true });

  return createElement(as, { ref, className: cn(className) }, children);
}
