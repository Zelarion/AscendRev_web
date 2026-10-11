import { z } from 'zod';
import type { RoleSlug, YearsValue } from '@/content/careers';
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

export const ROLE_SLUGS = ['outbound-sales-representative'] as const satisfies readonly RoleSlug[];

const YEARS_VALUES = ['none', 'lt1', '1to2', '3to5', '5plus'] as const satisfies readonly YearsValue[];

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
/** PDF and DOCX only (client decision, 11 Oct 2026). The legacy binary .doc format is refused. */
export const RESUME_EXTENSIONS = ['pdf', 'docx'] as const;
export const SALARY_MIN = 5_000;
export const SALARY_MAX = 1_000_000;

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

export const careersSchema = z.object({
  role: choice(ROLE_SLUGS, 'This role is no longer open.'),
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
  outboundYears: choice(YEARS_VALUES, 'Choose one answer.'),
  csYears: choice(YEARS_VALUES, 'Choose one answer.'),
  expectedSalary: z.string().refine((value) => {
    const amount = parsePeso(value);
    return amount !== null && amount >= SALARY_MIN && amount <= SALARY_MAX;
  }, 'Enter a monthly amount in pesos, for example 25,000.'),
  siteShiftConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Please tick this to confirm before you submit.' }),
  }),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Please confirm you agree so we can process your application.' }),
  }),
});

export type CareersValues = {
  role: string;
  fullName: string;
  email: string;
  phone: string;
  outboundYears: string;
  csYears: string;
  expectedSalary: string;
  siteShiftConfirmed: boolean;
  consent: boolean;
};

export type CareersField = keyof CareersValues | 'resume';

/** Fields in on-screen order, for focusing the first invalid one. */
export const FIELD_ORDER: CareersField[] = [
  'resume',
  'fullName',
  'email',
  'phone',
  'outboundYears',
  'csYears',
  'expectedSalary',
  'siteShiftConfirmed',
  'consent',
];

/** First message per field. */
export function validateCareers(values: CareersValues): Partial<Record<CareersField, string>> {
  const errors: Partial<Record<CareersField, string>> = {};
  const result = careersSchema.safeParse(values);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as CareersField;
      errors[field] ??= issue.message;
    }
  }
  return errors;
}

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
