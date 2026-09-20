import type { JSX, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ProseProps {
  children: ReactNode;
  className?: string;
}

/**
 * Long-form text wrapper: caps measure at 68ch (DESIGN.md §2/§3) and
 * applies `text-wrap: pretty` to paragraphs via Tailwind's arbitrary
 * property syntax, rather than an inline `style` object, since not every
 * TS/csstype version in this toolchain is guaranteed to type `textWrap`.
 */
export default function Prose({ children, className }: ProseProps): JSX.Element {
  return <div className={cn('max-w-[68ch] text-[--ink] [text-wrap:pretty]', className)}>{children}</div>;
}
