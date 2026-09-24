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
        tone="navy"
        className="relative isolate flex min-h-[500px] items-end overflow-hidden !pt-[clamp(5.5rem,8vw,7rem)] !pb-[clamp(2.5rem,4vw,3.5rem)]"
      >
        {/*
          This band previously pulled its background from an unrelated
          accounting firm's server. That is someone else's asset served off
          someone else's bandwidth on AscendRev's own contact page, and it
          breaks the client's stated requirement that the site depend on no
          other company or website. Removed rather than swapped for another
          stock photograph: no approved AscendRev photograph exists yet, and a
          picture of premises they do not own would be the same problem again.

          The band now renders on its own tonal gradient, which needs no
          network request and cannot break when a third party moves a file.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(120%_120%_at_18%_0%,rgba(47,85,150,0.55)_0%,rgba(22,41,77,0.92)_46%,rgba(8,16,30,1)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,12,24,0.72)_0%,rgba(3,12,24,0.42)_48%,rgba(3,12,24,0.18)_100%)]"
        />

        <Container>
          <div className="max-w-[920px]">
            <h1 className="max-w-[18ch] font-display text-h1 text-white">{hero.headline}</h1>
            <p className="mt-4 max-w-[62ch] text-body-lg leading-relaxed text-[var(--steel-400)]">
              {hero.subheadline}
            </p>
          </div>
        </Container>
      </Section>

      <section className="bg-[#0a1422] py-[clamp(6rem,8vw,7.5rem)] text-white">
        <div className="mx-auto grid w-full max-w-[1200px] gap-[clamp(3rem,6vw,5.5rem)] px-6 sm:px-8 lg:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)] lg:items-start">
          <aside className="lg:sticky lg:top-[120px] lg:self-start">
            <h2 className="max-w-[16ch] font-display text-[clamp(2.5rem,4vw,4rem)] font-medium leading-[0.98] tracking-[-0.035em] text-white">
              {whatToExpect.heading}
            </h2>

            <div className="mt-9 border-t border-white/10">
              {whatToExpect.steps.map((item, index) => (
                <div
                  key={item.title}
                  className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 border-b border-white/10 py-6"
                >
                  <span
                    aria-hidden="true"
                    className="pt-0.5 font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--gold-300)]"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <h3 className="font-display text-[clamp(1.15rem,1.7vw,1.4rem)] font-medium leading-[1.2] tracking-[-0.01em] text-white/94">
                    {item.title}
                  </h3>
                </div>
              ))}
            </div>

            <div className="mt-9 border-t border-white/10 pt-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-300)] sm:text-[11px]">
                {directContact.heading}
              </p>

              <ul className="mt-4 space-y-2 text-[14px] leading-6 text-white/72">
                <li>
                  <a
                    href={`mailto:${site.contactEmail}`}
                    className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
                  >
                    {site.contactEmail}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${site.phone.replace(/[^+\d]/g, '')}`}
                    className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
                  >
                    {site.phone}
                  </a>
                </li>
                <li>Head Office: {site.address}</li>
              </ul>

              {site.slaLine && (
                <p className="mt-6 max-w-[42ch] text-[12px] leading-5 text-white/38">
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
