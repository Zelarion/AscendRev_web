/**
 * Validation for the enquiry form (single step, five fields).
 *
 * This file is not the last line of defence: the PHP handler at
 * `public/api/enquiry.php` re-validates every field against these same rules
 * server side, rejects unknown fields, and is the only authority on the token
 * and the rate limit. A browser can be told anything.
 *
 * Every message states what is wrong and what to do about it. "Invalid input"
 * tells a visitor nothing and costs a lead.
 */

import { z } from 'zod';

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
 * Characters a phone number is allowed to contain: digits, spaces, and
 * + ( ) - . and nothing else. A whitelist here, unlike the name check above,
 * because a phone number's alphabet is genuinely that small — no digit
 * grouping convention anywhere needs a letter.
 */
const PHONE_CHARACTERS_PATTERN = /^[0-9 ()+.-]+$/;

/**
 * A missing value and a wrong-typed value get the same message, because the
 * difference between them is meaningless to the person reading it.
 */
function requiredString(message: string): z.ZodString {
  return z.string({ required_error: message, invalid_type_error: message });
}

const MESSAGES = {
  individualNameRequired:
    'Enter your name so we know who we are replying to.',
  individualNameTooLong:
    'That is longer than 120 characters. Use the name you go by rather than something longer.',
  individualNameCharacters:
    'A name should not contain digits or symbols. Remove anything that is not part of the name itself.',
  businessEmailRequired:
    'Enter your business email address. It is the only address we reply to.',
  businessEmailMalformed:
    'That does not look like an email address. Check for a missing @ or a typo in the part after it.',
  businessEmailTooLong:
    'That address is longer than 254 characters, which no mail server will accept. Check it for a paste that went wrong.',
  businessEmailFree:
    'Use your company email address rather than a personal one. A free mailbox cannot be tied to a business, and this form only takes business enquiries. If your company does not issue addresses, call the number in the footer instead.',
  businessEmailDisposable:
    'That is a disposable mailbox, so any reply we send would vanish before you read it. Use the address you actually work from.',
  entityNameRequired:
    'Enter your entity name so we can understand the business before we reply.',
  entityNameTooLong:
    'That is longer than 240 characters. Check it for a paste that went wrong.',
  bestNumberToCallRequired:
    'Enter the best number to call so we can reach you directly.',
  bestNumberToCallDigitCount:
    'Enter exactly 10 digits. Phone numbers with fewer or more digits cannot be accepted.',
  bestNumberToCallTooLong:
    'That is longer than 32 characters. Check it for a paste that went wrong.',
  bestNumberToCallCharacters:
    'A phone number can only contain digits, spaces, and + ( ) - . Remove any letters or other characters.',
  commentsTooLong:
    'That is longer than 200 characters. Send the outline here and bring the detail to the call.',
  honeypot: 'This field must be left empty.',
  tokenRequired:
    'This form has been open long enough for its security token to expire. Reload the page and send it again.',
} as const;

/* Section: the five-field enquiry form. */

export const enquirySchema = z
  .object({
    individualName: requiredString(MESSAGES.individualNameRequired)
      .trim()
      .min(1, { message: MESSAGES.individualNameRequired })
      .max(120, { message: MESSAGES.individualNameTooLong })
      .refine((value) => !hasForbiddenNameCharacter(value), {
        message: MESSAGES.individualNameCharacters,
      }),

    businessEmail: requiredString(MESSAGES.businessEmailRequired)
      .trim()
      .min(1, { message: MESSAGES.businessEmailRequired })
      .max(254, { message: MESSAGES.businessEmailTooLong })
      .email({ message: MESSAGES.businessEmailMalformed })
      .superRefine((value, ctx) => {
        const domain = domainOf(value);
        if (disposableMailboxDomains.has(domain)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: MESSAGES.businessEmailDisposable,
          });
          return;
        }
        if (freeMailboxDomains.has(domain)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: MESSAGES.businessEmailFree,
          });
        }
      }),

    entityName: requiredString(MESSAGES.entityNameRequired)
      .trim()
      .min(1, { message: MESSAGES.entityNameRequired })
      .max(240, { message: MESSAGES.entityNameTooLong }),

    /**
     * Length and character-set checks run inside one `superRefine` rather
     * than a chain of `.min()`/`.max()`/`.regex()` calls, so an empty value
     * gets the "required" message instead of the digit-count message — the two
     * are wrong for different reasons and a visitor should not have to guess
     * which applies.
     */
    bestNumberToCall: requiredString(MESSAGES.bestNumberToCallRequired)
      .trim()
      .max(32, { message: MESSAGES.bestNumberToCallTooLong })
      .superRefine((value, ctx) => {
        if (value.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: MESSAGES.bestNumberToCallRequired,
          });
          return;
        }
        if (!PHONE_CHARACTERS_PATTERN.test(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: MESSAGES.bestNumberToCallCharacters,
          });
          return;
        }
        const digitCount = value.replace(/[^0-9]/g, '').length;
        if (digitCount !== 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: MESSAGES.bestNumberToCallDigitCount,
          });
        }
      }),

    /** Optional, and short by design: no minimum once something is typed. */
    comments: z
      .string()
      .trim()
      .max(200, { message: MESSAGES.commentsTooLong })
      .optional(),

    /**
     * Honeypot. Rendered visually hidden, `tabindex="-1"` and
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

export type EnquiryValues = z.infer<typeof enquirySchema>;

/**
 * Field order, so the form component can trigger validation and move focus
 * to the first invalid field without keeping a second copy of the field
 * names next to this one.
 */
export const ENQUIRY_FIELDS = [
  'individualName',
  'businessEmail',
  'entityName',
  'bestNumberToCall',
  'comments',
] as const satisfies readonly (keyof EnquiryValues)[];
