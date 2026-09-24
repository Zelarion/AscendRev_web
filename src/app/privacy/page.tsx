import type { Metadata } from 'next';
import Link from 'next/link';
import Section from '@/components/layout/Section';
import { site } from '@/content/site';

/**
 * The privacy policy, stated in full rather than summarised.
 *
 * The previous version described itself as "a readable summary of a
 * client-owned privacy policy" and referred the reader to a full policy for
 * the complete terms. No such document exists, which left the page pointing at
 * nothing. PIPEDA's openness principle requires an organisation to make its
 * personal-information policies readily available, so a summary deferring to
 * an unavailable document is weaker than a complete policy on the page.
 *
 * Every statement here is checked against what the site actually does:
 *  - the field list matches `src/lib/enquirySchema.ts` exactly;
 *  - "no analytics, no advertising, no third-party tracking" is literally true,
 *    verified by searching the source for any such script;
 *  - the two browser storage keys are the only ones written anywhere
 *    (`ascendrev-cookie-consent` and the theme key in `src/lib/theme.ts`);
 *  - the IP statement matches `public/api/enquiry.php`, which stores a
 *    truncated SHA-256 hash and never the address itself.
 *
 * If any of those change, this page changes with them. A privacy policy that
 * drifts from the system it describes is worse than none, because it is a
 * written claim that is no longer true.
 */

const LAST_UPDATED = 'September 23, 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How AscendRev Outsourcing Services Corp. collects, uses, stores and protects personal information submitted through this website.',
  alternates: {
    canonical: '/privacy/',
  },
};

const headingClass = 'text-h2 font-display font-medium tracking-[-0.02em] text-[var(--ink)]';
const bodyClass = 'mt-3 text-body text-[var(--ink-muted)]';
const listClass = 'mt-4 space-y-2 text-body text-[var(--ink-muted)]';
const linkClass =
  'text-[var(--steel-600)] underline underline-offset-2 outline-none';

export default function PrivacyPage() {
  return (
    <Section size="large">
      <div className="mx-auto w-full max-w-[1200px] px-[var(--site-gutter,clamp(1.25rem,5vw,4rem))]">
        <div className="max-w-[68ch]">
          <h1 className="text-h1 font-display font-medium tracking-[-0.025em] text-[var(--ink)]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-body-lg text-[var(--ink-muted)]">
            Last updated {LAST_UPDATED}
          </p>
          <p className="mt-8 border-l-2 border-[var(--steel-600)] pl-5 text-body text-[var(--ink-muted)]">
            This is the complete privacy policy for {site.legalName}. It describes exactly what
            this website collects, why, where it goes, and what you can ask us to do about it.
            It is written to be read rather than skimmed past.
          </p>
        </div>

        <div className="mt-10 max-w-[68ch] space-y-8 sm:mt-14 sm:space-y-10">
          <section aria-labelledby="privacy-who">
            <h2 id="privacy-who" className={headingClass}>
              Who is responsible
            </h2>
            <p className={bodyClass}>
              {site.legalName} is responsible for the personal information described here. We are
              registered in Canada and based at {site.address}. Questions, requests and complaints
              about privacy go to{' '}
              <a href={`mailto:${site.contactEmail}`} className={linkClass}>
                {site.contactEmail}
              </a>
              .
            </p>
          </section>

          <section aria-labelledby="privacy-collect">
            <h2 id="privacy-collect" className={headingClass}>
              What we collect
            </h2>
            <p className={bodyClass}>
              We collect personal information in one place only: the enquiry form on our contact
              page. If you do not submit that form, we do not collect personal information about
              you. There is no account to create, nothing to subscribe to, and no newsletter.
            </p>
            <p className={bodyClass}>When you submit an enquiry, we receive:</p>
            <ul className={listClass}>
              <li>&bull; Your individual name (required).</li>
              <li>&bull; Your business email address (required; free and disposable email addresses are not accepted).</li>
              <li>&bull; Your entity name (required).</li>
              <li>&bull; The best number to call you (required).</li>
              <li>&bull; Comments describing the help you need (optional, up to 200 characters).</li>
            </ul>
            <p className={bodyClass}>
              The form also contains a hidden anti-spam field that is not intended for you to fill
              in. We do not ask for a company website, operational-area selections, revenue or
              headcount ranges, or a budget in this form.
            </p>
            <p className={bodyClass}>
              We also store a shortened one-way hash derived from your IP address, which lets us
              stop the form being used for abuse. We do not store the address itself, and the
              hash cannot be reversed to recover it.
            </p>
          </section>

          <section aria-labelledby="privacy-tracking">
            <h2 id="privacy-tracking" className={headingClass}>
              What we do not collect
            </h2>
            <p className={bodyClass}>
              This website runs no analytics, no advertising, no social media pixels and no
              third-party tracking of any kind. We do not know how many people visit, which pages
              they read, or where they came from. Nothing on this site follows you to another
              website.
            </p>
            <p className={bodyClass}>
              This is a deliberate choice rather than an oversight. A site that collects nothing
              has nothing to leak and nothing to misuse.
            </p>
          </section>

          <section aria-labelledby="privacy-storage">
            <h2 id="privacy-storage" className={headingClass}>
              Cookies and browser storage
            </h2>
            <p className={bodyClass}>
              We set no tracking cookies. Two small values are saved in your own browser, and
              neither is ever sent to us or to anyone else:
            </p>
            <ul className={listClass}>
              <li>&bull; Your answer to the cookie notice, so we stop asking.</li>
              <li>&bull; Your light or dark appearance preference, so the site opens the way you left it.</li>
            </ul>
            <p className={bodyClass}>
              Clearing your browser data removes both. Nothing breaks if you do.
            </p>
          </section>

          <section aria-labelledby="privacy-use">
            <h2 id="privacy-use" className={headingClass}>
              Why we use it
            </h2>
            <p className={bodyClass}>
              We use what you send us to reply to your enquiry, to understand your requirements,
              to prepare a proposal or recommendation, and to keep ordinary business records of
              the conversation. That is the whole list.
            </p>
            <p className={bodyClass}>
              We do not sell personal information. We do not share it for anyone else&apos;s
              marketing. We do not add you to a mailing list because you asked us a question.
            </p>
          </section>

          <section aria-labelledby="privacy-where">
            <h2 id="privacy-where" className={headingClass}>
              Where it goes
            </h2>
            <p className={bodyClass}>
              Your enquiry is emailed to AscendRev and recorded in a file on our own web hosting.
              We do not route the form through a third-party form service, so your enquiry does
              not sit in another company&apos;s database.
            </p>
            <p className={bodyClass}>
              Our email is provided by our email host, and our website is provided by our web
              host. Those two suppliers necessarily handle the message in the course of
              delivering and storing it.
            </p>
          </section>

          <section aria-labelledby="privacy-transfer">
            <h2 id="privacy-transfer" className={headingClass}>
              Access from outside Canada
            </h2>
            <p className={bodyClass}>
              AscendRev delivers services using teams based in the Philippines. Our staff there
              may access enquiry information in the course of responding to you and delivering
              services. Personal information handled in another country is subject to the laws of
              that country, and may be accessible to its courts and public authorities.
            </p>
            <p className={bodyClass}>
              We tell you this because you are entitled to know before you decide what to send
              us, not because it changes how carefully we treat it.
            </p>
          </section>

          <section aria-labelledby="privacy-keep">
            <h2 id="privacy-keep" className={headingClass}>
              How long we keep it
            </h2>
            <p className={bodyClass}>
              We keep enquiries for as long as we need them for the purposes above, and for as
              long as our business and tax record-keeping obligations require. When an enquiry no
              longer serves either purpose, we delete it. You can ask us to delete yours sooner.
            </p>
          </section>

          <section aria-labelledby="privacy-security">
            <h2 id="privacy-security" className={headingClass}>
              How we protect it
            </h2>
            <p className={bodyClass}>
              The enquiry form is submitted over an encrypted connection. Stored enquiries are
              held outside the public area of our website, so they cannot be reached from a web
              address. Access is limited to the people at AscendRev who need it to reply to you.
            </p>
            <p className={bodyClass}>
              No method of transmission or storage is completely secure, and we will not claim
              otherwise. If a breach ever creates a real risk of significant harm to you, we will
              report it as Canadian law requires and tell you directly.
            </p>
          </section>

          <section aria-labelledby="privacy-rights">
            <h2 id="privacy-rights" className={headingClass}>
              Your rights
            </h2>
            <p className={bodyClass}>You can ask us to:</p>
            <ul className={listClass}>
              <li>&bull; Tell you what personal information we hold about you and how we have used it.</li>
              <li>&bull; Correct anything that is wrong or out of date.</li>
              <li>&bull; Delete what we hold, subject to any records we are required to keep.</li>
              <li>&bull; Stop contacting you.</li>
            </ul>
            <p className={bodyClass}>
              Write to{' '}
              <a href={`mailto:${site.contactEmail}`} className={linkClass}>
                {site.contactEmail}
              </a>
              . We may need to confirm who you are before we act, so that we do not disclose your
              information to someone else. We will respond within thirty days.
            </p>
            <p className={bodyClass}>
              If you are not satisfied with how we have handled your request, you may complain to
              the Office of the Privacy Commissioner of Canada.
            </p>
          </section>

          <section aria-labelledby="privacy-changes">
            <h2 id="privacy-changes" className={headingClass}>
              Changes to this policy
            </h2>
            <p className={bodyClass}>
              If we change what we collect or what we do with it, we update this page and change
              the date at the top. We do not make material changes quietly.
            </p>
            <p className={bodyClass}>
              If anything here is unclear, ask us. You can reach us through the{' '}
              <Link href="/contact/" className={linkClass}>
                contact page
              </Link>{' '}
              or at{' '}
              <a href={`mailto:${site.contactEmail}`} className={linkClass}>
                {site.contactEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </Section>
  );
}
