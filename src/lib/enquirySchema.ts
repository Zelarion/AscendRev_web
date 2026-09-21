/**
 * Validation for the two-step enquiry form (SPEC.md §4.4 and §6).
 *
 * Step one is name, work email, company and bottleneck, and it submits on its
 * own. Step two is revenue, headcount, budget and message, and it can be
 * skipped. `enquirySchema` is the merged shape a completed step two posts.
 *
 * Two things this file is not. It is not the last line of defence: the PHP
 * handler at `public/api/enquiry.php` re-validates every field against these
 * same rules server side, rejects unknown fields, and is the only authority on
 * the token and the rate limit. A browser can be told anything. It is also not
 * where the option vocabularies live: those are content, they come from
 * `src/content/contact.ts`, and the enums below are built from them so the
 * form, the schema and the PHP handler cannot drift apart.
 *
 * Every message states what is wrong and what to do about it. "Invalid input"
 * tells a visitor nothing and costs a lead.
 */

import { z } from 'zod';
import {
  BOTTLENECK_VALUES,
  HEADCOUNT_VALUES,
  REVENUE_VALUES,
} from '@/content/contact';

/* Section: email domain lists. */

/**
 * Consumer mailbox domains. The form is a B2B qualification tool: an address
 * we cannot tie to a company is not a business enquiry we can act on, and the
 * micro-copy under the field says so before anyone types.
 *
 * The Canadian ISP domains are here deliberately. Shaw, Telus, Rogers and
 * Sympatico addresses are the consumer mailboxes a Canadian buyer is most
 * likely to reach for by mistake, and a US-centric list would wave them
 * through.
 *
 * Exported because `public/api/enquiry.php` has to reject exactly the same
 * list, and a list maintained in two places is a list maintained in neither.
 */
export const FREE_MAILBOX_DOMAINS = [
  'aim.com',
  'aol.com',
  'bell.net',
  'btinternet.com',
  'cogeco.ca',
  'comcast.net',
  'eastlink.ca',
  'fastmail.com',
  'gmail.com',
  'gmx.com',
  'gmx.net',
  'googlemail.com',
  'hotmail.ca',
  'hotmail.co.uk',
  'hotmail.com',
  'icloud.com',
  'live.ca',
  'live.com',
  'mac.com',
  'mail.com',
  'me.com',
  'msn.com',
  'outlook.ca',
  'outlook.com',
  'pm.me',
  'proton.me',
  'protonmail.com',
  'rogers.com',
  'shaw.ca',
  'sympatico.ca',
  'telus.net',
  'videotron.ca',
  'yahoo.ca',
  'yahoo.co.uk',
  'yahoo.com',
  'yandex.com',
  'ymail.com',
  'zoho.com',
] as const;

/**
 * Throwaway mailbox services. Separated from the list above because they earn
 * a different message: a free mailbox is usually an honest mistake, a
 * disposable address is a decision.
 */
export const DISPOSABLE_MAILBOX_DOMAINS = [
  '10minutemail.com',
  'dispostable.com',
  'guerrillamail.com',
  'mailinator.com',
  'sharklasers.com',
  'temp-mail.org',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
] as const;

const freeMailboxDomains = new Set<string>(FREE_MAILBOX_DOMAINS);
const disposableMailboxDomains = new Set<string>(DISPOSABLE_MAILBOX_DOMAINS);

/** Lowercased domain part of an address, or an empty string if there is no `@`. */
function domainOf(email: string): string {
  const separator = email.lastIndexOf('@');
  if (separator === -1) {
    return '';
  }
  return email.slice(separator + 1).trim().toLowerCase();
}

/* Section: field helpers. */

/**
 * Names are checked for characters that cannot belong in one, rather than
 * against a whitelist of letters. A whitelist written in ASCII rejects
 * Garcia-Lopez, Muller and O'Brien as readily as it rejects a bot, and this
 * form is aimed at a country where all three are ordinary names.
 */
const FORBIDDEN_NAME_CHARACTERS = '0123456789@<>{}[]\\/|_=+*#$%^~`';

function hasForbiddenNameCharacter(value: string): boolean {
  return [...value].some((character) =>
    FORBIDDEN_NAME_CHARACTERS.includes(character)
  );
}

/**
 * A missing value and a wrong-typed value get the same message, because the
 * difference between them is meaningless to the person reading it.
 */
function requiredString(message: string): z.ZodString {
  return z.string({ required_error: message, invalid_type_error: message });
}

/**
 * Enums and arrays need an `errorMap` rather than `required_error`. An
 * unselected `<select>` posts an empty string, which zod reports as
 * `invalid_enum_value`, and `invalid_type_error` does not cover that issue
 * code: the visitor would be shown zod's default, "Invalid enum value.
 * Expected 'under-10m' | ...".
 */
function alwaysSay(message: string): { errorMap: z.ZodErrorMap } {
  return { errorMap: () => ({ message }) };
}

const MESSAGES = {
  firstNameRequired: 'Enter your first name so we know who we are replying to.',
  lastNameRequired:
    'Enter your last name. We address people properly in a first reply.',
  nameTooLong:
    'That is longer than 60 characters. Use the name you go by at work rather than your full legal name.',
  nameCharacters:
    'A name should not contain digits or symbols. Remove anything that is not part of the name itself.',
  emailRequired:
    'Enter your work email address. It is the only address we reply to.',
  emailMalformed:
    'That does not look like an email address. Check for a missing @ or a typo in the part after it.',
  emailTooLong:
    'That address is longer than 254 characters, which no mail server will accept. Check it for a paste that went wrong.',
  emailFree:
    'Use your company email address rather than a personal one. A free mailbox cannot be tied to a business, and this form only takes business enquiries. If your company does not issue addresses, call the number in the footer instead.',
  emailDisposable:
    'That is a disposable mailbox, so any reply we send would vanish before you read it. Use the address you actually work from.',
  companyRequired:
    'Enter your company name. It tells us who we would be working for.',
  companyTooShort:
    'Two characters is not a company name we would recognise. Write it as it appears on your invoices.',
  companyTooLong:
    'That is longer than 120 characters. The trading name on its own is enough.',
  bottleneckRequired:
    'Choose at least one function. If more than one is a problem choose them all, and we will start with the one costing you most.',
  bottleneckTooMany:
    'That is more options than exist on this form. Reload the page and choose again.',
  revenueRequired:
    'Choose an annual revenue band. It tells us the size of team that will actually fit, and we do not ask for an exact figure.',
  headcountRequired:
    'Choose roughly how many people you need. An estimate is fine, and the blueprint will challenge it if it looks wrong.',
  budgetTooLong:
    'That is longer than 120 characters. A range, such as 8,000 to 12,000 CAD a month, is all we need here.',
  messageTooShort:
    'A few words is not enough for us to prepare anything useful. Write at least a sentence about what is not working, or leave this blank.',
  messageTooLong:
    'That is longer than 2,000 characters. Send the outline here and bring the detail to the call.',
  honeypot: 'This field must be left empty.',
  tokenRequired:
    'This form has been open long enough for its security token to expire. Reload the page and send it again.',
} as const;

function nameField(requiredMessage: string) {
  return requiredString(requiredMessage)
    .trim()
    .min(1, { message: requiredMessage })
    .max(60, { message: MESSAGES.nameTooLong })
    .refine((value) => !hasForbiddenNameCharacter(value), {
      message: MESSAGES.nameCharacters,
    });
}

/* Section: step one, enough to reply to. */

export const stepOneSchema = z
  .object({
    firstName: nameField(MESSAGES.firstNameRequired),

    lastName: nameField(MESSAGES.lastNameRequired),

    corporateEmail: requiredString(MESSAGES.emailRequired)
      .trim()
      .min(1, { message: MESSAGES.emailRequired })
      .max(254, { message: MESSAGES.emailTooLong })
      .email({ message: MESSAGES.emailMalformed })
      .superRefine((value, ctx) => {
        const domain = domainOf(value);
        if (disposableMailboxDomains.has(domain)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: MESSAGES.emailDisposable,
          });
          return;
        }
        if (freeMailboxDomains.has(domain)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: MESSAGES.emailFree,
          });
        }
      }),

    company: requiredString(MESSAGES.companyRequired)
      .trim()
      .min(1, { message: MESSAGES.companyRequired })
      .min(2, { message: MESSAGES.companyTooShort })
      .max(120, { message: MESSAGES.companyTooLong }),

    primaryBottleneck: z
      .array(
        z.enum(BOTTLENECK_VALUES, alwaysSay(MESSAGES.bottleneckRequired)),
        alwaysSay(MESSAGES.bottleneckRequired)
      )
      .min(1, { message: MESSAGES.bottleneckRequired })
      .max(BOTTLENECK_VALUES.length, { message: MESSAGES.bottleneckTooMany }),

    /**
     * Honeypot (SPEC.md §6). Rendered visually hidden, `tabindex="-1"` and
     * `autocomplete="off"`, and named for something no password manager or
     * browser autofill recognises, so a person never fills it in and a bot
     * that fills every input always does.
     */
    referralSource: z
      .string()
      .max(0, { message: MESSAGES.honeypot })
      .optional(),

    /**
     * Anti-CSRF token minted by the PHP handler and echoed back with the
     * submission. Optional here because the browser is not the authority on
     * it: the handler rejects a submission with a missing, stale or unknown
     * token whatever this schema says.
     */
    formToken: z.string().min(1, { message: MESSAGES.tokenRequired }).optional(),
  })
  .strict();

/* Section: step two, what turns a reply into numbers. */

/**
 * Revenue and headcount are required *within* this step; budget and message
 * are not. Skipping step two altogether is a supported path and the form
 * offers a Skip control for it. Choosing to continue and then leaving both
 * dropdowns empty is not, because those two answers are the entire reason the
 * step exists and each is a single click. Budget stays optional on purpose: it
 * is the field that loses people, which is why the form was split in two.
 */
export const stepTwoSchema = z
  .object({
    annualRevenue: z.enum(REVENUE_VALUES, alwaysSay(MESSAGES.revenueRequired)),

    headcount: z.enum(HEADCOUNT_VALUES, alwaysSay(MESSAGES.headcountRequired)),

    budget: z
      .string()
      .trim()
      .max(120, { message: MESSAGES.budgetTooLong })
      .optional(),

    message: z
      .string()
      .trim()
      .max(2000, { message: MESSAGES.messageTooLong })
      .optional()
      .superRefine((value, ctx) => {
        if (value !== undefined && value.length > 0 && value.length < 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: MESSAGES.messageTooShort,
          });
        }
      }),
  })
  .strict();

/** The full payload a completed step two posts. */
export const enquirySchema = stepOneSchema.merge(stepTwoSchema);

export type StepOneValues = z.infer<typeof stepOneSchema>;
export type StepTwoValues = z.infer<typeof stepTwoSchema>;
export type EnquiryValues = z.infer<typeof enquirySchema>;

/**
 * Field order per step, so the form component can trigger validation and move
 * focus to the first invalid field (DESIGN.md §6) without keeping a second
 * copy of the field names next to this one.
 */
export const STEP_ONE_FIELDS = [
  'firstName',
  'lastName',
  'corporateEmail',
  'company',
  'primaryBottleneck',
] as const satisfies readonly (keyof StepOneValues)[];

export const STEP_TWO_FIELDS = [
  'annualRevenue',
  'headcount',
  'budget',
  'message',
] as const satisfies readonly (keyof StepTwoValues)[];
