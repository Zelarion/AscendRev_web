import type { Metadata } from 'next';
import ContactEnquiryForm from '@/components/sections/contact/ContactEnquiryForm';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import Reveal from '@/components/ui/Reveal';
import Stagger from '@/components/ui/Stagger';
import { contact } from '@/content/contact';

export const metadata: Metadata = {
  title: contact.meta.title,
  description: contact.meta.description,
  alternates: {
    canonical: '/contact/',
  },
};

/**
 * The route stays server-rendered so the contact proposition and expectation
 * sequence remain useful without JavaScript. Only the form state and transport
 * live in the client leaf below.
 */
export default function ContactPage() {
  const { hero, whatToExpect, form } = contact;

  return (
    <>
      <Section tone="navy" size="large">
        <Container>
          <h1 className="max-w-[18ch] font-display text-display text-white">{hero.headline}</h1>
          <p className="mt-8 max-w-[62ch] text-body-lg text-[var(--steel-400)]">{hero.subheadline}</p>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-y-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-x-20">
            <div className="order-2 lg:order-1">
              <Reveal>
                <h2 className="max-w-[15ch] font-display text-h2 text-[var(--ink)]">
                  {whatToExpect.heading}
                </h2>
                <p className="mt-6 max-w-[48ch] text-body-lg text-[var(--ink-muted)]">
                  {whatToExpect.intro}
                </p>
              </Reveal>

              <Stagger as="ol" className="mt-12 border-t border-[var(--border)]">
                {whatToExpect.steps.map((item, index) => (
                  <li
                    key={item.title}
                    className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 border-b border-[var(--border)] py-7 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-x-6"
                  >
                    <span
                      aria-hidden="true"
                      className="pt-1 font-mono text-label text-[var(--ink-muted)]"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-h3 text-[var(--ink)]">{item.title}</h3>
                      <p className="mt-3 text-body text-[var(--ink-muted)]">{item.body}</p>
                    </div>
                  </li>
                ))}
              </Stagger>
            </div>

            <div className="order-1 lg:order-2">
              <ContactEnquiryForm content={form} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
