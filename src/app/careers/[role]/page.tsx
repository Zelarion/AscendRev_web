import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, CheckCircle, MapPin } from '@phosphor-icons/react/dist/ssr';
import ApplySection from '@/components/sections/careers/ApplySection';
import CareersFaq from '@/components/sections/careers/CareersFaq';
import ShareRole from '@/components/sections/careers/ShareRole';
import JsonLdScript from '@/components/seo/JsonLdScript';
import PageJsonLd from '@/components/seo/PageJsonLd';
import { openRoles, workLocation, type CareerRole } from '@/content/careers';
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
    title: `${role.title}, Alabang (Night Shift)`,
    description: `${role.summary} Onsite at Alabang Town Centre, night shift. Apply online in about five minutes.`,
    canonicalPath: `/careers/${role.slug}/`,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const role = findRole((await params).role);
  return role ? createSeoMetadata(seoFor(role)) : {};
}

/**
 * schema.org JobPosting for Google for Jobs. Built only from the role's
 * published copy, so the structured data says exactly what the page says.
 */
function jobPosting(role: CareerRole) {
  const description = [
    `<p>${role.summary}</p>`,
    '<p><strong>What you will do</strong></p>',
    `<ul>${role.responsibilities.map((item) => `<li>${item}</li>`).join('')}</ul>`,
    '<p><strong>What we look for</strong></p>',
    `<ul>${role.requirements.map((item) => `<li>${item}</li>`).join('')}</ul>`,
    `<p>${workLocation.shift}.</p>`,
  ].join('');

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: role.title,
    description,
    identifier: { '@type': 'PropertyValue', name: site.name, value: role.slug },
    datePosted: role.datePosted,
    validThrough: `${role.validThrough}T23:59:59+08:00`,
    employmentType: role.employmentType,
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
        postalCode: workLocation.postalCode,
        addressCountry: workLocation.country,
      },
    },
  };
}

export default async function RolePage({ params }: { params: Promise<{ role: string }> }) {
  const role = findRole((await params).role);
  if (!role) notFound();
  const seo = seoFor(role);

  return (
    <>
      <PageJsonLd {...seo} />
      <JsonLdScript data={jobPosting(role)} />

      <section aria-labelledby="role-heading" className="relative isolate overflow-hidden bg-[var(--navy-900)] text-white">
        <Image src="/images/ascendrev-training-room.webp" alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-35" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(15,27,51,0.96)_0%,rgba(15,27,51,0.85)_55%,rgba(15,27,51,0.6)_100%)]" />
        <div className="mx-auto w-full max-w-[1280px] px-[var(--site-gutter)] pb-[clamp(2.5rem,6vw,4rem)] pt-[calc(var(--header-height)+clamp(2rem,6vw,4rem))]">
          <Link href="/careers/#open-roles" className="inline-flex min-h-11 items-center gap-2 text-small font-semibold text-white/80 hover:text-white">
            <ArrowLeft size={16} aria-hidden="true" /> All open roles
          </Link>
          <p className="mt-4 text-small font-medium text-[var(--gold-300)]">{role.team}</p>
          <h1 id="role-heading" className="mt-2 max-w-[20ch] font-display text-[clamp(2.2rem,5vw,3.75rem)] leading-[1.06] tracking-[-0.025em]">
            {role.title}
          </h1>
          <p className="mt-4 max-w-[58ch] text-body-lg text-white/85">{role.summary}</p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Role facts">
            {role.facts.map((fact) => (
              <li key={fact} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 text-small">
                <MapPin size={16} aria-hidden="true" className="text-[var(--gold-300)]" />
                {fact}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#apply"
              className="inline-flex min-h-12 items-center rounded-[7px] bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-6 text-sm font-semibold text-[var(--gold-ink)] transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Apply for this role
            </a>
            <ShareRole path={`/careers/${role.slug}/`} title={role.title} />
          </div>
        </div>
      </section>

      <section aria-label="Role details" className="bg-[var(--bg)] py-[clamp(3rem,7vw,5rem)]">
        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-[var(--site-gutter)] md:grid-cols-2 md:gap-14">
          <RoleList heading="What you will do" items={role.responsibilities} />
          <RoleList heading="What we look for" items={role.requirements} />
        </div>
      </section>

      <ApplySection initialRole={role.slug} />
      <CareersFaq />
    </>
  );
}

function RoleList({ heading, items }: { heading: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-display text-h2 text-[var(--navy-900)]">{heading}</h2>
      <ul className="mt-6 grid gap-4">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-body text-[var(--ink)]">
            <CheckCircle size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--green-600)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
