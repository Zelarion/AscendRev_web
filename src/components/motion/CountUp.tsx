'use client';

import { useMemo, useRef, type JSX } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { registerMotion } from '@/components/motion/registerMotion';
import { isBelowRevealLine, prefersReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/cn';

interface CountUpProps {
  /**
   * The real number this stat reports. There is no placeholder mode and no
   * default: a counter with nothing real to count is a fabricated metric, and
   * PRODUCT.md is explicit that overclaiming is this site's failure mode.
   */
  value: number;
  /** Decimal places to hold throughout the count. */
  decimals?: number;
  /** Rendered before the number, e.g. a currency symbol. */
  prefix?: string;
  /** Rendered after the number, e.g. a unit or a percent sign. */
  suffix?: string;
  /** Locale used for digit grouping. Canadian English, per the site's `lang`. */
  locale?: string;
  className?: string;
}

const COUNT_DURATION = 0.9; // DESIGN.md §4: stat counters count up once, 900ms

/**
 * Counts a number up once as it enters the viewport.
 *
 * The final value is what the server renders and what the DOM contains before
 * any script runs, so the stat is correct with JavaScript disabled, in a
 * headless render, in a hidden tab, and in a print. The count is an
 * enhancement layered on top of a correct number, never a substitute for one.
 *
 * Under reduced motion the count is skipped entirely and the final value
 * stands, which is exactly what DESIGN.md §4 specifies rather than a shortened
 * animation.
 *
 * The animated digits are marked `aria-hidden` and the real value is exposed
 * separately to assistive technology, because a counter announced sixty times
 * a second is unusable. Digits are tabular so the element's width does not
 * change as it counts, which would otherwise reflow the line it sits in.
 */
export default function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  locale = 'en-CA',
  className,
}: CountUpProps): JSX.Element {
  const digitsRef = useRef<HTMLSpanElement>(null);

  const format = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [locale, decimals]
  );

  const finalText = format.format(value);

  useGSAP(
    () => {
      const element = digitsRef.current;
      if (!element) return;
      if (prefersReducedMotion()) return;
      if (!isBelowRevealLine(element)) return;

      registerMotion();

      // The tween drives a plain object and the object drives the text. GSAP
      // has no business interpolating a text node directly, and this keeps the
      // formatting rules in one place for both the animated and the final
      // value.
      const counter = { current: 0 };

      gsap.to(counter, {
        current: value,
        duration: COUNT_DURATION,
        ease: 'power2.out',
        onUpdate: () => {
          element.textContent = format.format(counter.current);
        },
        // Snap the last frame to the exact value. Easing lands close to the
        // target but not on it, and a stat that settles at 499 instead of 500
        // is worse than no animation at all.
        onComplete: () => {
          element.textContent = finalText;
        },
        scrollTrigger: {
          trigger: element,
          start: 'top 85%',
          once: true,
        },
      });
    },
    { dependencies: [value, finalText, format] }
  );

  return (
    <span className={cn('tabular-nums', className)}>
      <span aria-hidden="true">
        {prefix}
        <span ref={digitsRef}>{finalText}</span>
        {suffix}
      </span>
      {/* The value, once, for assistive technology. Screen readers announce
          this and never see the counting digits above.
          `select-none` keeps it out of the selection: without it, a reader who
          drags across the stat and copies it gets the number twice, because
          `sr-only` hides text visually but leaves it selectable. */}
      <span className="sr-only select-none">{`${prefix}${finalText}${suffix}`}</span>
    </span>
  );
}
