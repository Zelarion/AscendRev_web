/**
 * `/contact` copy. Section order matches SPEC.md §4.4 exactly: hero, then the
 * split layout whose left column is "What to Expect" and whose right column is
 * the enquiry form. There is no closing band on this page, because the page is
 * already the call to action. On mobile the form comes first.
 *
 * The form is two steps (SPEC.md §4.4, a stated departure from the client's
 * brief). Step one is name, work email, company and bottleneck, and it submits
 * on its own. Step two asks for revenue, headcount and budget, and it can be
 * skipped. Asking for budget before anything else loses a large share of
 * visitors, and a partial lead is worth more than a lost one.
 *
 * This file owns the option values as well as the labels. Those values are the
 * vocabulary the whole system agrees on: `src/lib/enquirySchema.ts` builds its
 * enums from the tuples below, and `public/api/enquiry.php` validates against
 * the same list server side (SPEC.md §6). One list, so the three cannot drift.
 */

import type { PageMeta, PendingApproval } from './home';

/* Section: option vocabularies. */

export const BOTTLENECK_VALUES = [
  'outbound',
  'inbound',
  'customer-support',
  'help-desk',
  'after-hours',
] as const;
export type BottleneckValue = (typeof BOTTLENECK_VALUES)[number];

export const REVENUE_VALUES = [
  'under-10m',
  '10m-to-50m',
  '50m-to-250m',
  '250m-plus',
] as const;
export type RevenueValue = (typeof REVENUE_VALUES)[number];

export const HEADCOUNT_VALUES = [
  '5-to-10',
  '11-to-15',
  '16-to-50',
  'over-50',
] as const;
export type HeadcountValue = (typeof HEADCOUNT_VALUES)[number];

export interface SelectOption<TValue extends string> {
  value: TValue;
  label: string;
}

/**
 * Labels are declared as a `Record` keyed by the value union, so adding a value
 * to a tuple above is a type error here until its label is written. The option
 * arrays are then built by mapping the tuple, which ties display order to the
 * canonical order rather than to object key order.
 */
const bottleneckLabels: Record<BottleneckValue, string> = {
  outbound: 'Outbound / SDR',
  inbound: 'Inbound Closers',
  'customer-support': 'Customer Support',
  'help-desk': 'Tech Help Desk',
  'after-hours': '24/7 After-Hours',
};

const revenueLabels: Record<RevenueValue, string> = {
  'under-10m': 'Under $10M',
  '10m-to-50m': '$10M–$50M',
  '50m-to-250m': '$50M–$250M',
  '250m-plus': '$250M+',
};

const headcountLabels: Record<HeadcountValue, string> = {
  '5-to-10': '5–10',
  '11-to-15': '11–15',
  '16-to-50': '16–50',
  'over-50': '50+',
};

export const bottleneckOptions: readonly SelectOption<BottleneckValue>[] =
  BOTTLENECK_VALUES.map((value) => ({ value, label: bottleneckLabels[value] }));

export const revenueOptions: readonly SelectOption<RevenueValue>[] =
  REVENUE_VALUES.map((value) => ({ value, label: revenueLabels[value] }));

export const headcountOptions: readonly SelectOption<HeadcountValue>[] =
  HEADCOUNT_VALUES.map((value) => ({ value, label: headcountLabels[value] }));

/* Section: deep link from the homepage. */

/**
 * The homepage's secondary hero CTA links to `/contact?intent=cost-analysis`
 * (SPEC.md §4.1). The contact page reads the param, shows `form.intentNotice`
 * and opens step two rather than collapsing it, because a visitor who clicked
 * that link has already said what they came for.
 */
export const ENQUIRY_INTENT_PARAM = 'intent';
export const COST_ANALYSIS_INTENT = 'cost-analysis';

/* Section: page content. */

export interface ContactHeroContent {
  headline: string;
  subheadline: string;
}

export interface ExpectStep extends PendingApproval {
  title: string;
  body: string;
}

export interface WhatToExpectContent {
  heading: string;
  intro: string;
  /**
   * DESIGN.md §2 bans numbered section markers as scaffolding and permits
   * exactly one numbered sequence on the site: this one, because it genuinely
   * is an ordered process. The component numbers by index.
   */
  steps: readonly ExpectStep[];
  /** Ramp-up claim. Held apart from the sequence because it is a claim, not a step. */
  timeline: ExpectStep;
}

export interface FieldCopy {
  label: string;
  /**
   * Persistent helper text under the label (SPEC.md §5, DESIGN.md §6). Never a
   * placeholder standing in for a label.
   */
  helper?: string;
}

/** Keys match the field names in `src/lib/enquirySchema.ts` exactly. */
export interface EnquiryFieldCopy {
  firstName: FieldCopy;
  lastName: FieldCopy;
  corporateEmail: FieldCopy;
  company: FieldCopy;
  primaryBottleneck: FieldCopy;
  annualRevenue: FieldCopy;
  headcount: FieldCopy;
  budget: FieldCopy;
  message: FieldCopy;
}

export interface FormStepCopy {
  id: 'one' | 'two';
  /** Short label for the progress indicator, which shows both steps at once. */
  name: string;
  heading: string;
  body: string;
  submitLabel: string;
  /** Present only on the step that can be skipped. */
  skipLabel?: string;
}

export interface FormStateCopy {
  submitting: string;
  successStepOne: string;
  successFinal: string;
  failure: string;
  validationSummary: string;
}

export interface ConsentCopy {
  text: string;
  retention: string;
  policyLinkLabel: string;
  policyHref: string;
}

export interface EnquiryFormContent {
  heading: string;
  intro: string;
  requiredNote: string;
  intentNotice: string;
  steps: readonly FormStepCopy[];
  fields: EnquiryFieldCopy;
  options: {
    primaryBottleneck: readonly SelectOption<BottleneckValue>[];
    annualRevenue: readonly SelectOption<RevenueValue>[];
    headcount: readonly SelectOption<HeadcountValue>[];
  };
  consent: ConsentCopy;
  states: FormStateCopy;
  directContact: {
    heading: string;
    body: string;
  };
}

export interface ContactContent {
  meta: PageMeta;
  hero: ContactHeroContent;
  whatToExpect: WhatToExpectContent;
  form: EnquiryFormContent;
}

export const contact: ContactContent = {
  meta: {
    title: 'Request an Outsourcing Blueprint',
    description:
      'Tell AscendRev which function is costing you most. Two steps, the first about a minute, and a reply from a person within eight business hours on Calgary time.',
  },

  hero: {
    headline: "Let's Engineer Your Scaled Support Infrastructure.",
    subheadline:
      'Go from strategic sign-off to a fully operational, elite dedicated team in 30-60 days.',
  },

  whatToExpect: {
    heading: 'The 15-Minute Blueprint.',
    intro:
      'A focused operational review designed to identify savings, define the right team structure, and map how AscendRev can integrate into your existing operation.',
    steps: [
      {
        title: 'Find where 30–50% savings may exist.',
        body: 'Review your current operating model and identify where offshore execution can create meaningful savings.',
      },
      {
        title: 'Define the right team.',
        body: 'Map the functions, roles, headcount, and support structure that best fit your business.',
      },
      {
        title: 'Plug into your systems.',
        body: 'Plan how the team connects with your existing tools, workflows, reporting, and operating processes.',
      },
    ],
    timeline: {
      title: 'From sign off to a working team',
      body: 'AscendRev targets 30 to 60 days from your sign off to a fully operational dedicated team.',
      pendingApproval: true,
      pendingReason:
        "SPEC.md §7, no-invented-claims rule. The 30 to 60 day figure is from the client's brief, but AscendRev has never stood up a team, so nothing sits behind it. AscendRev must confirm in writing that it will state this as a target, or supply a range it will stand behind, before it is published.",
    },
  },

  form: {
    heading: 'Request an Outsourcing Blueprint',
    intro:
      'Tell us where your operation stands today and what you need help solving.',
    requiredNote:
      'Everything in step one is required. In step two the two dropdowns are required if you continue, the rest is optional, and the whole step can be skipped.',
    intentNotice:
      'You came in from the cost analysis link, so step two is already open. Answer it and the call starts with numbers instead of questions.',
    steps: [
      {
        id: 'one',
        name: 'Your details',
        heading: 'Step one: who you are',
        body: 'This is all we need in order to reply to you.',
        submitLabel: 'Send This and Continue',
      },
      {
        id: 'two',
        name: 'Your requirement',
        heading: 'Step two: what you need',
        body: 'Optional, and it changes what you get back. With this we can put numbers on the call instead of asking you for them during it.',
        submitLabel: 'Request Strategic Capability Proposal',
        skipLabel: 'Skip this step',
      },
    ],
    fields: {
      firstName: { label: 'First name' },
      lastName: { label: 'Last name' },
      corporateEmail: {
        label: 'Corporate Email',
        helper: 'No free domains accepted.',
      },
      company: {
        label: 'Company Website URL',
      },
      primaryBottleneck: {
        label: 'Primary Bottleneck',
        helper: 'Select one or more.',
      },
      annualRevenue: {
        label: 'Current Annual Revenue',
      },
      headcount: {
        label: 'Estimated Headcount Needed',
      },
      budget: {
        label: 'Budget Allocation (CAD)',
      },
      message: {
        label: 'Anything else we should know',
        helper:
          'What you have already tried is the most useful thing you can put here.',
      },
    },
    options: {
      primaryBottleneck: bottleneckOptions,
      annualRevenue: revenueOptions,
      headcount: headcountOptions,
    },
    consent: {
      // SPEC.md §7 item 7. Replaces the brief's "Data handled under executive
      // compliance. Zero inbox spam", which means nothing legally and reads
      // like a sentence written to sound like a safeguard.
      text: 'Sending this means AscendRev may use these details to reply to you and to follow up about its services. It reaches AscendRev mailboxes and AscendRev systems. It is not sold, and it is not passed to anyone else for marketing.',
      retention:
        'We keep enquiry details for as long as we reasonably need them to answer you and to manage the relationship that follows, and we delete them on request.',
      policyLinkLabel: 'Read the privacy policy',
      policyHref: '/privacy',
    },
    states: {
      submitting: 'Sending your details',
      successStepOne:
        'Sent. We have what we need in order to reply. If you have two more minutes, step two gets you a costed plan instead of a conversation.',
      successFinal:
        'Sent. You will hear from a person at AscendRev within eight business hours, Calgary time.',
      failure:
        'That did not send. Nothing has been lost from the form, so try once more. If it fails again, email us at the address in the footer and we will pick it up from there.',
      validationSummary:
        'This cannot send yet. The fields marked below explain what needs changing.',
    },
    directContact: {
      heading: 'Rather not use a form?',
      body: 'The phone number, email address and head office in the footer reach the same people, and the same eight hour reply applies.',
    },
  },
};
