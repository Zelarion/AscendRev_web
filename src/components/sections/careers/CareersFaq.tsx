import type { JSX } from 'react';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { careersFaq } from '@/content/careers';
import styles from './careers.module.css';

/** Native details/summary: keyboard and screen-reader support with no script. */
export default function CareersFaq(): JSX.Element {
  return (
    <section aria-labelledby="careers-faq-heading" className="bg-[var(--bg)] py-[clamp(3.5rem,8vw,6rem)]">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-[var(--site-gutter)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
        <div>
          <h2 id="careers-faq-heading" className="font-display text-h2 text-[var(--navy-900)]">
            Questions applicants ask
          </h2>
          <p className="mt-3 max-w-[40ch] text-body text-[var(--ink-muted)]">
            Something else on your mind? Mention it in your application and our team will answer when we call.
          </p>
        </div>
        <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {careersFaq.map((item) => (
            <details key={item.question} className={styles.faqItem}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-body font-semibold text-[var(--navy-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
                {item.question}
                <Plus size={20} aria-hidden="true" className={`${styles.faqIcon} shrink-0 text-[var(--steel-600)]`} />
              </summary>
              <p className={`${styles.faqAnswer} max-w-[62ch] pb-5 text-body leading-relaxed text-[var(--ink-muted)]`}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
