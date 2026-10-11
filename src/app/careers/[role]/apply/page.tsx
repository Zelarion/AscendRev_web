import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import ApplicationForm from '@/components/sections/careers/ApplicationForm';
import { applicationForm, openRoles } from '@/content/careers';
import { createSeoMetadata } from '@/lib/seoMetadata';

/** Only open roles can be applied for; a closed role's apply URL 404s. */
export const dynamicParams = false;

export function generateStaticParams() {
  return openRoles.map((role) => ({ role: role.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role: slug } = await params;
  const role = openRoles.find((candidate) => candidate.slug === slug);
  if (!role) return {};
  return {
    ...createSeoMetadata({
      title: `${applicationForm.applyCta}: ${role.title}`,
      description: role.summary,
      // The posting is the page to index and share; this screen is its form.
      canonicalPath: `/careers/${role.slug}/`,
    }),
    robots: { index: false, follow: true },
  };
}

/** The "new screen" Rio described behind "Apply for this Job". */
export default async function ApplyPage({ params }: { params: Promise<{ role: string }> }) {
  const { role: slug } = await params;
  const role = openRoles.find((candidate) => candidate.slug === slug);
  if (!role) notFound();

  return (
    <section aria-labelledby="apply-heading" className="relative isolate overflow-hidden bg-[var(--surface-band-raised)]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[22rem] bg-[linear-gradient(180deg,var(--navy-900)_0%,var(--navy-800)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_26rem_at_100%_0%,rgba(240,212,123,0.18),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-[52rem] px-[var(--site-gutter)] pb-[clamp(3.5rem,8vw,6rem)] pt-[calc(var(--header-height)+clamp(1.5rem,5vw,3rem))]">
        <Link href={`/careers/${role.slug}/`} className="inline-flex min-h-11 items-center gap-2 text-small font-semibold text-white/80 hover:text-white">
          <ArrowLeft size={16} aria-hidden="true" /> {role.title}
        </Link>
        <h1 id="apply-heading" className="mb-8 mt-2 font-display text-[clamp(2rem,4.5vw,3rem)] leading-tight text-white">
          {applicationForm.applyCta}
        </h1>
        <ApplicationForm role={role.slug} />
      </div>
    </section>
  );
}
