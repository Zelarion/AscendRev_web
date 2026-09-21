import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import { site } from '@/content/site';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: "A readable summary of AscendRev's client-owned terms of service for website visitors.",
  alternates: {
    canonical: '/terms/',
  },
};

export default function TermsPage() {
  return (
    <Section size="large">
      <div className="mx-auto w-full max-w-[1200px] px-[clamp(1.25rem,5vw,4rem)]">
        <div className="max-w-[68ch]">
          <h1 className="text-h1 font-display font-medium tracking-[-0.025em] text-[var(--ink)]">
            Terms of Use
          </h1>
          <p className="mt-4 text-body-lg text-[var(--ink-muted)]">Effective September 19, 2026</p>
          <p className="mt-8 border-l-2 border-[var(--steel-600)] pl-5 text-body text-[var(--ink-muted)]">
            This page is a readable summary of a client-owned terms of service document for {site.legalName}.
            For the full terms or a question about them, please{' '}
            <Link href="/contact" className="text-[var(--steel-600)] underline underline-offset-2 outline-none">
              contact AscendRev
            </Link>
            .
          </p>
        </div>

        <div className="mt-14 max-w-[68ch] space-y-10">
          <section aria-labelledby="terms-scope">
            <h2 id="terms-scope" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Website use and scope
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              By using this website or submitting an enquiry, you agree to the terms. They govern website use
              only. A separate signed proposal, statement of work, or service agreement governs any contracted
              services and takes priority where it conflicts with these terms.
            </p>
          </section>

          <section aria-labelledby="terms-use">
            <h2 id="terms-use" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Acceptable use
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              Use the website lawfully. Do not attempt unauthorized access, interfere with its operation or
              security, transmit harmful material, scrape content without permission, impersonate others, or
              use the website for fraud or other unlawful activity.
            </p>
          </section>

          <section aria-labelledby="terms-enquiries">
            <h2 id="terms-enquiries" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Enquiries, services, and results
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              An enquiry does not create a client relationship or guarantee services. Website information,
              estimates, and timelines are informational unless a written agreement says otherwise. AscendRev
              does not guarantee a specific number of leads, sales, revenue, or other business outcome unless a
              signed agreement expressly provides it.
            </p>
          </section>

          <section aria-labelledby="terms-content">
            <h2 id="terms-content" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Content and information you provide
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              Website content and branding are owned by or licensed to AscendRev unless stated otherwise. You
              may view them to evaluate AscendRev&apos;s services, but may not reuse them without permission except
              where the law allows. You are responsible for the accuracy of information you submit and your
              right to provide it.
            </p>
          </section>

          <section aria-labelledby="terms-availability">
            <h2 id="terms-availability" className="text-h2 font-display font-medium tracking-[-0.02em]">
              Availability, privacy, and changes
            </h2>
            <p className="mt-3 text-body text-[var(--ink-muted)]">
              AscendRev makes reasonable efforts to keep this website available and current but cannot promise
              uninterrupted, error-free, or fully secure access. The terms may be updated and the website may
              change. Personal information is handled under the{' '}
              <Link href="/privacy" className="text-[var(--steel-600)] underline underline-offset-2 outline-none">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </Section>
  );
}
