'use client';

import { createElement, type JSX, type ReactNode } from 'react';
import { useReveal } from '@/lib/useReveal';
import { cn } from '@/lib/cn';

type RevealElement = 'div' | 'section' | 'li' | 'article' | 'span';

interface RevealProps {
  children: ReactNode;
  /** Seconds to hold before the reveal starts. */
  delay?: number;
  as?: RevealElement;
  className?: string;
}

/**
 * Wraps content in DESIGN.md §4's single scroll-reveal shape: a 14px rise and
 * an opacity fade, 600ms on ease-out-expo, fired once.
 *
 * The non-negotiable part of that section is that reveals enhance an
 * already-visible default. This component emits exactly one plain element
 * with the caller's className and nothing else. There is no hidden class, no
 * zero-opacity initial style, and no wrapper that a transition later removes,
 * so the server-rendered HTML is the finished, readable page. Everything the
 * reveal needs is applied by GSAP after hydration, and only to elements still
 * below the fold. See useReveal for why that distinction matters.
 */
export default function Reveal({
  children,
  delay = 0,
  as = 'div',
  className,
}: RevealProps): JSX.Element {
  const ref = useReveal<HTMLElement>({ delay });

  // createElement rather than a `motion[as]` lookup: `as` is a plain tag here,
  // so there is no polymorphic component to resolve and no `any` to launder a
  // mismatched ref type through.
  return createElement(as, { ref, className: cn(className) }, children);
}
