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
        className="relative isolate flex min-h-[380px] items-end overflow-hidden border-b border-[var(--line-on-band)] !pt-[clamp(5.5rem,8vw,7rem)] !pb-[clamp(2.5rem,4vw,3.5rem)] sm:min-h-[430px] lg:min-h-[500px]"
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

        <Container>
          <div className="max-w-[920px]">
            <h1 className="max-w-[18ch] font-display text-h1 text-[var(--navy-900)]">{hero.headline}</h1>
            <p className="mt-4 max-w-[62ch] text-body-lg leading-relaxed text-[var(--text-on-band-muted)]">
              {hero.subheadline}
            </p>
          </div>
        </Container>
      </Section>

      <section className="bg-[var(--surface-page)] py-[var(--section-space,clamp(3.5rem,8vw,8rem))] text-[var(--text-primary)]">
        <div className="mx-auto grid w-full max-w-[1200px] gap-9 px-[var(--site-gutter,clamp(1.25rem,5vw,4rem))] sm:gap-12 lg:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)] lg:items-start lg:gap-[clamp(3rem,6vw,5.5rem)]">
          <aside className="lg:sticky lg:top-[120px] lg:self-start">
            <h2 className="max-w-[16ch] font-display text-[clamp(2.5rem,4vw,4rem)] font-medium leading-[0.98] tracking-[-0.035em] text-[var(--navy-900)]">
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

                  <h3 className="font-display text-[clamp(1.15rem,1.7vw,1.4rem)] font-medium leading-[1.2] tracking-[-0.01em] text-[var(--text-on-band)]">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>

            <div className="mt-9 border-t border-[var(--line-on-band)] pt-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-text)] sm:text-[11px]">
                {directContact.heading}
              </p>

              <ul className="mt-4 space-y-2 text-[14px] leading-6 text-[var(--text-on-band-muted)]">
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
                <p className="mt-6 max-w-[42ch] text-[12px] leading-5 text-[var(--text-on-band-muted)]">
                  {site.slaLine}
                </p>
              )}
            </div>
          </aside>

          <div className="w-full lg:max-w-[700px] lg:justify-self-end">
            <ContactEnquiryForm content={form} />
          </div>
        </div>
      </section>
    </>
  );
}
