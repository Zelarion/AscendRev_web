'use client';

import Link from 'next/link';
import { useId, useRef, useState, type FormEvent } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import type { EnquiryFormContent } from '@/content/contact';
import { ENQUIRY_FIELDS, enquirySchema } from '@/lib/enquirySchema';

type FormValues = {
  individualName: string;
  businessEmail: string;
  entityName: string;
  bestNumberToCall: string;
  comments: string;
  referralSource: string;
};

type FieldName = keyof FormValues;

/**
 * An idempotency key identifies the visitor's *intent* to send this enquiry,
 * not an individual HTTP attempt. It is generated once when the form is opened
 * and only replaced after a submission has actually succeeded, so a retry over
 * a dropped connection carries the same key and the handler replays the first
 * outcome instead of creating a second lead and a second email.
 *
 * Generating it per attempt would defeat the entire mechanism, which is the
 * usual way this gets built wrong.
 */
function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Older Safari has crypto but not randomUUID. getRandomValues is far older.
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Where the enquiry is posted.
 *
 * Default is the relative path, which is what production uses: the handler is
 * uploaded alongside the pages on the client's cPanel account, so same origin,
 * no CORS, nothing to configure.
 *
 * `NEXT_PUBLIC_ENQUIRY_ENDPOINT` overrides it with an absolute URL for a split
 * deployment, where the pages are served from a static host that cannot run
 * PHP and the handler lives elsewhere. That host must then appear in the
 * handler's `ASCENDREV_ALLOWED_HOSTS`, or every submission is refused with 403
 * while the page itself looks perfectly fine.
 *
 * Read at build time, not runtime, because a static export has no runtime to
 * read it in.
 */
const ENQUIRY_ENDPOINT =
  process.env.NEXT_PUBLIC_ENQUIRY_ENDPOINT || '/api/enquiry.php';

/*
 * Resting border is `--border-strong`, the token defined in globals.css
 * specifically for input/control outlines (its own comment there: "never for
 * dividers") because the ordinary `--border` hairline is only 1.22:1 and
 * disappears on a text input, where the boundary is the only thing telling a
 * visitor where to type. Focus swaps to `--focus-ring` rather than carrying
 * the brand gold forward: gold-400 measures under 2:1 on white and this field
 * ships with `outline-none`, so the border/shadow pair below is the only
 * focus indicator there is and it has to clear 3:1 on its own.
 */
const inputClassName =
  'mt-2 block min-h-12 w-full rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface-band-raised)] px-3.5 text-[16px] text-[var(--ink)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[var(--ink-muted)] focus:border-[var(--focus-ring)] focus:bg-[var(--surface-raised)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus-ring)_18%,transparent)] lg:text-[14px]';

interface ContactEnquiryFormProps {
  content: EnquiryFormContent;
}

export default function ContactEnquiryForm({ content }: ContactEnquiryFormProps) {
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: 'error' | 'success'; message: string } | null>(null);
  const submissionInFlight = useRef(false);
  const idempotencyKey = useRef<string>(newIdempotencyKey());
  const formId = useId();
  const summaryId = `${formId}-summary`;

  const {
    clearErrors,
    formState: { errors },
    getValues,
    register,
    setError,
    setFocus,
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      individualName: '',
      businessEmail: '',
      entityName: '',
      bestNumberToCall: '',
      comments: '',
      referralSource: '',
    },
  });

  const commentsValue = watch('comments') ?? '';

  function fieldId(name: FieldName): string {
    return `${formId}-${name}`;
  }

  function helperId(name: FieldName): string {
    return `${fieldId(name)}-help`;
  }

  function errorId(name: FieldName): string {
    return `${fieldId(name)}-error`;
  }

  function counterId(name: FieldName): string {
    return `${fieldId(name)}-counter`;
  }

  function describedBy(name: FieldName, extraIds: readonly (string | null | undefined)[] = []): string | undefined {
    const ids = [...extraIds, errors[name] ? errorId(name) : null].filter(
      (id): id is string => Boolean(id)
    );
    return ids.length ? ids.join(' ') : undefined;
  }

  function validateForm(): boolean {
    const result = enquirySchema.safeParse(getValues());
    if (result.success) {
      clearErrors();
      return true;
    }

    clearErrors();
    for (const field of ENQUIRY_FIELDS) {
      const issue = result.error.issues.find((candidate) => candidate.path[0] === field);
      if (issue) {
        setError(field, { type: 'validate', message: issue.message });
      }
    }

    const firstInvalid = ENQUIRY_FIELDS.find((field) =>
      result.error.issues.some((issue) => issue.path[0] === field)
    );
    if (firstInvalid) {
      requestAnimationFrame(() => setFocus(firstInvalid));
    }

    setStatus({ tone: 'error', message: content.states.validationSummary });
    return false;
  }

  async function submitEnquiry(): Promise<void> {
    if (submissionInFlight.current || !validateForm()) {
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    setStatus(null);

    const values = getValues();
    const payload = new FormData();
    for (const [key, value] of Object.entries(values)) {
      payload.append(key, value);
    }
    payload.append('idempotencyKey', idempotencyKey.current);

    try {
      const response = await fetch(ENQUIRY_ENDPOINT, {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Enquiry request failed with ${response.status}.`);
      }

      // The enquiry is now recorded, so this intent is spent. A fresh key means
      // that if the visitor sends a genuine second enquiry later it is treated
      // as new rather than replayed as a duplicate of the first.
      idempotencyKey.current = newIdempotencyKey();

      setCompleted(true);
      setStatus({ tone: 'success', message: content.states.success });
    } catch {
      // The key is deliberately NOT regenerated here. A failure may have been
      // a lost response rather than a lost request, so the next attempt has to
      // carry the same key for the handler to recognise it as a retry.
      setStatus({ tone: 'error', message: content.states.failure });
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitEnquiry();
  }

  return (
    <div className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:p-7 lg:p-10">
      <div className="border-b border-[var(--border)] pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-text)] sm:text-[11px]">
          RFP &amp; DISCOVERY HUB
        </p>
        <h2 className="mt-3 max-w-[16ch] font-display text-[clamp(2.2rem,3.5vw,3.5rem)] font-medium leading-[1] tracking-[-0.035em] text-[var(--navy-900)]">
          {content.heading}
        </h2>
        <p className="mt-4 max-w-[56ch] text-[14px] leading-6 text-[var(--ink-muted)]">
          {content.intro}
        </p>
        <p className="mt-2 text-[12px] leading-5 text-[var(--ink-muted)]">
          {content.requiredNote}
        </p>
      </div>

      {/*
        Danger/success now come from the semantic `--danger`/`--success`
        tokens rather than the literal hex pair this block used to carry
        (`#c46b60`/`#efaaa1`, tuned to sit on a dark card). Those two hexes
        read at roughly 2:1 on white — invisible as an error colour, not just
        dim — so this was a correctness fix, not a cosmetic one.
      */}
      {status && (
        <div
          id={summaryId}
          role={status.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`mt-6 border px-4 py-3 text-[13px] leading-5 ${
            status.tone === 'error'
              ? 'border-[var(--danger)]/35 bg-[var(--danger)]/[0.06] text-[var(--danger)]'
              : 'border-[var(--success)]/35 bg-[var(--success)]/[0.06] text-[var(--success)]'
          }`}
        >
          {status.message}
        </div>
      )}

      {!completed && (
        <form
          action={ENQUIRY_ENDPOINT}
          method="post"
          // The whole form dims and settles back a fraction while the request
          // is in flight. Small enough to read as "working", not as a
          // page-blocking overlay, and pointer events stay off so a second
          // click cannot land on a field mid-submit.
          className={`enquiry-form mt-8 ${submitting ? 'is-sending' : ''}`}
          onSubmit={handleSubmit}
          noValidate
        >
          <input
            {...register('referralSource')}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute h-px w-px overflow-hidden opacity-0"
          />

          <div className="grid gap-5">
            <TextField
              id={fieldId('individualName')}
              label={content.fields.individualName.label}
              error={errors.individualName?.message}
              errorId={errorId('individualName')}
              describedBy={describedBy('individualName')}
              registration={register('individualName')}
              autoComplete="name"
            />

            <TextField
              id={fieldId('businessEmail')}
              label={content.fields.businessEmail.label}
              helper={content.fields.businessEmail.helper}
              helperId={helperId('businessEmail')}
              error={errors.businessEmail?.message}
              errorId={errorId('businessEmail')}
              describedBy={describedBy('businessEmail', [helperId('businessEmail')])}
              registration={register('businessEmail')}
              type="email"
              autoComplete="email"
            />

            <TextField
              id={fieldId('entityName')}
              label={content.fields.entityName.label}
              error={errors.entityName?.message}
              errorId={errorId('entityName')}
              describedBy={describedBy('entityName')}
              registration={register('entityName')}
              autoComplete="organization"
            />

            <TextField
              id={fieldId('bestNumberToCall')}
              label={content.fields.bestNumberToCall.label}
              error={errors.bestNumberToCall?.message}
              errorId={errorId('bestNumberToCall')}
              describedBy={describedBy('bestNumberToCall')}
              registration={register('bestNumberToCall')}
              type="tel"
              autoComplete="tel"
            />

            <TextAreaField
              id={fieldId('comments')}
              label={content.fields.comments.label}
              helper={content.fields.comments.helper}
              helperId={helperId('comments')}
              error={errors.comments?.message}
              errorId={errorId('comments')}
              describedBy={describedBy('comments', [
                content.fields.comments.helper ? helperId('comments') : null,
                counterId('comments'),
              ])}
              registration={register('comments')}
              maxLength={content.commentsMaxLength}
              value={commentsValue}
              counterId={counterId('comments')}
            />
          </div>

          {/*
            The two labels are stacked on top of each other and cross-faded
            rather than swapped, so the button never changes width and the row
            below it never jumps. A sheen sweeps across while the request is in
            flight, which reads as the request travelling rather than the page
            hanging — this handler does a real SMTP round trip and can take a
            couple of seconds.
          */}
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            data-sending={submitting ? 'true' : undefined}
            className="enquiry-submit group relative mt-10 inline-flex min-h-13 w-full items-center justify-center overflow-hidden rounded-[7px] border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 py-3.5 text-center text-[14px] font-semibold text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.16)] outline-none transition-[transform,box-shadow,filter] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_10px_25px_rgba(197,151,49,0.22)] focus-visible:shadow-[0_0_0_3px_rgba(240,212,123,0.28)] disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <span aria-hidden="true" className="enquiry-submit__sheen" />

            <span
              aria-hidden={submitting ? 'true' : undefined}
              className={`enquiry-submit__label ${submitting ? 'is-hidden' : ''}`}
            >
              {content.submitLabel} →
            </span>

            <span
              aria-hidden={submitting ? undefined : 'true'}
              className={`enquiry-submit__label enquiry-submit__label--sending ${
                submitting ? '' : 'is-hidden'
              }`}
            >
              <span className="enquiry-spinner" />
              {content.states.submitting}
            </span>
          </button>

          <p className="mt-4 text-center text-[11px] leading-5 text-[var(--ink-muted)]">
            {content.consent.text}
          </p>

          <p className="mt-3 text-center text-[10px] leading-4 text-[var(--ink-muted)]">
            <Link
              href={content.consent.policyHref}
              className="underline decoration-[var(--border)] underline-offset-4 transition-colors hover:text-[var(--navy-900)]"
            >
              {content.consent.policyLinkLabel}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  helper?: string;
  helperId?: string;
  error?: string;
  errorId: string;
  describedBy?: string;
  registration: UseFormRegisterReturn;
  type?: 'email' | 'text' | 'tel';
  autoComplete?: string;
}

function TextField({
  id,
  label,
  helper,
  helperId,
  error,
  errorId,
  describedBy,
  registration,
  type = 'text',
  autoComplete,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.02em] text-[var(--ink)]">
        {label}
      </label>
      {helper && helperId && (
        <p id={helperId} className="mt-1.5 text-[11px] leading-4 text-[var(--ink-muted)]">
          {helper}
        </p>
      )}
      <input
        {...registration}
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={inputClassName}
      />
      <FieldError id={errorId} error={error} />
    </div>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  helper?: string;
  helperId?: string;
  error?: string;
  errorId: string;
  describedBy?: string;
  registration: UseFormRegisterReturn;
  maxLength: number;
  value: string;
  counterId: string;
}

/**
 * The only free-text field on the form. Optional, and capped at
 * `maxLength` both by the browser (the `maxLength` attribute, so a visitor
 * physically cannot type past it) and by the schema server side.
 *
 * The counter's live region is `aria-live="polite"` rather than "assertive"
 * so a screen reader finishes its current sentence and picks up the latest
 * count when it next has a gap, instead of interrupting on every keystroke.
 */
function TextAreaField({
  id,
  label,
  helper,
  helperId,
  error,
  errorId,
  describedBy,
  registration,
  maxLength,
  value,
  counterId,
}: TextAreaFieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.02em] text-[var(--ink)]">
          {label}
        </label>
        <span
          id={counterId}
          aria-live="polite"
          aria-atomic="true"
          className="shrink-0 text-[11px] tabular-nums text-[var(--ink-muted)]"
        >
          {value.length} / {maxLength}
        </span>
      </div>
      {helper && helperId && (
        <p id={helperId} className="mt-1.5 text-[11px] leading-4 text-[var(--ink-muted)]">
          {helper}
        </p>
      )}
      <textarea
        {...registration}
        id={id}
        rows={4}
        maxLength={maxLength}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        // `inputClassName` sets a fixed min-height sized for a single-line
        // input, which would crop a textarea, so the height rules are replaced
        // rather than inherited. `resize-y` keeps the horizontal axis fixed so
        // dragging cannot break the column layout.
        className={`${inputClassName} min-h-[7.5rem] resize-y py-3 leading-6`}
      />
      <FieldError id={errorId} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} role="alert" className="mt-2 text-[11px] leading-4 text-[var(--danger)]">
      {error}
    </p>
  ) : null;
}
