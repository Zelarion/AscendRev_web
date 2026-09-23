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
];

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
        value.forEach((entry) => payload.append(key, entry));
      } else {
        payload.append(key, value);
      }
    }

    try {
      const response = await fetch('/api/enquiry.php', {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Enquiry request failed with ${response.status}.`);
      }

      setCompleted(true);
      setStatus({ tone: 'success', message: content.states.successFinal });
    } catch {
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
        <form action="/api/enquiry.php" method="post" className="mt-8" onSubmit={handleSubmit} noValidate>
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
          </FormGroup>

          <button
            type="submit"
            disabled={submitting}
            className="mt-10 inline-flex min-h-13 w-full items-center justify-center rounded-[7px] border border-[var(--gold-300)]/70 bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 py-3.5 text-center text-[14px] font-semibold text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.16)] outline-none transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_10px_25px_rgba(197,151,49,0.22)] focus-visible:shadow-[0_0_0_3px_rgba(240,212,123,0.28)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {submitting ? content.states.submitting : 'Request Strategic Capability Proposal →'}
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
