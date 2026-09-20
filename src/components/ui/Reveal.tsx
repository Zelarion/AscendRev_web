'use client';

import { type JSX, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReveal } from '@/lib/useReveal';
import { revealTransition, revealVariants } from '@/lib/motion';
import { cn } from '@/lib/cn';

type RevealElement = 'div' | 'section' | 'li' | 'article' | 'span';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  as?: RevealElement;
  className?: string;
}

/**
 * DESIGN.md §4, non-negotiable: children render VISIBLE by default. The
 * hidden-then-revealed state is applied only after hydration confirms
 * motion is wanted — never as the element's shipped/initial state. A
 * headless render, a hidden tab, disabled JS, or a failed bundle must still
 * show complete, visible content.
 *
 * How this is guaranteed here: `hasMounted` starts false and is only ever
 * flipped true inside a `useEffect`, which never runs on the server and
 * never runs before first paint on the client. Until it flips,
 * `animateTarget` is hard-pinned to 'visible' regardless of scroll
 * position — so the server-rendered HTML, and the first client paint
 * before hydration completes, are always the fully visible state. Only
 * after mount does isRevealed/prefersReducedMotion (from useReveal) get a
 * say in whether to show the pre-reveal 'hidden' state while off-screen.
 */
export default function Reveal({ children, delay = 0, as = 'div', className }: RevealProps): JSX.Element {
  const [hasMounted, setHasMounted] = useState(false);
  // Typed as HTMLElement (the shared base of div/section/li/article/span)
  // rather than a specific tag, since `as` picks the concrete tag at
  // runtime — IntersectionObserver only needs *an* Element, so this loses
  // no real capability.
  const { ref, isRevealed, prefersReducedMotion } = useReveal<HTMLElement>();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const shouldAnimate = hasMounted && !prefersReducedMotion;
  const animateTarget = !shouldAnimate || isRevealed ? 'visible' : 'hidden';

  // `motion[as]` resolves to a different concrete component (and a
  // differently-tag-typed `ref`) per value of `as`. Fully typing that
  // polymorphism through to a single shared `ref` isn't worth the
  // machinery for five known tags, so it's deliberately untyped at this
  // one internal boundary; Reveal's own public props (above) stay strictly
  // typed for callers, and the runtime behavior is identical for every tag.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MotionTag = motion[as] as any;

  return (
    <MotionTag
      ref={ref}
      initial={false}
      animate={animateTarget}
      variants={revealVariants}
      transition={{ ...revealTransition, delay }}
      className={cn(className)}
    >
      {children}
    </MotionTag>
  );
}
