'use client';

import Link from 'next/link';
import { LockKey } from '@phosphor-icons/react/dist/ssr';
import { useId, useRef, useState, type FormEvent } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import type { EnquiryFormContent } from '@/content/contact';
import { enquirySchema } from '@/lib/enquirySchema';

type FormValues = {
  firstName: string;
  lastName: string;
  corporateEmail: string;
  company: string;
  primaryBottleneck: string[];
  annualRevenue: string;
  headcount: string;
  budget: string;
  message: string;
  referralSource: string;
};

type FieldName = keyof FormValues;

const visibleFields: readonly FieldName[] = [
  'firstName',
  'lastName',
  'corporateEmail',
  'company',
  'annualRevenue',
  'primaryBottleneck',
  'headcount',
  'budget',
  'message',
];

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

const inputClassName =
  'mt-2 block min-h-12 w-full rounded-[6px] border border-white/12 bg-white/[0.035] px-3.5 text-[14px] text-white outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-white/28 focus:border-[var(--gold-400)] focus:bg-white/[0.055] focus:shadow-[0_0_0_3px_rgba(223,184,79,0.10)]';

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
      firstName: '',
      lastName: '',
      corporateEmail: '',
      company: '',
      primaryBottleneck: [],
      annualRevenue: '',
      headcount: '',
      budget: '',
      message: '',
      referralSource: '',
    },
  });

  const selectedBottlenecks = watch('primaryBottleneck') ?? [];

  function fieldId(name: FieldName): string {
    return `${formId}-${name}`;
  }

  function helperId(name: FieldName): string {
    return `${fieldId(name)}-help`;
  }

  function errorId(name: FieldName): string {
    return `${fieldId(name)}-error`;
  }

  function describedBy(name: FieldName, hasHelper = false): string | undefined {
    const ids = [hasHelper ? helperId(name) : null, errors[name] ? errorId(name) : null].filter(Boolean);
    return ids.length ? ids.join(' ') : undefined;
  }

  function validateForm(): boolean {
    const result = enquirySchema.safeParse(getValues());
    if (result.success) {
      clearErrors();
      return true;
    }

    clearErrors();
    for (const field of visibleFields) {
      const issue = result.error.issues.find((candidate) => candidate.path[0] === field);
      if (issue) {
        setError(field, { type: 'validate', message: issue.message });
      }
    }

    const firstInvalid = visibleFields.find((field) =>
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
      if (Array.isArray(value)) {
        // The `[]` suffix is not decoration. PHP only assembles repeated form
        // keys into an array when the name ends in `[]`; without it `$_POST`
        // keeps the LAST value and silently discards the rest, so a visitor
        // who ticks three bottlenecks would have two of them thrown away
        // between the browser and the handler. Verified both ways against the
        // real handler. PHP strips the suffix, so the field arrives as
        // `primaryBottleneck` and the handler's allow-list is unaffected.
        value.forEach((entry) => payload.append(`${key}[]`, entry));
      } else {
        payload.append(key, value);
      }
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
      setStatus({ tone: 'success', message: content.states.successFinal });
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
    <div className="w-full rounded-[10px] border border-white/[0.08] bg-[#111c2c] p-6 sm:p-8 lg:p-10">
      <div className="border-b border-white/[0.08] pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-300)] sm:text-[11px]">
          RFP &amp; DISCOVERY HUB
        </p>
        <h2 className="mt-3 max-w-[16ch] font-display text-[clamp(2.2rem,3.5vw,3.5rem)] font-medium leading-[1] tracking-[-0.035em] text-white">
          {content.heading}
        </h2>
        <p className="mt-4 max-w-[56ch] text-[14px] leading-6 text-white/52">
          {content.intro}
        </p>
      </div>

      {status && (
        <div
          id={summaryId}
          role={status.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`mt-6 border px-4 py-3 text-[13px] leading-5 ${
            status.tone === 'error'
              ? 'border-[#c46b60]/35 bg-[#c46b60]/[0.06] text-[#efaaa1]'
              : 'border-[var(--gold-400)]/35 bg-[var(--gold-400)]/[0.06] text-[var(--gold-300)]'
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

          <FormGroup number="01" title="COMPANY">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id={fieldId('firstName')}
                label={content.fields.firstName.label}
                error={errors.firstName?.message}
                errorId={errorId('firstName')}
                describedBy={describedBy('firstName')}
                registration={register('firstName')}
                autoComplete="given-name"
              />
              <TextField
                id={fieldId('lastName')}
                label={content.fields.lastName.label}
                error={errors.lastName?.message}
                errorId={errorId('lastName')}
                describedBy={describedBy('lastName')}
                registration={register('lastName')}
                autoComplete="family-name"
              />
            </div>

            <div className="mt-5">
              <TextField
                id={fieldId('corporateEmail')}
                label={content.fields.corporateEmail.label}
                helper={content.fields.corporateEmail.helper}
                helperId={helperId('corporateEmail')}
                error={errors.corporateEmail?.message}
                errorId={errorId('corporateEmail')}
                describedBy={describedBy('corporateEmail', true)}
                registration={register('corporateEmail')}
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="mt-5">
              <TextField
                id={fieldId('company')}
                label={content.fields.company.label}
                error={errors.company?.message}
                errorId={errorId('company')}
                describedBy={describedBy('company')}
                registration={register('company')}
                type="url"
                autoComplete="url"
              />
            </div>

            <div className="mt-5">
              <SelectField
                id={fieldId('annualRevenue')}
                label={content.fields.annualRevenue.label}
                error={errors.annualRevenue?.message}
                errorId={errorId('annualRevenue')}
                describedBy={describedBy('annualRevenue')}
                registration={register('annualRevenue')}
                options={content.options.annualRevenue}
              />
            </div>
          </FormGroup>

          <FormGroup number="02" title="REQUIREMENTS" className="mt-10 border-t border-white/[0.08] pt-10">
            <fieldset>
              <legend className="text-[12px] font-semibold tracking-[0.02em] text-white/78">
                {content.fields.primaryBottleneck.label}
              </legend>
              {content.fields.primaryBottleneck.helper && (
                <p id={helperId('primaryBottleneck')} className="mt-1.5 text-[12px] text-white/38">
                  {content.fields.primaryBottleneck.helper}
                </p>
              )}

              <div
                className="mt-4 grid gap-2.5 sm:grid-cols-2"
                aria-describedby={describedBy('primaryBottleneck', true)}
              >
                {content.options.primaryBottleneck.map((option) => {
                  const optionId = `${fieldId('primaryBottleneck')}-${option.value}`;
                  const selected = selectedBottlenecks.includes(option.value);
                  return (
                    <label key={option.value} htmlFor={optionId} className="relative cursor-pointer">
                      <input
                        {...register('primaryBottleneck')}
                        id={optionId}
                        type="checkbox"
                        value={option.value}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex min-h-12 items-center justify-between gap-3 rounded-[6px] border px-3.5 text-[13px] transition-[border-color,background-color,color] duration-200 peer-focus-visible:shadow-[0_0_0_3px_rgba(223,184,79,0.12)] ${
                          selected
                            ? 'border-[var(--gold-400)]/65 bg-[var(--gold-400)]/[0.07] text-white'
                            : 'border-white/10 bg-white/[0.02] text-white/62 hover:border-white/18 hover:bg-white/[0.035]'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border text-[10px] ${
                            selected
                              ? 'border-[var(--gold-400)] bg-[var(--gold-400)] text-[var(--gold-ink)]'
                              : 'border-white/22 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
              <FieldError id={errorId('primaryBottleneck')} error={errors.primaryBottleneck?.message} />
            </fieldset>
          </FormGroup>

          <FormGroup number="03" title="SCALE & BUDGET" className="mt-10 border-t border-white/[0.08] pt-10">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                id={fieldId('headcount')}
                label={content.fields.headcount.label}
                error={errors.headcount?.message}
                errorId={errorId('headcount')}
                describedBy={describedBy('headcount')}
                registration={register('headcount')}
                options={content.options.headcount}
              />
              <TextField
                id={fieldId('budget')}
                label={content.fields.budget.label}
                error={errors.budget?.message}
                errorId={errorId('budget')}
                describedBy={describedBy('budget')}
                registration={register('budget')}
                inputMode="decimal"
              />
            </div>

            <div className="mt-5">
              <TextAreaField
                id={fieldId('message')}
                label={content.fields.message.label}
                helper={content.fields.message.helper}
                helperId={helperId('message')}
                error={errors.message?.message}
                errorId={errorId('message')}
                describedBy={describedBy('message', Boolean(content.fields.message.helper))}
                registration={register('message')}
              />
            </div>
          </FormGroup>

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
              Request Strategic Capability Proposal →
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

          <div className="mt-4 flex items-start justify-center gap-2 text-center text-[11px] leading-5 text-white/42">
            <LockKey size={14} weight="regular" aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--gold-300)]/75" />
            <span>Data handled under executive compliance. Zero inbox spam.</span>
          </div>

          <p className="mt-3 text-center text-[10px] leading-4 text-white/28">
            <Link
              href={content.consent.policyHref}
              className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/55"
            >
              {content.consent.policyLinkLabel}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

function FormGroup({
  number,
  title,
  className = '',
  children,
}: {
  number: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold-300)]">
        {number} / {title}
      </p>
      {children}
    </section>
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
  type?: 'email' | 'text' | 'url';
  autoComplete?: string;
  inputMode?: 'text' | 'decimal';
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
  inputMode,
}: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.02em] text-white/78">
        {label}
      </label>
      {helper && helperId && (
        <p id={helperId} className="mt-1.5 text-[11px] leading-4 text-white/36">
          {helper}
        </p>
      )}
      <input
        {...registration}
        id={id}
        type={type}
        inputMode={inputMode}
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
}

/**
 * The only free-text field on the form, and the one that turns a qualified row
 * of dropdown answers into something a person can actually reply to. It is
 * optional: the schema accepts an empty value, and only enforces a ten
 * character minimum once someone has started writing, so a stray keystroke
 * does not block a submission.
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
}: TextAreaFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.02em] text-white/78">
        {label}
      </label>
      {helper && helperId && (
        <p id={helperId} className="mt-1.5 text-[11px] leading-4 text-white/36">
          {helper}
        </p>
      )}
      <textarea
        {...registration}
        id={id}
        rows={4}
        maxLength={2000}
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

interface SelectFieldProps {
  id: string;
  label: string;
  error?: string;
  errorId: string;
  describedBy?: string;
  registration: UseFormRegisterReturn;
  options: readonly { value: string; label: string }[];
}

function SelectField({
  id,
  label,
  error,
  errorId,
  describedBy,
  registration,
  options,
}: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[12px] font-semibold tracking-[0.02em] text-white/78">
        {label}
      </label>
      <select
        {...registration}
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        className={`${inputClassName} cursor-pointer`}
      >
        <option value="" className="bg-[#111c2c] text-white" hidden>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#111c2c] text-white">
            {option.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} role="alert" className="mt-2 text-[11px] leading-4 text-[#efaaa1]">
      {error}
    </p>
  ) : null;
}
