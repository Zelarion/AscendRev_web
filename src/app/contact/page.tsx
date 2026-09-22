import type { Metadata } from 'next';
import ContactEnquiryForm from '@/components/sections/contact/ContactEnquiryForm';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { contact } from '@/content/contact';

export const metadata: Metadata = {
  title: contact.meta.title,
  description: contact.meta.description,
  alternates: {
    canonical: '/contact/',
  },
};

const blueprintLabels = [
  'COST EFFICIENCY DIAGNOSTICS',
  'TALENT SCOPING',
  'TECH-STACK INTEGRATION',
] as const;

export default function ContactPage() {
  const { hero, whatToExpect, form } = contact;

  return (
    <>
      <Section
        tone="navy"
        className="relative isolate flex min-h-[500px] items-end overflow-hidden !pt-[clamp(5.5rem,8vw,7rem)] !pb-[clamp(2.5rem,4vw,3.5rem)]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://homesteadaccountinggroup.com/assets/5ef4e42eab9e406fda20582c485ed67d7f56415f-BrfJDp0e.png")',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,12,24,0.88)_0%,rgba(3,12,24,0.74)_48%,rgba(3,12,24,0.52)_100%)]"
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-300)] sm:text-[11px]">
              WHAT TO EXPECT
            </p>

            <h2 className="mt-4 max-w-[12ch] font-display text-[clamp(2.5rem,4vw,4rem)] font-medium leading-[0.98] tracking-[-0.035em] text-white">
              {whatToExpect.heading}
            </h2>

            <p className="mt-5 max-w-[42ch] text-[15px] leading-7 text-white/52">
              {whatToExpect.intro}
            </p>

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

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/34 sm:text-[10px]">
                      {blueprintLabels[index]}
                    </p>
                    <h3 className="mt-2 font-display text-[clamp(1.45rem,2.1vw,1.9rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white/94">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[13px] leading-6 text-white/48">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
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
