import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional class names (clsx) and resolves conflicting Tailwind
 * utility classes (tailwind-merge) so the last one wins instead of both
 * shipping to the DOM. Use this instead of raw template-string concatenation
 * anywhere a component accepts a `className` override prop.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
