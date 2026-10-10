'use client';

import Link from 'next/link';
import { useMemo, useState, type JSX } from 'react';
import { ArrowRight, Briefcase, ChatsCircle, Headset, PaperPlaneTilt, UsersThree } from '@phosphor-icons/react';
import { generalApplication, openRoles, type RoleSlug, type RoleTeam } from '@/content/careers';
import { selectRole } from './roleSelection';
import styles from './careers.module.css';

const TEAM_ICON: Record<RoleTeam, typeof Headset> = {
  Sales: ChatsCircle,
  'Customer Experience': Headset,
  Leadership: UsersThree,
};

type Filter = 'All' | RoleTeam;

/**
 * The open roles, filterable by team. Each card links to the role's own page
 * (the page Google for Jobs indexes) and has a quick-apply button that fills in
 * the form further down without leaving this page.
 */
export default function RolesBoard(): JSX.Element {
  const teams = useMemo(() => Array.from(new Set(openRoles.map((role) => role.team))), []);
  const filters: Filter[] = ['All', ...teams];
  const [filter, setFilter] = useState<Filter>('All');
  const visible = filter === 'All' ? openRoles : openRoles.filter((role) => role.team === filter);

  function quickApply(slug: RoleSlug) {
    selectRole(slug);
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section id="open-roles" aria-labelledby="open-roles-heading" className="scroll-mt-[calc(var(--header-height)+1rem)] bg-[var(--bg)] py-[clamp(3.5rem,8vw,6rem)]">
      <div className="mx-auto w-full max-w-[1280px] px-[var(--site-gutter)]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-[40rem]">
            <h2 id="open-roles-heading" className="font-display text-h2 text-[var(--navy-900)]">
              Open roles
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              All roles are onsite at Alabang Town Centre, on the night shift, serving clients in North America.
            </p>
          </div>

          {filters.length > 2 && (
            <div role="group" aria-label="Filter roles by team" className="flex flex-wrap gap-2">
              {filters.map((option) => {
                const active = option === filter;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(option)}
                    className={`min-h-11 rounded-full border px-4 text-small font-medium transition-colors duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
                      active
                        ? 'border-[var(--navy-800)] bg-[var(--navy-800)] text-white'
                        : 'border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--navy-900)] hover:border-[var(--steel-600)]'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <ul className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
          {visible.map((role, index) => {
            const Icon = TEAM_ICON[role.team] ?? Briefcase;
            return (
              <li
                key={`${filter}-${role.slug}`}
                className={`${styles.roleCard} ${styles.cardEnter} relative flex flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] p-6`}
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <span aria-hidden="true" className={`${styles.roleCardAccent} absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,var(--green-600),var(--gold-500))]`} />
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-[9px] bg-[var(--surface-band-raised)] text-[var(--steel-600)]">
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <span className="text-small font-medium text-[var(--steel-600)]">{role.team}</span>
                </div>
                <h3 className="mt-5 font-display text-[1.5rem] leading-tight text-[var(--navy-900)]">
                  <Link
                    href={`/careers/${role.slug}/`}
                    className="after:absolute after:inset-0 after:content-[''] hover:text-[var(--steel-600)] focus-visible:outline-none"
                  >
                    {role.title}
                  </Link>
                </h3>
                <p className="mt-3 flex-1 text-small leading-relaxed text-[var(--ink-muted)]">{role.summary}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Role facts">
                  {role.facts.map((fact) => (
                    <li key={fact} className="rounded-full bg-[var(--surface-band-raised)] px-2.5 py-1 text-xs text-[var(--navy-900)]">
                      {fact}
                    </li>
                  ))}
                </ul>
                {/* Above the stretched link so both actions stay clickable. */}
                <div className="relative z-[1] mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-5">
                  <button
                    type="button"
                    onClick={() => quickApply(role.slug)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-[7px] bg-[var(--green-600)] px-4 text-small font-semibold text-white transition-colors duration-150 hover:bg-[var(--green-500)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    <PaperPlaneTilt size={18} aria-hidden="true" />
                    Quick apply
                  </button>
                  <Link
                    href={`/careers/${role.slug}/`}
                    className="inline-flex min-h-11 items-center gap-1.5 text-small font-semibold text-[var(--navy-900)] underline decoration-[var(--border-strong)] underline-offset-4 hover:text-[var(--steel-600)]"
                  >
                    Role details
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-[10px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-band-raised)] p-6 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-[1.35rem] text-[var(--navy-900)]">{generalApplication.title}</h3>
            <p className="mt-1 text-small text-[var(--ink-muted)]">{generalApplication.summary}</p>
          </div>
          <button
            type="button"
            onClick={() => quickApply(generalApplication.slug)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[7px] border border-[var(--navy-800)] px-4 text-small font-semibold text-[var(--navy-900)] transition-colors duration-150 hover:bg-[var(--navy-800)] hover:text-white active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            Send your resume
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
