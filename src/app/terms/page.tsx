import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import { site } from '@/content/site';

/**
 * The website terms, stated in full rather than summarised.
 *
 * Same reasoning as the privacy page: the previous version described itself as
 * a summary and referred the reader to a fuller document that does not exist.
 *
 * Scope is deliberately narrow, because the site is narrow. There are no
 * accounts, no payments, no downloads and no user-generated content, so the
 * usual clauses covering those would describe a product nobody is using. What
 * remains is what actually applies: the enquiry form is not a contract, the
 * content is informational, the brand and copy belong to AscendRev, and
 * disputes are governed by Alberta law.
 *
 * Client engagements are governed by their own signed agreement. Nothing here
 * should imply that a services contract lives on a website terms page.
 */

const LAST_UPDATED = 'September 23, 2026';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'The terms that apply to visitors of the AscendRev Outsourcing Services Corp. website, including enquiries, content ownership and governing law.',
  alternates: {
    canonical: '/terms/',
  },
};

const headingClass = 'text-h2 font-display font-medium tracking-[-0.02em] text-[var(--ink)]';
const bodyClass = 'mt-3 text-body text-[var(--ink-muted)]';
const listClass = 'mt-4 space-y-2 text-body text-[var(--ink-muted)]';
const linkClass = 'text-[var(--steel-600)] underline underline-offset-2 outline-none';

export default function TermsPage() {
  return (
    <Section size="large">
      <div className="mx-auto w-full max-w-[1200px] px-[clamp(1.25rem,5vw,4rem)]">
        <div className="max-w-[68ch]">
          <h1 className="text-h1 font-display font-medium tracking-[-0.025em] text-[var(--ink)]">
            Terms of Use
          </h1>
          <p className="mt-4 text-body-lg text-[var(--ink-muted)]">
            Last updated {LAST_UPDATED}
          </p>
          <p className="mt-8 border-l-2 border-[var(--steel-600)] pl-5 text-body text-[var(--ink-muted)]">
            These are the complete terms for using this website, operated by {site.legalName}.
            Using the site means you accept them. If you engage AscendRev for services, that work
            is governed by a separate signed agreement, not by this page.
          </p>
        </div>

        <div className="mt-14 max-w-[68ch] space-y-10">
          <section aria-labelledby="terms-site">
            <h2 id="terms-site" className={headingClass}>
              What this site is
            </h2>
            <p className={bodyClass}>
              This website describes the outsourcing and offshoring services offered by{' '}
              {site.legalName}. It is informational. There are no accounts to create, nothing to
              buy, nothing to download, and no way to publish content on it.
            </p>
          </section>

          <section aria-labelledby="terms-enquiry">
            <h2 id="terms-enquiry" className={headingClass}>
              Enquiries are not contracts
            </h2>
            <p className={bodyClass}>
              Submitting the enquiry form starts a conversation. It does not create an agreement,
              reserve capacity, or oblige either of us to anything. Nothing on this site is an
              offer capable of acceptance, and any figures shown are indicative until confirmed in
              writing for your specific requirements.
            </p>
            <p className={bodyClass}>
              A binding engagement begins only when both parties sign a services agreement setting
              out scope, price and terms.
            </p>
          </section>

          <section aria-labelledby="terms-use">
            <h2 id="terms-use" className={headingClass}>
              Using the site properly
            </h2>
            <p className={bodyClass}>When using this site, please do not:</p>
            <ul className={listClass}>
              <li>&bull; Submit false information, or submit an enquiry on someone else&apos;s behalf without their knowledge.</li>
              <li>&bull; Use the enquiry form to send unsolicited advertising or bulk messages.</li>
              <li>&bull; Attempt to gain access to any part of the site or its hosting that is not published.</li>
              <li>&bull; Interfere with the site&apos;s operation, or submit anything designed to damage it.</li>
              <li>&bull; Copy the site&apos;s content or design for use elsewhere without our permission.</li>
            </ul>
            <p className={bodyClass}>
              We limit how often the enquiry form can be submitted from one connection. This is
              there to stop abuse, and it occasionally catches ordinary use. If it stops you
              unfairly, email us and we will reply the same way we would have anyway.
            </p>
          </section>

          <section aria-labelledby="terms-accuracy">
            <h2 id="terms-accuracy" className={headingClass}>
              Accuracy of content
            </h2>
            <p className={bodyClass}>
              We take care that what we publish here is accurate, and we correct errors when we
              find them. Even so, the content is provided for general information, may change
              without notice, and should not be relied on as advice for your specific situation.
              Ask us directly and we will answer for your circumstances.
            </p>
          </section>

          <section aria-labelledby="terms-ip">
            <h2 id="terms-ip" className={headingClass}>
              Ownership
            </h2>
            <p className={bodyClass}>
              The AscendRev name, logo, written content, design and layout of this site belong to{' '}
              {site.legalName} or are used with permission. You may read, print and share pages
              for your own reference. You may not republish, resell or present them as your own.
            </p>
            <p className={bodyClass}>
              Any other company, product or certification names mentioned belong to their
              respective owners. Mentioning them does not imply a partnership, endorsement or
              affiliation.
            </p>
          </section>

          <section aria-labelledby="terms-links">
            <h2 id="terms-links" className={headingClass}>
              Links to other sites
            </h2>
            <p className={bodyClass}>
              Where we link to another website, we do not control it and are not responsible for
              its content or its handling of your information. Their terms and privacy practices
              apply once you leave this site.
            </p>
          </section>

          <section aria-labelledby="terms-availability">
            <h2 id="terms-availability" className={headingClass}>
              Availability
            </h2>
            <p className={bodyClass}>
              We aim to keep the site available, but we do not guarantee it will be uninterrupted
              or error free. We may change, suspend or withdraw any part of it at any time. If
              the enquiry form is unavailable when you need it, email us at{' '}
              <a href={`mailto:${site.contactEmail}`} className={linkClass}>
                {site.contactEmail}
              </a>{' '}
              and nothing is lost.
            </p>
          </section>

          <section aria-labelledby="terms-liability">
            <h2 id="terms-liability" className={headingClass}>
              Limitation of liability
            </h2>
            <p className={bodyClass}>
              To the extent permitted by law, {site.legalName} is not liable for indirect or
              consequential loss arising from your use of this website, including lost profits or
              lost business opportunity.
            </p>
            <p className={bodyClass}>
              Nothing in these terms limits liability that cannot be limited by law, including
              liability for fraud, or for death or personal injury caused by negligence. If you
              are a consumer, these terms do not affect your statutory rights.
            </p>
          </section>

          <section aria-labelledby="terms-privacy">
            <h2 id="terms-privacy" className={headingClass}>
              Privacy
            </h2>
            <p className={bodyClass}>
              How we handle personal information submitted through this site is set out in full in
              our{' '}
              <Link href="/privacy/" className={linkClass}>
                privacy policy
              </Link>
              . It is short, specific, and worth the two minutes.
            </p>
          </section>

          <section aria-labelledby="terms-law">
            <h2 id="terms-law" className={headingClass}>
              Governing law
            </h2>
            <p className={bodyClass}>
              These terms are governed by the laws of the Province of Alberta and the federal laws
              of Canada that apply there. Any dispute relating to this website will be heard by
              the courts of Alberta.
            </p>
          </section>

          <section aria-labelledby="terms-changes">
            <h2 id="terms-changes" className={headingClass}>
              Changes and contact
            </h2>
            <p className={bodyClass}>
              We may update these terms. The date at the top shows when they last changed, and
              the version published here is the one that applies.
            </p>
            <p className={bodyClass}>
              Questions about these terms go to{' '}
              <a href={`mailto:${site.contactEmail}`} className={linkClass}>
                {site.contactEmail}
              </a>
              , or write to {site.legalName} at {site.address}.
            </p>
          </section>
        </div>
      </div>
    </Section>
  );
}
