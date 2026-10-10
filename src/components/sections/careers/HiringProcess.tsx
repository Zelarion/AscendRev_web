import type { JSX } from 'react';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import { hiringProcess } from '@/content/careers';
import styles from './careers.module.css';

/**
 * The hiring steps. Numbered because this genuinely is an ordered process, the
 * one case DESIGN.md §2 allows numbered markers for.
 */
export default function HiringProcess(): JSX.Element {
  return (
    <section aria-labelledby="process-heading" className="relative isolate overflow-hidden bg-[var(--navy-900)] py-[clamp(3.5rem,8vw,6rem)] text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_85%_0%,rgba(50,98,146,0.45),transparent_70%),radial-gradient(40rem_24rem_at_0%_100%,rgba(30,94,70,0.35),transparent_70%)]" />
      <div className="mx-auto w-full max-w-[1280px] px-[var(--site-gutter)]">
        <h2 id="process-heading" className="font-display text-h2 text-white">
          {hiringProcess.heading}
        </h2>

        <div className="relative mt-10">
          <span aria-hidden="true" className={`${styles.processLine} absolute left-0 right-0 top-6 hidden h-px bg-[linear-gradient(90deg,var(--gold-300),rgba(240,212,123,0.15))] lg:block`} />
          <RevealOnScroll as="ol" stagger className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {hiringProcess.steps.map((step, index) => (
              <li key={step.title}>
                <span className="relative grid size-12 place-items-center rounded-full border border-[var(--gold-300)]/60 bg-[var(--navy-900)] font-display text-xl text-[var(--gold-300)]">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-[1.15rem] font-semibold text-white">{step.title}</h3>
                <p className="mt-2 max-w-[32ch] text-small leading-relaxed text-white/75">{step.body}</p>
              </li>
            ))}
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
