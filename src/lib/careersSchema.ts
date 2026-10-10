import { z } from 'zod';
import type { RoleSlug, YearsValue, YesNo } from '@/content/careers';
import {
  DISPOSABLE_MAILBOX_DOMAINS,
  PHONE_CHARACTERS_PATTERN,
  hasForbiddenNameCharacter,
} from '@/lib/enquirySchema';

/**
 * Client-side validation for the careers application. A convenience only:
 * `public/api/careers.php` re-checks every rule against the same limits, so a
 * limit changed here and not there is a bug.
 *
 * Unlike the enquiry form, free mailboxes are accepted: applicants are people,
 * not companies, and most of them use Gmail.
 */

export const ROLE_SLUGS = [
  'outbound-sales-representative',
  'customer-service-representative',
  'team-leader',
  'general-application',
] as const satisfies readonly RoleSlug[];

const YEARS_VALUES = ['none', 'lt1', '1to2', '3to5', '5plus'] as const satisfies readonly YearsValue[];
const YES_NO = ['yes', 'no'] as const satisfies readonly YesNo[];

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
/** PDF and DOCX only (client decision, 11 Oct 2026). The legacy binary .doc format is refused. */
export const RESUME_EXTENSIONS = ['pdf', 'docx'] as const;
export const PAY_MIN = 5_000;
export const PAY_MAX = 1_000_000;
export const SUPERVISORY_DETAILS_MIN = 20;
export const SUPERVISORY_DETAILS_MAX = 800;

const disposable = new Set<string>(DISPOSABLE_MAILBOX_DOMAINS);

function choice<T extends readonly [string, ...string[]]>(values: T, message: string) {
  // One message for missing, wrong-typed and unknown values alike. Zod refuses
  // required_error alongside a custom errorMap, so the map covers all three.
  return z.enum(values, { errorMap: () => ({ message }) });
}

/** Money typed as "25,000" or "25000" is the same number; anything else is not a number. */
export function parsePeso(value: string): number | null {
  const digits = value.replace(/[,\s]/g, '');
  return /^\d{1,7}$/.test(digits) ? Number(digits) : null;
}

/**
 * Per-field rules. Cross-field rules live in `crossFieldIssues` instead of a
 * zod superRefine, because zod skips refinements once any field is missing,
 * and in a wizard the later steps are always missing while the first is checked.
 */
export const careersSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter your full name.')
    .max(120, 'That is longer than 120 characters. Use the name on your resume.')
    .refine((value) => !hasForbiddenNameCharacter(value), 'A name should not contain digits or symbols.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address so we can reply.')
    .max(254, 'That address is too long. Check it for a paste that went wrong.')
    .email('That does not look like an email address. Check for a missing @ or a typo.')
    .refine(
      (value) => !disposable.has(value.split('@').pop()?.toLowerCase() ?? ''),
      'That is a disposable mailbox. Use an address you will check for our reply.'
    ),
  phone: z
    .string()
    .trim()
    .min(1, 'Enter a mobile number we can call.')
    .max(32, 'That is longer than 32 characters. Check it for a paste that went wrong.')
    .regex(PHONE_CHARACTERS_PATTERN, 'Use digits, spaces and + ( ) - only.')
    .refine((value) => {
      const digits = value.replace(/\D/g, '').length;
      return digits >= 10 && digits <= 13;
    }, 'Enter a full mobile number, for example 0917 123 4567.'),
  role: choice(ROLE_SLUGS, 'Choose the role you are applying for.'),
  linkedin: z
    .string()
    .trim()
    .max(200, 'That link is too long.')
    .refine((value) => value === '' || /^https:\/\/\S+$/i.test(value), 'Paste the full link, starting with https://'),
  outboundYears: choice(YEARS_VALUES, 'Choose one answer.'),
  csYears: choice(YEARS_VALUES, 'Choose one answer.'),
  onsiteNightShift: choice(YES_NO, 'Choose Yes or No.'),
  supervisoryExperience: choice(YES_NO, 'Choose Yes or No.'),
  supervisoryDetails: z.string().trim().max(SUPERVISORY_DETAILS_MAX, `Keep this under ${SUPERVISORY_DETAILS_MAX} characters.`),
  payMin: z.string().trim(),
  payMax: z.string().trim(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm you agree so we can process your application.' }),
  }),
});

export type CareersValues = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  linkedin: string;
  outboundYears: string;
  csYears: string;
  onsiteNightShift: string;
  supervisoryExperience: string;
  supervisoryDetails: string;
  payMin: string;
  payMax: string;
  consent: boolean;
};

/** Rules that compare fields, run on every check regardless of other errors. */
export function crossFieldIssues(values: CareersValues): Partial<Record<keyof CareersValues, string>> {
  const issues: Partial<Record<keyof CareersValues, string>> = {};
  if (values.supervisoryExperience === 'yes' && values.supervisoryDetails.trim().length < SUPERVISORY_DETAILS_MIN) {
    issues.supervisoryDetails = 'Tell us a little more: team size, how long, and what you were responsible for.';
  }
  const min = parsePeso(values.payMin);
  const max = parsePeso(values.payMax);
  const inRange = (n: number | null): n is number => n !== null && n >= PAY_MIN && n <= PAY_MAX;
  if (!inRange(min)) issues.payMin = 'Enter a monthly amount in pesos, for example 25,000.';
  if (!inRange(max)) issues.payMax = 'Enter a monthly amount in pesos, for example 30,000.';
  else if (inRange(min) && max < min) issues.payMax = 'The upper amount should not be lower than the first one.';
  return issues;
}

/** First message per field, from both the per-field and the cross-field rules. */
export function validateCareers(values: CareersValues): Partial<Record<keyof CareersValues, string>> {
  const errors: Partial<Record<keyof CareersValues, string>> = {};
  const result = careersSchema.safeParse(values);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof CareersValues;
      errors[field] ??= issue.message;
    }
  }
  for (const [field, message] of Object.entries(crossFieldIssues(values))) {
    errors[field as keyof CareersValues] ??= message;
  }
  return errors;
}

export type CareersField = keyof CareersValues | 'resume';

/** Which wizard step owns each field, so a server error can send the applicant back to it. */
export const FIELD_STEP: Record<CareersField, 0 | 1 | 2> = {
  fullName: 0,
  email: 0,
  phone: 0,
  role: 0,
  linkedin: 0,
  outboundYears: 1,
  csYears: 1,
  onsiteNightShift: 1,
  supervisoryExperience: 1,
  supervisoryDetails: 1,
  payMin: 1,
  payMax: 1,
  resume: 2,
  consent: 2,
};

/** Fields in on-screen order, for focusing the first invalid one. */
export const FIELD_ORDER = Object.keys(FIELD_STEP) as CareersField[];

const SIGNATURES: Record<(typeof RESUME_EXTENSIONS)[number], number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
  docx: [0x50, 0x4b, 0x03, 0x04], // ZIP; the server checks the Word parts inside
};

/**
 * Checks a resume before it is sent: extension, size and the file's first bytes.
 * The server repeats all of this and more; the point here is telling the
 * applicant now rather than after a 5 MB upload.
 */
export async function checkResume(file: File): Promise<'ok' | 'too_large' | 'wrong_type' | 'empty'> {
  if (file.size === 0) return 'empty';
  if (file.size > RESUME_MAX_BYTES) return 'too_large';
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!(RESUME_EXTENSIONS as readonly string[]).includes(extension)) return 'wrong_type';
  const signature = SIGNATURES[extension as keyof typeof SIGNATURES];
  const head = new Uint8Array(await file.slice(0, signature.length).arrayBuffer());
  return signature.every((byte, index) => head[index] === byte) ? 'ok' : 'wrong_type';
}
