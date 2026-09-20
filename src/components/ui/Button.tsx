import type { JSX, AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { CircleNotch } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';
import { hoverTransitionStyle } from '@/lib/motion';

// No 'use client' directive: Button holds no state and calls no hooks — it
// is a pure, prop-driven leaf. That lets it render as plain static markup
// when used from a server-rendered section, and work identically with
// onClick/pending wired up when composed under a client parent (e.g. the
// contact form step in src/components/sections, outside this scope).

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Real pending state: shows a spinner, sets aria-busy, and forces
   * disabled=true. Not opacity alone — see DESIGN.md/SPEC.md §5. */
  pending?: boolean;
  className?: string;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-7 text-base',
};

// No per-variant focus-ring colour here: globals.css's global
// `:focus-visible` rule (steel-600) and its `[data-tone='navy']
// :focus-visible` override (steel-400) already handle it, keyed off
// whichever ancestor Section/Header/Footer sets `data-tone`. That's what
// actually makes `secondary` correct "on navy" — it inherits the lighter
// ring from context instead of guessing its own background here.
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[--green-600] text-white hover:bg-[--green-500] active:bg-[--green-700]',
  secondary: 'border border-white bg-transparent text-white hover:bg-white/10',
  ghost: 'bg-transparent text-[--ink] hover:bg-[--border]/50',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  pending = false,
  className,
  href,
  ...rest
}: ButtonProps): JSX.Element {
  const sharedClassName = cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] font-medium outline-none transition-colors',
    'active:scale-[0.98]',
    'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
    sizeClasses[size],
    variantClasses[variant],
    className
  );

  const content = (
    <>
      {pending && (
        <CircleNotch size={20} weight="regular" aria-hidden="true" className="motion-safe:animate-spin" />
      )}
      <span>{children}</span>
    </>
  );

  if (href) {
    const linkRest = rest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'>;
    return (
      <Link href={href} className={sharedClassName} style={hoverTransitionStyle} {...linkRest}>
        {content}
      </Link>
    );
  }

  const buttonRest = rest as Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;
  return (
    <button
      type="button"
      className={sharedClassName}
      style={hoverTransitionStyle}
      aria-busy={pending || undefined}
      disabled={pending || buttonRest.disabled}
      {...buttonRest}
    >
      {content}
    </button>
  );
}
