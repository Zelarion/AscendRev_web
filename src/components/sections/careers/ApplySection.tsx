import type { JSX } from 'react';
import { Clock, FileText, ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { applicationForm, type RoleSlug } from '@/content/careers';
import ApplicationForm from './ApplicationForm';

const POINTS = [
  { icon: Clock, text: 'About five minutes, on your phone or computer.' },
  { icon: FileText, text: 'Your resume as a PDF or DOCX file, up to 5 MB.' },
  { icon: ShieldCheck, text: 'Used only for hiring at AscendRev, kept for up to 12 months.' },
];

/** The application block shared by the careers hub and every role page. */
export default function ApplySection({ initialRole }: { initialRole?: RoleSlug }): JSX.Element {
  return (
    <section
      id="apply"
      aria-labelledby="apply-heading"
      className="relative isolate scroll-mt-[calc(var(--header-height)+1rem)] overflow-hidden bg-[var(--surface-band-raised)] py-[clamp(3.5rem,8vw,6rem)]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_26rem_at_100%_0%,rgba(240,212,123,0.18),transparent_70%),radial-gradient(44rem_24rem_at_0%_100%,rgba(50,98,146,0.12),transparent_70%)]" />
      <div className="mx-auto grid w-full max-w-[1280px] items-start gap-10 px-[var(--site-gutter)] lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-14">
        <div className="lg:sticky lg:top-[calc(var(--header-height)+2rem)]">
          <h2 id="apply-heading" className="font-display text-h2 text-[var(--navy-900)]">
            {applicationForm.heading}
          </h2>
          <p className="mt-3 max-w-[42ch] text-body text-[var(--ink-muted)]">{applicationForm.intro}</p>
          <ul className="mt-7 grid gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-small text-[var(--navy-900)]">
                <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-[var(--surface-raised)] text-[var(--green-600)] shadow-[0_2px_8px_rgba(13,39,70,0.06)]">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <ApplicationForm initialRole={initialRole} />
      </div>
    </section>
  );
}
