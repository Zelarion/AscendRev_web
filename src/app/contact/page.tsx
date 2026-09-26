import type { Metadata } from 'next';
import ContactEnquiryForm from '@/components/sections/contact/ContactEnquiryForm';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { contact } from '@/content/contact';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: contact.meta.title,
  description: contact.meta.description,
  alternates: {
    canonical: '/contact/',
  },
};

export default function ContactPage() {
  const { hero, whatToExpect, form, directContact } = contact;

  return (
    <>
      <Section
        tone="light"
        className="relative isolate flex items-start overflow-hidden border-b border-[var(--line-on-band)] !pt-[calc(var(--header-height)_+_3rem)] !pb-[clamp(2rem,3vw,2.5rem)]"
      >
        {/*
          This band previously pulled its background from an unrelated
          accounting firm's server. That is someone else's asset served off
          someone else's bandwidth on AscendRev's own contact page, and it
          breaks the client's stated requirement that the site depend on no
          other company or website. Removed rather than swapped for another
          stock photograph: no approved AscendRev photograph exists yet, and a
          picture of premises they do not own would be the same problem again.

          The client was explicit that the primary surface is white, not a
          lighter navy, so the band no longer carries a navy vignette at all.
          What is left is a faint top-down tint toward the page's own white,
          plus the hairline below, so the hero still reads as an opening
          rather than a bare paragraph.
        */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[var(--surface-page)]" />

        <Container className="lg:max-w-[1600px]">
          <div className="max-w-[920px] lg:max-w-none">
            <h1
              className="font-display text-h1 text-[var(--navy-900)] lg:whitespace-nowrap"
            >
              {hero.headline}
            </h1>
            <p className="mt-3 text-body-lg leading-relaxed text-[var(--text-on-band-muted)] lg:max-w-none">
              {hero.subheadline}
            </p>
          </div>
        </Container>
      </Section>

      <section className="bg-[var(--surface-page)] py-[clamp(2.5rem,5vw,4rem)] text-[var(--text-primary)]">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-[var(--site-gutter,clamp(1.25rem,5vw,4rem))] sm:gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-[clamp(2.5rem,5vw,5rem)]">
          <aside className="lg:sticky lg:top-[120px] lg:self-start">
            <h2 className="font-display text-h2 text-[var(--navy-900)]">
              {whatToExpect.heading}
            </h2>

            <div className="mt-6 border-t border-[var(--line-on-band)] sm:mt-8">
              {whatToExpect.steps.map((item, index) => (
                <div
                  key={item.title}
                  className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-3 border-b border-[var(--line-on-band)] py-4 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-x-4 sm:py-5"
                >
                  <span
                    aria-hidden="true"
                    className="pt-0.5 font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--gold-text)]"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <h3 className="font-display text-h3 text-[var(--text-on-band)]">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>

            <div className="mt-9 border-t border-[var(--line-on-band)] pt-9">
              <p className="text-label font-semibold uppercase tracking-[0.24em] text-[var(--gold-text)]">
                {directContact.heading}
              </p>

              <ul className="mt-4 space-y-2 text-small text-[var(--text-on-band-muted)]">
                <li>
                  <a
                    href={`mailto:${site.contactEmail}`}
                    className="underline decoration-[var(--line-on-band)] underline-offset-4 transition-colors hover:text-[var(--navy-900)]"
                  >
                    {site.contactEmail}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${site.phone.replace(/[^+\d]/g, '')}`}
                    className="underline decoration-[var(--line-on-band)] underline-offset-4 transition-colors hover:text-[var(--navy-900)]"
                  >
                    {site.phone}
                  </a>
                </li>
                <li>Head Office: {site.address}</li>
              </ul>

              {site.slaLine && (
                <p className="mt-4 text-small text-[var(--text-on-band-muted)]">
                  {site.slaLine}
                </p>
              )}
            </div>
          </aside>

          <div className="w-full lg:justify-self-end">
            <ContactEnquiryForm content={form} />
          </div>
        </div>
      </section>
    </>
  );
}
