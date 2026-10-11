import Image from 'next/image';
import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import { careersPage } from '@/content/careers';
import styles from './careers.module.css';

/**
 * Full-bleed hero over the real production floor, carrying only Rio's heading
 * and line. Server rendered and visible without JavaScript; the drift, light
 * sweep and rise are CSS only and switch off under reduced motion.
 */
export default function CareersHero(): JSX.Element {
  return (
    <section aria-labelledby="careers-hero-heading" className={styles.hero}>
      <div className={styles.heroMedia} aria-hidden="true">
        <Image src="/images/office4.webp" alt="" fill priority sizes="100vw" className="object-cover" />
      </div>
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroSweep} aria-hidden="true" />
      <div className={styles.heroGrain} aria-hidden="true" />

      <Container className="relative pb-[clamp(3.5rem,8vw,6rem)] pt-[calc(var(--header-height)+clamp(3.5rem,9vw,7rem))] lg:max-w-[1280px]">
        <h1
          id="careers-hero-heading"
          className={`${styles.heroWord} font-display text-[clamp(2.75rem,7vw,5rem)] leading-[1.02] tracking-[-0.03em] text-white`}
          style={{ animationDelay: '120ms' }}
        >
          {careersPage.heading}
        </h1>
        <p
          className={`${styles.heroFade} mt-5 max-w-[34ch] text-body-lg text-white/90`}
          style={{ animationDelay: '360ms' }}
        >
          {careersPage.description}
        </p>
      </Container>
    </section>
  );
}
