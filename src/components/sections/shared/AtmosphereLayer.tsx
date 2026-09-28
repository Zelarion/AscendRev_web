import type { JSX } from 'react';
import { cn } from '@/lib/cn';
import styles from './AtmosphereLayer.module.css';

export type AtmosphereVariant = 'light-network' | 'dark-momentum' | 'route-accent';

export interface AtmosphereLayerProps {
  /** Selects the section's decorative backdrop treatment. */
  variant: AtmosphereVariant;
  /** Optional positioning or sizing utilities supplied by the containing section. */
  className?: string;
}

/**
 * Decorative, non-interactive artwork layer for section wrappers.
 *
 * The parent controls layout and stacking: give it `position: relative` and
 * place its readable content above this layer (for example, with `z-index: 1`).
 * This component deliberately adds no scroll effects or runtime dependencies.
 */
export default function AtmosphereLayer({
  variant,
  className,
}: AtmosphereLayerProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(styles.layer, styles[variant], className)}
      data-atmosphere-variant={variant}
    >
      <span className={styles.artwork} />
      <span className={styles.veil} />
    </div>
  );
}
