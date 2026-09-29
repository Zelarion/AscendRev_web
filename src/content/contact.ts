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
  /** Short line directly under the headline. */
  tagline: string;
  subheadline: string;
  description: string;
}

/* Section: what to expect. */

export interface ExpectStep {
  /** One-word stage name shown after the stage number, e.g. "Discover". */
  stage: string;
  title: string;
  detail: string;
}

export interface WhatToExpectContent {
  eyebrow: string;
  heading: string;
  description: string;
  steps: readonly ExpectStep[];
  closing: {
    title: string;
    detail: string;
  };
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

  // Client revision, 2026-09-29: exact replacement copy.
  hero: {
    headline: 'Scale Your Capacity. Keep Your Standards.',
    tagline: 'Define the work. Identify the gaps. Build the right team.',
    subheadline: 'From strategy to operational capacity in 30–60 days.',
    description:
      'AscendRev designs dedicated teams around your specific requirements, processes, and performance standards—giving you the capacity to do more without compromising how your business operates.',
  },

  whatToExpect: {
    // Client revision, 2026-09-29: exact replacement copy for the whole block.
    eyebrow: 'THE ASCENDREV BLUEPRINT',
    heading: 'From Opportunity to Execution — In Three Focused Steps.',
    description:
      'A simple, structured approach to identify the opportunity, design the right solution, and build the team around the work.',
    steps: [
      {
        stage: 'Discover',
        title: 'Understand the Opportunity',
        detail:
          'We assess your operation, identify gaps, and uncover opportunities to improve revenue, capacity, customer coverage, or efficiency.',
      },
      {
        stage: 'Design',
        title: 'Build Around the Work',
        detail:
          'We define the scope, responsibilities, workflows, standards, and dedicated team required to deliver the desired outcomes.',
      },
      {
        stage: 'Launch',
        title: 'Put the Team to Work',
        detail:
          'We prepare the team, align the operation, establish accountability, and begin execution against clearly defined expectations.',
      },
    ],
    closing: {
      title: 'The Right Team. The Right Structure. The Right Execution.',
      detail: 'Purpose-built support designed around the work your business needs to move forward.',
    },
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
      bestNumberToCall: {
        label: 'Best number to call',
        helper: 'Enter exactly 10 digits. Spaces, +, parentheses, hyphens, and periods are okay.',
      },
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
      // Client revision, 2026-09-29: Rio's exact wording.
      success: "We received your inquiry, we appreciate it, and we'll talk soon.",
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
