'use client';

import { type JSX, Children, useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReveal } from '@/lib/useReveal';
import {
  revealTransition,
  staggerContainerVariants,
  staggerItemVariants,
  STAGGER_MAX_ITEMS,
  STAGGER_STEP,
} from '@/lib/motion';
import { cn } from '@/lib/cn';

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Orchestrates a list of children with a 60ms cascade, capped at 8 items —
 * beyond that, DESIGN.md §4 calls for instant (no cascade) rather than a
 * multi-second waterfall. Same visible-by-default guarantee as Reveal: see
 * the comment there for how `hasMounted` pins the pre-hydration state to
 * visible.
 *
 * `className` lands on the orchestrating container, so this composes
 * directly as a grid/flex parent, e.g.
 * `<Stagger className="grid grid-cols-3 gap-6">{cards}</Stagger>` — each
 * child becomes a grid item wrapped in its own animated `<div>`.
 */
export default function Stagger({ children, className }: StaggerProps): JSX.Element {
  const [hasMounted, setHasMounted] = useState(false);
  const { ref, isRevealed, prefersReducedMotion } = useReveal<HTMLDivElement>();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const items = Children.toArray(children);
  const withinCap = items.length <= STAGGER_MAX_ITEMS;
  const shouldAnimate = hasMounted && !prefersReducedMotion && withinCap;
  const animateTarget = !shouldAnimate || isRevealed ? 'visible' : 'hidden';

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={animateTarget}
      variants={staggerContainerVariants}
      transition={{ staggerChildren: withinCap ? STAGGER_STEP : 0 }}
      className={cn(className)}
    >
      {items.map((child, index) => (
        <motion.div
          // Static content list from the page's own data — order never
          // changes at runtime, so an index key is safe here.
          key={index}
          initial={false}
          animate={animateTarget}
          variants={staggerItemVariants}
          transition={revealTransition}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
