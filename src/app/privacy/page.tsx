import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: "A readable summary of AscendRev's client-owned privacy policy for website visitors and enquiries.",
  alternates: {
    canonical: '/privacy/',
  },
};

export default function PrivacyPage() {
  return (
    <Section size="large">
      <div className="mx-auto w-full max-w-[1200px] px-[clamp(1.25rem,5vw,4rem)]">
        <div className="max-w-[68ch]">
          <h1 className="text-h1 font-display font-medium tracking-[-0.025em] text-[var(--ink)]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-body-lg text-[var(--ink-muted)]">Effective September 19, 2026</p>
          <p className="mt-8 border-l-2 border-[var(--steel-600)] pl-5 text-body text-[var(--ink-muted)]">
            This page is a readable summary of a client-owned privacy policy for {site.legalName}. For
            the full policy or a privacy request, please{' '}
            <Link href="/contact" className="text-[var(--steel-600)] underline underline-offset-2 outline-none">
              contact AscendRev
            </Link>
            .
          </p>
        </div>

        <div className="mt-14 max-w-[68ch] space-y-10">
          <section aria-labelledby="privacy-information">
            <h2 id="privacy-information" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Information covered
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              AscendRev may collect information you provide in an enquiry, such as your name, organization,
              work contact details, business needs, budget range, and team requirements. Limited technical
              information may also be collected when website technologies are active.
            </p>
          </section>

          <section aria-labelledby="privacy-use">
            <h2 id="privacy-use" className="text-h2 font-display font-medium tracking-[-0.02em]">
              How information is used
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              Information is used to respond to enquiries, discuss services, prepare proposals or
              recommendations, manage business relationships and records, protect systems, and meet legal or
              administrative requirements. AscendRev does not sell personal information.
            </p>
          </section>

          <section aria-labelledby="privacy-sharing">
            <h2 id="privacy-sharing" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Service providers and safeguards
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              AscendRev may use service providers for its website, communications, CRM, hosting, security,
              and operations. The full policy identifies HubSpot as its CRM and explains that some processing
              may occur outside Canada. AscendRev uses reasonable safeguards, but no online system can be
              guaranteed completely secure.
            </p>
          </section>

          <section aria-labelledby="privacy-choices">
            <h2 id="privacy-choices" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Your choices and requests
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              Where applicable, you may withdraw consent and request access to or correction of personal
              information. AscendRev may need to verify identity before responding. Information is retained
              only as long as reasonably necessary for the stated purposes and legal or business requirements.
            </p>
          </section>

          <section aria-labelledby="privacy-cookies">
            <h2 id="privacy-cookies" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Cookies and updates
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              The policy addresses cookies and similar technologies, including consent where required. It may
              be updated when AscendRev&apos;s business, technology, services, or legal requirements change.
              Please review the full policy for the complete terms.
            </p>
          </section>
        </div>
      </div>
    </Section>
  );
}
