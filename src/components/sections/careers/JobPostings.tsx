import Link from 'next/link';
import type { JSX } from 'react';
import { Briefcase, CalendarBlank, MapPin } from '@phosphor-icons/react/dist/ssr';
import { applicationForm, careersPage, formatPostedDate, openRoles } from '@/content/careers';
import styles from './careers.module.css';

/**
 * "Ready to grow with us?" and the job postings beneath it, as Rio laid them
 * out: title, location, posted date and one line, each card opening the
 * posting's full page.
 */
export default function JobPostings(): JSX.Element {
  return (
    <section
      id="open-roles"
      aria-labelledby="open-roles-heading"
      className="relative isolate scroll-mt-[calc(var(--header-height)+1rem)] overflow-hidden bg-[var(--bg)] py-[clamp(3.5rem,8vw,6rem)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(48rem_24rem_at_100%_0%,rgba(240,212,123,0.16),transparent_70%),radial-gradient(40rem_22rem_at_0%_100%,rgba(50,98,146,0.10),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-[1100px] px-[var(--site-gutter)]">
        <h2 id="open-roles-heading" className="font-display text-h2 text-[var(--navy-900)]">
          {careersPage.postingsHeading}
        </h2>

        <ul className="mt-9 grid gap-5">
          {openRoles.map((role, index) => (
            <li
              key={role.slug}
              className={`${styles.roleCard} ${styles.cardEnter} relative overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[0_10px_30px_rgba(13,39,70,0.06)] sm:p-8`}
              style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
            >
              <span aria-hidden="true" className={`${styles.roleCardAccent} absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--green-600),var(--gold-500))]`} />
              {/* The briefcase is the apply control. It sits above the card's stretched link so it goes straight to the form. */}
              <Link
                href={`/careers/${role.slug}/apply/`}
                aria-label={`${applicationForm.applyCta}: ${role.title}`}
                className={`${styles.applyTile} absolute right-5 top-5 z-[1] flex w-16 flex-col items-center gap-1.5 rounded-[12px] text-[var(--navy-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--focus-ring)] sm:right-7 sm:top-7`}
              >
                <span className="relative grid size-12 place-items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] shadow-[0_6px_16px_rgba(13,39,70,0.12)]">
                  <span aria-hidden="true" className={styles.applyRing} />
                  <span aria-hidden="true" className={styles.applyFill} />
                  <Briefcase size={26} aria-hidden="true" className={styles.applyIconDark} />
                  <Briefcase size={26} weight="fill" aria-hidden="true" className={styles.applyIconLight} />
                </span>
                <span aria-hidden="true" className="text-xs font-semibold leading-none">
                  Apply
                </span>
              </Link>
              <h3 className="pr-[5.25rem] font-display text-[clamp(1.45rem,2.6vw,1.9rem)] leading-tight text-[var(--navy-900)] sm:pr-24">
                <Link
                  href={`/careers/${role.slug}/`}
                  className="underline decoration-1 underline-offset-[6px] after:absolute after:inset-0 after:content-[''] hover:text-[var(--steel-600)] focus-visible:outline-none"
                >
                  {role.title}
                </Link>
              </h3>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-small text-[var(--ink-muted)]">
                <div className="flex items-center gap-2">
                  <MapPin size={20} weight="fill" aria-hidden="true" className="text-[var(--navy-900)]" />
                  <dt className="font-semibold text-[var(--navy-900)]">Location:</dt>
                  <dd className="m-0">{role.location}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarBlank size={20} aria-hidden="true" className="text-[var(--navy-900)]" />
                  <dt className="font-semibold text-[var(--navy-900)]">Posted:</dt>
                  <dd className="m-0">
                    <time dateTime={role.datePosted}>{formatPostedDate(role.datePosted)}</time>
                  </dd>
                </div>
              </dl>
              <p className="mt-4 max-w-[70ch] text-body leading-relaxed text-[var(--ink-muted)]">{role.summary}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
