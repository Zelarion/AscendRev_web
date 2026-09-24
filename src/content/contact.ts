/**
 * `/contact` copy. The page is hero, then a split layout whose left column is
 * "What to Expect" plus a direct-contact block, and whose right column is the
 * enquiry form. There is no closing band on this page, because the page is
 * already the call to action.
 *
 * The form is a single step of five fields. `src/lib/enquirySchema.ts`
 * validates it, and `public/api/enquiry.php` re-validates the same rules
 * server side (SPEC.md §6), so a limit changed in one place and not the other
 * is a bug, not a style choice.
 */

import type { PageMeta } from './home';

/* Section: hero. */

export interface ContactHeroContent {
  headline: string;
  subheadline: string;
}

/* Section: what to expect. */

export interface ExpectStep {
  title: string;
}

export interface WhatToExpectContent {
  heading: string;
  steps: readonly ExpectStep[];
}

/* Section: the enquiry form. */

export interface FieldCopy {
  label: string;
  /**
   * Persistent helper text under the label (SPEC.md §5, DESIGN.md §6). Never
   * a placeholder standing in for a label.
   */
  helper?: string;
}

/** Keys match the field names in `src/lib/enquirySchema.ts` exactly. */
export interface EnquiryFieldCopy {
  individualName: FieldCopy;
  businessEmail: FieldCopy;
  entityName: FieldCopy;
  bestNumberToCall: FieldCopy;
  comments: FieldCopy;
}

export interface FormStateCopy {
  submitting: string;
  success: string;
  failure: string;
  validationSummary: string;
}

export interface ConsentCopy {
  text: string;
  policyLinkLabel: string;
  policyHref: string;
}

export interface EnquiryFormContent {
  heading: string;
  intro: string;
  requiredNote: string;
  submitLabel: string;
  /** Mirrors the zod `.max(200)` and the PHP `mb_strlen() > 200` check on `comments`. */
  commentsMaxLength: number;
  fields: EnquiryFieldCopy;
  consent: ConsentCopy;
  states: FormStateCopy;
}

/* Section: direct contact block. Email, phone, address and the closing
 * credential line are read from `src/content/site.ts` at render time rather
 * than duplicated here, so there is one place that holds those values. */

export interface DirectContactContent {
  heading: string;
}

export interface ContactContent {
  meta: PageMeta;
  hero: ContactHeroContent;
  whatToExpect: WhatToExpectContent;
  form: EnquiryFormContent;
  directContact: DirectContactContent;
}

export const contact: ContactContent = {
  meta: {
    title: 'Request for Solution Blueprint',
    description:
      'Tell AscendRev where your operation stands today and where you need help. A reply from a person within eight business hours on Calgary time.',
  },

  hero: {
    headline: "Let's Engineer Your Scaled Support Infrastructure.",
    subheadline:
      'Go from strategic sign-off to a fully operational, elite dedicated team in 30-60 days.',
  },

  whatToExpect: {
    // En dash, per the client's copy.
    heading: 'What to expect – the 15 minute Blueprint',
    steps: [
      { title: 'REVENUE GAPS and COST EFFICIENCY DIAGNOSTICS' },
      { title: 'DEFINE SCOPE OF WORK AND THE RIGHT DEDICATED TEAM' },
      { title: 'GO LIVE' },
    ],
  },

  form: {
    heading: 'Request for Solution Blueprint',
    intro: 'Tell us where your operation stands today and where you need help.',
    requiredNote: 'Every field is required except Comments.',
    submitLabel: 'Request Solution Blueprint',
    commentsMaxLength: 200,
    fields: {
      individualName: { label: 'Individual Name' },
      businessEmail: {
        label: 'Business email',
        helper: 'No free domains accepted.',
      },
      entityName: { label: 'Entity name' },
      bestNumberToCall: { label: 'Best number to call' },
      comments: { label: 'Comments (brief description of help needed)' },
    },
    consent: {
      // SPEC.md §7 item 7. The client's draft copy ("Data handled under
      // executive compliance. Zero inbox spam.") means nothing legally and
      // reads like a sentence written to sound like a safeguard.
      text: 'Sending this means AscendRev may use these details to reply to you and to follow up about its services. It reaches AscendRev mailboxes and AscendRev systems. It is not sold, and it is not passed to anyone else for marketing.',
      policyLinkLabel: 'Read the privacy policy',
      policyHref: '/privacy',
    },
    states: {
      submitting: 'Sending your details',
      success:
        'Sent. You will hear from a person at AscendRev within eight business hours, Calgary time.',
      failure:
        'That did not send. Nothing has been lost from the form, so try once more. If it fails again, email us at the address in the footer and we will pick it up from there.',
      validationSummary:
        'This cannot send yet. The fields marked below explain what needs changing.',
    },
  },

  directContact: {
    heading: 'Direct Contact:',
  },
};
