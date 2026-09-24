/**
 * `/values` copy: "Our Corporate Values".
 *
 * The client's instruction on this page was explicit: "Please do not change
 * the wording, if possible." Every `principle`, `body` and `closing` string
 * below is quoted exactly as supplied, including its own punctuation (the
 * em dashes inside `body` and `closing` are the client's, not a typo).
 * Nothing here is paraphrased, re-punctuated or re-cased.
 *
 * The "01 —", "02 —", "03 —" numbering is the client's own formatting for
 * the three values (an em dash, not a hyphen). `number` and `name` are kept
 * as separate fields rather than one pre-joined string so the page component
 * can style the numeral distinctly from the name, but the rendered result
 * reproduces the client's `${number} — ${name}` form unchanged.
 */

import type { PageMeta } from './home';

/** One corporate value, in the client's own four-part structure: a number,
 * a name, a one-line principle, a body paragraph, and a bold closing line. */
export interface CorporateValue {
  /** Two-digit ordinal exactly as the client wrote it, e.g. '01'. */
  number: string;
  name: string;
  /** One-line principle. Rendered as a distinct emphasised line, not folded
   * into the body paragraph. */
  principle: string;
  body: string;
  /** Closing line. Rendered bold: it is meant to carry the weight of the
   * value, not read as a trailing sentence. */
  closing: string;
}

export interface ValuesContent {
  meta: PageMeta;
  /** Canonical path for `alternates.canonical` in `src/app/values/page.tsx`,
   * kept here rather than duplicated as a page-level literal so the route
   * string has one source, matching how `meta` is the single source for the
   * page `<title>`. */
  canonicalPath: string;
  heading: string;
  values: readonly CorporateValue[];
}

export const values: ValuesContent = {
  meta: {
    title: 'Our Corporate Values',
    description: "AscendRev's three corporate values: Accountability, Discipline, and Partnership.",
  },

  canonicalPath: '/values/',

  heading: 'Our Corporate Values',

  values: [
    {
      number: '01',
      name: 'Accountability',
      principle: 'Own the work. Own the outcome.',
      body: 'We take responsibility for what we commit to—and we do the right thing, even when it means saying no. If something falls outside our capabilities, expertise, or ability to deliver to our standard, we will be transparent about it.',
      closing:
        'We believe credibility is built by keeping commitments—and knowing when not to make one.',
    },
    {
      number: '02',
      name: 'Discipline',
      principle: 'Consistency creates performance.',
      body: "Great execution is built through disciplined processes, focused activity, accountability, and continuous improvement. We bring structure and consistency to every engagement so our clients can depend on the work getting done.",
      closing: "We don't rely on occasional effort. We build systems that perform consistently.",
    },
    {
      number: '03',
      name: 'Partnership',
      principle: 'Operate as an extension of your team.',
      body: 'We work alongside our clients as an extension of your organization—not as a disconnected service provider. We invest in understanding the business, customers, processes, and objectives so our teams can execute with context and purpose.',
      closing: 'Your goals become the standard we work toward.',
    },
  ],
};
