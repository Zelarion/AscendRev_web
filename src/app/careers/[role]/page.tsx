import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, Briefcase, CalendarBlank, MapPin, Medal } from '@phosphor-icons/react/dist/ssr';
import { CareersSourceCapture } from '@/components/sections/careers/careersSource';
import { applyButtonClass } from '@/components/sections/careers/applyButtonClass';
import JsonLdScript from '@/components/seo/JsonLdScript';
import PageJsonLd from '@/components/seo/PageJsonLd';
import { applicationForm, formatPostedDate, openRoles, workLocation, type CareerRole, type RoleSection } from '@/content/careers';
import { site } from '@/content/site';
import { createSeoMetadata, type SeoMetadataInput } from '@/lib/seoMetadata';

/** Only roles that are open get a page; a closed role's URL 404s. */
export const dynamicParams = false;

export function generateStaticParams() {
  return openRoles.map((role) => ({ role: role.slug }));
}

function findRole(slug: string): CareerRole | undefined {
  return openRoles.find((role) => role.slug === slug);
}

function seoFor(role: CareerRole): SeoMetadataInput {
  return {
    title: `${role.title}, ${role.location}`,
    description: role.summary,
    canonicalPath: `/careers/${role.slug}/`,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const role = findRole((await params).role);
  return role ? createSeoMetadata(seoFor(role)) : {};
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * schema.org JobPosting for Google for Jobs, built only from the posting's
 * published text, so the structured data says exactly what the page says.
 */
function jobPosting(role: CareerRole) {
  const description = role.sections
    .map((section) =>
      [
        `<p><strong>${escapeHtml(section.heading)}</strong></p>`,
        ...(section.paragraphs ?? []).map((text) => `<p>${escapeHtml(text)}</p>`),
        section.bullets ? `<ul>${section.bullets.map((text) => `<li>${escapeHtml(text)}</li>`).join('')}</ul>` : '',
        ...(section.closing ?? []).map((text) => `<p>${escapeHtml(text)}</p>`),
      ].join('')
    )
    .join('');

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.title,
    description,
    identifier: { '@type': 'PropertyValue', name: site.name, value: role.slug },
    datePosted: role.datePosted,
    employmentType: role.schemaEmploymentType,
    directApply: true,
    url: new URL(`/careers/${role.slug}/`, site.url).toString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: site.legalName,
      sameAs: site.url,
      logo: new URL('/icon-512.png', site.url).toString(),
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: workLocation.street,
        addressLocality: workLocation.locality,
        addressRegion: workLocation.region,
        addressCountry: workLocation.country,
      },
    },
  };
}

export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const role = findRole((await params).role);
  if (!role) notFound();
  const seo = seoFor(role);
  const applyHref = `/careers/${role.slug}/apply/`;

  const facts = [
    { icon: MapPin, label: 'Location', value: role.location },
    { icon: Briefcase, label: 'Employment Type', value: role.employmentType },
    { icon: Medal, label: 'Experience', value: role.experience },
    { icon: CalendarBlank, label: 'Posted', value: formatPostedDate(role.datePosted) },
  ];

  return (
    <>
      <PageJsonLd {...seo} />
      <JsonLdScript data={jobPosting(role)} />
      <CareersSourceCapture />

      <section aria-labelledby="role-heading" className="relative isolate overflow-hidden bg-[var(--navy-900)] text-white">
        <Image src="/images/ascendrev-training-room.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-35" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(15,27,51,0.96)_0%,rgba(15,27,51,0.85)_55%,rgba(15,27,51,0.6)_100%)]" />
        <div className="mx-auto w-full max-w-[1200px] px-[var(--site-gutter)] pb-[clamp(2.5rem,6vw,4rem)] pt-[calc(var(--header-height)+clamp(2rem,6vw,4rem))]">
          <Link href="/careers/" className="inline-flex min-h-11 items-center gap-2 text-small font-semibold text-white/80 hover:text-white">
            <ArrowLeft size={16} aria-hidden="true" /> Careers
          </Link>
          <h1 id="role-heading" className="mt-3 max-w-[22ch] font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.06] tracking-[-0.025em]">
            {role.title}
          </h1>
        </div>
      </section>

      <section aria-label="Job details" className="bg-[var(--bg)] py-[clamp(2.5rem,6vw,4.5rem)]">
        <div className="mx-auto grid w-full max-w-[1200px] items-start gap-10 px-[var(--site-gutter)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
          <aside className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:order-2">
            <Link href={applyHref} className={applyButtonClass}>
              {applicationForm.applyCta}
            </Link>
            <dl className="mt-4 grid gap-5 rounded-[14px] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[0_10px_30px_rgba(13,39,70,0.06)]">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon size={22} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--navy-900)]" />
                  <div className="text-small leading-relaxed">
                    <dt className="inline font-semibold text-[var(--navy-900)]">{label}: </dt>
                    <dd className="inline text-[var(--ink-muted)]">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </aside>

          <article className="lg:order-1">
            {role.sections.map((section) => (
              <PostingSection key={section.heading} section={section} />
            ))}
            <div className="mt-10 lg:hidden">
              <Link href={applyHref} className={applyButtonClass}>
                {applicationForm.applyCta}
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

function PostingSection({ section }: { section: RoleSection }) {
  return (
    <section className="border-b border-[var(--border)] py-7 first:pt-0 last:border-b-0">
      <h2 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] leading-tight text-[var(--navy-900)]">{section.heading}</h2>
      {section.paragraphs?.map((text) => (
        <p key={text} className="mt-4 max-w-[68ch] text-body leading-relaxed text-[var(--ink)]">
          {text}
        </p>
      ))}
      {section.bullets && (
        <ul className="mt-4 grid max-w-[68ch] gap-2.5">
          {section.bullets.map((text) => (
            <li key={text} className="flex items-start gap-3 text-body leading-relaxed text-[var(--ink)]">
              <span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-[var(--green-600)]" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}
      {section.closing?.map((text) => (
        <p key={text} className="mt-4 max-w-[68ch] text-body leading-relaxed text-[var(--ink)]">
          {text}
        </p>
      ))}
    </section>
  );
}
