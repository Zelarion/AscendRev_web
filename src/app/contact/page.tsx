import Image from 'next/image';
import ContactEnquiryForm from '@/components/sections/contact/ContactEnquiryForm';
import EnquiryGuide from '@/components/sections/contact/EnquiryGuide';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import AtmosphereLayer from '@/components/sections/shared/AtmosphereLayer';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import { contact } from '@/content/contact';
import { site } from '@/content/site';
import PageJsonLd from '@/components/seo/PageJsonLd';
import { createSeoMetadata, type SeoMetadataInput } from '@/lib/seoMetadata';

const seo: SeoMetadataInput = {
  title: contact.meta.title,
  description: contact.meta.description,
  canonicalPath: '/contact/',
};

export const metadata = createSeoMetadata(seo);

export default function ContactPage() {
  const { hero, whatToExpect, form } = contact;

  return (
    <>
      <PageJsonLd {...seo} />
      <Section
        tone="light"
        className="relative isolate overflow-hidden border-b border-[var(--line-on-band)] !pt-[calc(var(--header-height)_+_1.25rem)] !pb-[clamp(2rem,4vw,3rem)]"
      >
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[var(--surface-page)]" />
        <AtmosphereLayer variant="route-accent" className="opacity-20" />
        <Container className="relative z-[1] lg:max-w-[1600px]">
          <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-12">
            <div className="min-w-0 text-left">
              <p className="text-label font-semibold uppercase tracking-[0.18em] text-[var(--steel-600)] sm:tracking-[0.22em]">
                STRATEGIC OUTSOURCING &amp; OFFSHORING SOLUTIONS
              </p>
              <h1 className="mt-3 max-w-[15ch] font-display text-h1 text-[var(--navy-900)]">
                {hero.headline}
              </h1>
              <p className="mt-3 max-w-[56ch] text-body-lg font-semibold text-[var(--navy-900)]">
                {hero.tagline}
              </p>
              <p className="mt-4 max-w-[56ch] text-body-lg leading-relaxed text-[var(--ink-muted)]">
                {hero.description}
              </p>
              <address className="mt-5 rounded-[9px] border border-[var(--border)] bg-[var(--surface-raised)] p-4 not-italic shadow-[0_8px_22px_rgba(13,39,70,0.06)] lg:hidden">
                <p className="text-label font-semibold uppercase tracking-[0.2em] text-[var(--steel-600)]">
                  DIRECT CONTACT
                </p>
                <p className="mt-1 font-display text-[1.5rem] leading-tight text-[var(--navy-900)]">Rio Vidal</p>
                <div className="mt-3 flex min-w-0 flex-wrap gap-x-4 gap-y-2 text-small text-[var(--navy-900)]">
                  <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`} className="underline decoration-[var(--border)] underline-offset-4 [overflow-wrap:anywhere] hover:text-[var(--steel-600)]">
                    {site.phone}
                  </a>
                  <a href={`mailto:${site.contactEmail}`} className="underline decoration-[var(--border)] underline-offset-4 [overflow-wrap:anywhere] hover:text-[var(--steel-600)]">
                    {site.contactEmail}
                  </a>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--ink-muted)]">Head Office: {site.address}</p>
              </address>
              <p className="mt-3 max-w-[56ch] text-body leading-relaxed text-[var(--ink-muted)]">
                {hero.subheadline}
              </p>
              <a
                href="#what-to-expect-heading"
                className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-[7px] bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 py-3 text-sm font-semibold text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.16)] transition-[transform,filter] hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                See the 3-step blueprint
                <span aria-hidden="true">→</span>
              </a>
            </div>

            {/*
              The contact details are part of the artwork itself (client
              supplied), so it renders at its native aspect with no cropping:
              object-cover or a min-height would cut the printed details off.
              Below lg the coded <address> above carries the same details as
              tap-to-call / mailto links.
            */}
            <figure className="relative m-0 hidden aspect-[1570/1002] w-full min-w-0 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] lg:block">
              <Image
                src="/images/contact-direct-rio-vidal-v3.webp"
                alt={`Direct contact: Rio Vidal, ${site.phone}, ${site.contactEmail}, Head Office: Calgary, AB, Canada.`}
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-contain"
              />
            </figure>
          </div>
        </Container>
      </Section>

      <section className="bg-[var(--bg)] py-[clamp(2.5rem,5vw,4.5rem)] text-[var(--ink)]">
        <Container className="lg:max-w-[1600px]">
          <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:gap-10 xl:gap-14">
            <EnquiryGuide content={whatToExpect} />
            <RevealOnScroll className="min-w-0">
              <div id="solution-blueprint" className="scroll-mt-[calc(var(--header-height)_+_1rem)]">
                <ContactEnquiryForm content={form} />
              </div>
            </RevealOnScroll>
          </div>
        </Container>
      </section>
    </>
  );
}
