import Image from 'next/image';
import ContactEnquiryForm from '@/components/sections/contact/ContactEnquiryForm';
import EnquiryGuide from '@/components/sections/contact/EnquiryGuide';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import AtmosphereLayer from '@/components/sections/shared/AtmosphereLayer';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import { contact } from '@/content/contact';
import { site } from '@/content/site';
import { createSeoMetadata } from '@/lib/seoMetadata';

export const metadata = createSeoMetadata({
  title: contact.meta.title,
  description: contact.meta.description,
  canonicalPath: '/contact/',
});

export default function ContactPage() {
  const { hero, whatToExpect, form } = contact;

  return (
    <>
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

            <figure className="relative isolate m-0 hidden aspect-[16/10] min-h-[17rem] w-full min-w-0 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--navy-900)] lg:block">
              <Image
                src="/images/ascendrev-home-hero-team.png"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 46vw, 100vw"
                className="object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#071a34]/40 via-transparent to-[#071a34]/5" />
              <address className="absolute inset-x-3 bottom-3 not-italic rounded-[9px] border border-white/80 bg-white/[0.96] p-4 shadow-[0_16px_40px_rgba(7,26,52,0.2)] backdrop-blur-md sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[88%] sm:max-w-[29rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-5">
                <p className="text-label font-semibold uppercase tracking-[0.2em] text-[var(--steel-600)]">
                  DIRECT CONTACT
                </p>
                <h2 className="mt-2 font-display text-h2 text-[var(--navy-900)]">Rio Vidal</h2>
                <ul className="mt-3 grid gap-2.5 text-small text-[var(--navy-900)]">
                  <li className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface-band-raised)] text-[var(--steel-600)]">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
                    </span>
                    <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`} className="min-w-0 [overflow-wrap:anywhere] underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--steel-600)]">
                      {site.phone}
                    </a>
                  </li>
                  <li className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface-band-raised)] text-[var(--steel-600)]">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>
                    </span>
                    <a href={`mailto:${site.contactEmail}`} className="min-w-0 [overflow-wrap:anywhere] underline decoration-[var(--border)] underline-offset-4 hover:text-[var(--steel-600)]">
                      {site.contactEmail}
                    </a>
                  </li>
                  <li className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface-band-raised)] text-[var(--steel-600)]">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    </span>
                    <span className="min-w-0 [overflow-wrap:anywhere]">Head Office: {site.address}</span>
                  </li>
                </ul>
              </address>
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
