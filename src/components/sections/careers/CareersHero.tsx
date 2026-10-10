import Image from 'next/image';
import type { JSX } from 'react';
import { ArrowDown, MapPin, Moon, Globe } from '@phosphor-icons/react/dist/ssr';
import Container from '@/components/layout/Container';
import { careersHero, careersStats } from '@/content/careers';
import styles from './careers.module.css';

const CHIP_ICONS = [MapPin, Moon, Globe];

/**
 * Full-bleed hero over the real production floor. Server rendered and visible
 * without JavaScript; the drift, light sweep and word rise are CSS only and
 * switch off under reduced motion.
 */
export default function CareersHero(): JSX.Element {
  const words = careersHero.headline.split(' ');

  return (
    <section aria-labelledby="careers-hero-heading" className={styles.hero}>
      <div className={styles.heroMedia} aria-hidden="true">
        <Image
          src="/images/office4.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroSweep} aria-hidden="true" />
      <div className={styles.heroGrain} aria-hidden="true" />

      <Container className="relative pb-[clamp(3rem,7vw,5.5rem)] pt-[calc(var(--header-height)+clamp(3rem,8vw,6rem))] lg:max-w-[1280px]">
        <div className="max-w-[44rem]">
          <h1 id="careers-hero-heading" className="font-display text-[clamp(2.5rem,6.2vw,4.5rem)] leading-[1.04] tracking-[-0.03em] text-white">
            {words.map((word, index) => (
              <span key={`${word}-${index}`} className={styles.heroWord} style={{ animationDelay: `${120 + index * 90}ms` }}>
                {word}
                {index < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </h1>

          <p className={`${styles.heroFade} mt-5 max-w-[56ch] text-body-lg leading-relaxed text-white/85`} style={{ animationDelay: '520ms' }}>
            {careersHero.intro}
          </p>

          <ul className={`${styles.heroFade} mt-6 flex flex-wrap gap-2`} style={{ animationDelay: '640ms' }} aria-label="About these roles">
            {careersHero.chips.map((chip, index) => {
              const Icon = CHIP_ICONS[index] ?? MapPin;
              return (
                <li
                  key={chip}
                  className={`${styles.chip} inline-flex min-h-9 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 text-small text-white`}
                >
                  <Icon size={18} aria-hidden="true" className="text-[var(--gold-300)]" />
                  {chip}
                </li>
              );
            })}
          </ul>

          <div className={`${styles.heroFade} mt-8 flex flex-wrap gap-3`} style={{ animationDelay: '760ms' }}>
            <a
              href="#open-roles"
              className="inline-flex min-h-12 items-center gap-2 rounded-[7px] bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 text-sm font-semibold text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.22)] transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {careersHero.primaryCta}
              <ArrowDown size={18} aria-hidden="true" />
            </a>
            <a
              href="#apply"
              className="inline-flex min-h-12 items-center rounded-[7px] border border-white/35 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {careersHero.secondaryCta}
            </a>
          </div>
        </div>

        <dl className={`${styles.heroFade} mt-12 grid max-w-[40rem] grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-white/15 bg-white/15`} style={{ animationDelay: '900ms' }}>
          {careersStats.map((stat) => (
            <div key={stat.label} className="bg-[rgba(15,27,51,0.72)] px-4 py-4 sm:px-5">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="m-0">
                <span className="block font-display text-[clamp(1.6rem,3.5vw,2.25rem)] leading-none text-[var(--gold-300)]">{stat.value}</span>
                <span className="mt-1.5 block text-xs leading-4 text-white/75 sm:text-small">{stat.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
