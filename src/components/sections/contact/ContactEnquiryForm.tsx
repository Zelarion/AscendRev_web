'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import Button from '@/components/ui/Button';
import {
  COST_ANALYSIS_INTENT,
  ENQUIRY_INTENT_PARAM,
  type EnquiryFormContent,
} from '@/content/contact';
import { enquirySchema, stepOneSchema, stepTwoSchema } from '@/lib/enquirySchema';

type FormStep = 'one' | 'two';

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

const stepOneFields: readonly FieldName[] = [
  'firstName',
  'lastName',
  'corporateEmail',
  'company',
  'primaryBottleneck',
];
const stepTwoFields: readonly FieldName[] = ['annualRevenue', 'headcount', 'budget', 'message'];

const inputClassName =
  'mt-2 block min-h-12 w-full rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-body text-[var(--ink)] outline-none transition-colors focus:border-[var(--steel-600)]';

interface ContactEnquiryFormProps {
  content: EnquiryFormContent;
}

/**
 * Interactive state is isolated here so the route remains static-export safe.
 * The native form action is retained as a JavaScript-free step-one submission.
 */
export default function ContactEnquiryForm({ content }: ContactEnquiryFormProps) {
  const [activeStep, setActiveStep] = useState<FormStep>('one');
  const [intentOpen, setIntentOpen] = useState(false);
  const [submittedStepOne, setSubmittedStepOne] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: 'error' | 'success'; message: string } | null>(null);
  const submissionInFlight = useRef(false);
  const formId = useId();
  const summaryId = `${formId}-summary`;
  const stepOnePanelId = `${formId}-step-one`;
  const stepTwoPanelId = `${formId}-step-two`;
  const {
    clearErrors,
    formState: { errors },
    getValues,
    register,
    setError,
    setFocus,
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

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get(ENQUIRY_INTENT_PARAM) === COST_ANALYSIS_INTENT) {
      setIntentOpen(true);
      setActiveStep('two');
    }
  }, []);

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
    return ids.length === 0 ? undefined : ids.join(' ');
  }

  function reportIssues(
    issues: readonly { path: PropertyKey[]; message: string }[],
    fields: readonly FieldName[],
    step: FormStep
  ): false {
    clearErrors();
    for (const field of fields) {
      const issue = issues.find((candidate) => candidate.path[0] === field);
      if (issue) {
        setError(field, { type: 'validate', message: issue.message });
      }
    }

    setStatus({ tone: 'error', message: content.states.validationSummary });
    setActiveStep(step);
    const firstInvalid = fields.find((field) => issues.some((issue) => issue.path[0] === field));
    if (firstInvalid) {
      requestAnimationFrame(() => setFocus(firstInvalid));
    }
    return false;
  }

  function validateStepOne(): boolean {
    const values = getValues();
    const result = stepOneSchema.safeParse({
      firstName: values.firstName,
      lastName: values.lastName,
      corporateEmail: values.corporateEmail,
      company: values.company,
      primaryBottleneck: values.primaryBottleneck,
      referralSource: values.referralSource,
    });
    if (!result.success) {
      return reportIssues(result.error.issues, stepOneFields, 'one');
    }
    clearErrors(stepOneFields);
    return true;
  }

  function validateStepTwo(): boolean {
    const values = getValues();
    const result = stepTwoSchema.safeParse({
      annualRevenue: values.annualRevenue,
      headcount: values.headcount,
      budget: values.budget,
      message: values.message,
    });
    if (!result.success) {
      return reportIssues(result.error.issues, stepTwoFields, 'two');
    }
    clearErrors(stepTwoFields);
    return true;
  }

  function validateCompletedEnquiry(): boolean {
    const result = enquirySchema.safeParse(getValues());
    if (result.success) {
      clearErrors();
      return true;
    }
    const invalidStepOne = stepOneFields.some((field) =>
      result.error.issues.some((issue) => issue.path[0] === field)
    );
    return reportIssues(
      result.error.issues,
      invalidStepOne ? stepOneFields : stepTwoFields,
      invalidStepOne ? 'one' : 'two'
    );
  }

  async function postEnquiry(step: FormStep): Promise<boolean> {
    // State alone updates too late to close a double-click window. The ref is
    // set synchronously, so a second event cannot produce a second request.
    if (submissionInFlight.current) {
      return false;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    setStatus(null);
    const values = getValues();
    const fields = step === 'one' ? stepOneFields : [...stepOneFields, ...stepTwoFields];
    const payload = new FormData();

    for (const field of fields) {
      const value = values[field];
      if (Array.isArray(value)) {
        value.forEach((entry) => payload.append(field, entry));
      } else {
        payload.append(field, value);
      }
    }
    payload.append('referralSource', values.referralSource);

    try {
      const response = await fetch('/api/enquiry.php', {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Enquiry request failed with ${response.status}.`);
      }
      return true;
    } catch {
      // A missing static-host handler is a failure, never a local success.
      setStatus({ tone: 'error', message: content.states.failure });
      return false;
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }

  async function sendStepOne() {
    if (!validateStepOne()) {
      return;
    }
    if (await postEnquiry('one')) {
      setSubmittedStepOne(true);
      setActiveStep('two');
      setStatus({ tone: 'success', message: content.states.successStepOne });
    }
  }

  async function sendStepTwo() {
    const isValid = submittedStepOne ? validateStepTwo() : validateCompletedEnquiry();
    if (!isValid) {
      return;
    }
    if (await postEnquiry('two')) {
      setSubmittedStepOne(true);
      setCompleted(true);
      setStatus({ tone: 'success', message: content.states.successFinal });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || submissionInFlight.current) {
      return;
    }
    void (activeStep === 'one' ? sendStepOne() : sendStepTwo());
  }

  function skipStepTwo() {
    if (submitting) {
      return;
    }
    if (!submittedStepOne) {
      setActiveStep('one');
      setStatus(null);
      return;
    }
    setCompleted(true);
    setStatus({ tone: 'success', message: content.states.successFinal });
  }

  const activeStepCopy = content.steps[activeStep === 'one' ? 0 : 1];

  return (
    <div className="border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 lg:p-10">
      <h2 className="max-w-[20ch] font-display text-h2 text-[var(--ink)]">{content.heading}</h2>
      <p className="mt-5 max-w-[60ch] text-body text-[var(--ink-muted)]">{content.intro}</p>

      <ol className="mt-8 grid grid-cols-2 border-y border-[var(--border)]" aria-label="Enquiry progress">
        {content.steps.map((step, index) => {
          const isActive = activeStep === step.id;
          const panelId = step.id === 'one' ? stepOnePanelId : stepTwoPanelId;
          return (
            <li key={step.id} className={index === 1 ? 'border-l border-[var(--border)]' : undefined}>
              <button
                type="button"
                disabled={
                  submitting ||
                  completed ||
                  (step.id === 'two' && !submittedStepOne && !intentOpen)
                }
                aria-current={isActive ? 'step' : undefined}
                aria-controls={panelId}
                onClick={() => {
                  setActiveStep(step.id);
                  setStatus(null);
                }}
                className="min-h-12 w-full px-3 py-3 text-left font-mono text-label text-[var(--ink-muted)] outline-none transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className={isActive ? 'text-[var(--ink)]' : undefined}>
                  {index + 1}. {step.name}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {intentOpen && (
        <p className="mt-6 border-l-2 border-[var(--steel-600)] pl-4 text-small text-[var(--ink-muted)]">
          {content.intentNotice}
        </p>
      )}

      {status && (
        <div
          id={summaryId}
          role={status.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`mt-6 border px-4 py-3 text-small ${
            status.tone === 'error'
              ? 'border-[var(--danger)] text-[var(--danger)]'
              : 'border-[var(--success)] text-[var(--success)]'
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

          {activeStep === 'one' ? (
            <fieldset id={stepOnePanelId} aria-describedby={status?.tone === 'error' ? summaryId : undefined}>
              <legend className="font-display text-h3 text-[var(--ink)]">{activeStepCopy.heading}</legend>
              <p className="mt-3 text-body text-[var(--ink-muted)]">{activeStepCopy.body}</p>
              <p className="mt-5 text-small text-[var(--ink-muted)]">{content.requiredNote}</p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <TextField id={fieldId('firstName')} label={content.fields.firstName.label} error={errors.firstName?.message} errorId={errorId('firstName')} describedBy={describedBy('firstName')} registration={register('firstName')} autoComplete="given-name" />
                <TextField id={fieldId('lastName')} label={content.fields.lastName.label} error={errors.lastName?.message} errorId={errorId('lastName')} describedBy={describedBy('lastName')} registration={register('lastName')} autoComplete="family-name" />
              </div>

              <div className="mt-6">
                <TextField id={fieldId('corporateEmail')} label={content.fields.corporateEmail.label} helper={content.fields.corporateEmail.helper} helperId={helperId('corporateEmail')} error={errors.corporateEmail?.message} errorId={errorId('corporateEmail')} describedBy={describedBy('corporateEmail', true)} registration={register('corporateEmail')} type="email" autoComplete="email" />
              </div>
              <div className="mt-6">
                <TextField id={fieldId('company')} label={content.fields.company.label} helper={content.fields.company.helper} helperId={helperId('company')} error={errors.company?.message} errorId={errorId('company')} describedBy={describedBy('company', true)} registration={register('company')} autoComplete="organization" />
              </div>

              <fieldset className="mt-6">
                <legend className="font-mono text-label text-[var(--ink)]">{content.fields.primaryBottleneck.label}</legend>
                <p id={helperId('primaryBottleneck')} className="mt-2 text-small text-[var(--ink-muted)]">{content.fields.primaryBottleneck.helper}</p>
                <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2" aria-describedby={describedBy('primaryBottleneck', true)}>
                  {content.options.primaryBottleneck.map((option) => {
                    const optionId = `${fieldId('primaryBottleneck')}-${option.value}`;
                    return (
                      <label key={option.value} htmlFor={optionId} className="flex min-h-11 items-center gap-3 text-small text-[var(--ink)]">
                        <input {...register('primaryBottleneck')} id={optionId} type="checkbox" value={option.value} className="h-5 w-5 rounded-[2px] border-[var(--border-strong)] accent-[var(--green-600)]" />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                <FieldError id={errorId('primaryBottleneck')} error={errors.primaryBottleneck?.message} />
              </fieldset>
            </fieldset>
          ) : (
            <fieldset id={stepTwoPanelId} aria-describedby={status?.tone === 'error' ? summaryId : undefined}>
              <legend className="font-display text-h3 text-[var(--ink)]">{activeStepCopy.heading}</legend>
              <p className="mt-3 text-body text-[var(--ink-muted)]">{activeStepCopy.body}</p>
              <p className="mt-5 text-small text-[var(--ink-muted)]">{content.requiredNote}</p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <SelectField id={fieldId('annualRevenue')} label={content.fields.annualRevenue.label} helper={content.fields.annualRevenue.helper} helperId={helperId('annualRevenue')} error={errors.annualRevenue?.message} errorId={errorId('annualRevenue')} describedBy={describedBy('annualRevenue', true)} registration={register('annualRevenue')} options={content.options.annualRevenue} />
                <SelectField id={fieldId('headcount')} label={content.fields.headcount.label} helper={content.fields.headcount.helper} helperId={helperId('headcount')} error={errors.headcount?.message} errorId={errorId('headcount')} describedBy={describedBy('headcount', true)} registration={register('headcount')} options={content.options.headcount} />
              </div>
              <div className="mt-6">
                <TextField id={fieldId('budget')} label={content.fields.budget.label} helper={content.fields.budget.helper} helperId={helperId('budget')} error={errors.budget?.message} errorId={errorId('budget')} describedBy={describedBy('budget', true)} registration={register('budget')} />
              </div>
              <div className="mt-6">
                <label htmlFor={fieldId('message')} className="font-mono text-label text-[var(--ink)]">{content.fields.message.label}</label>
                <p id={helperId('message')} className="mt-2 text-small text-[var(--ink-muted)]">{content.fields.message.helper}</p>
                <textarea {...register('message')} id={fieldId('message')} rows={5} aria-invalid={errors.message ? 'true' : undefined} aria-describedby={describedBy('message', true)} className={`${inputClassName} resize-y py-3`} />
                <FieldError id={errorId('message')} error={errors.message?.message} />
              </div>
            </fieldset>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="submit" size="lg" pending={submitting} className="w-full sm:w-auto">
              {submitting ? content.states.submitting : activeStepCopy.submitLabel}
            </Button>
            {activeStep === 'two' && activeStepCopy.skipLabel && (
              <button type="button" disabled={submitting} onClick={skipStepTwo} className="min-h-11 px-2 text-small text-[var(--link)] underline underline-offset-4 outline-none transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60">
                {activeStepCopy.skipLabel}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <h3 className="text-h3 text-[var(--ink)]">{content.directContact.heading}</h3>
        <p className="mt-3 text-small text-[var(--ink-muted)]">{content.directContact.body}</p>
      </div>
      <div className="mt-6 space-y-3 text-small text-[var(--ink-muted)]">
        <p>{content.consent.text}</p>
        <p>{content.consent.retention}</p>
        <Link href={content.consent.policyHref} className="text-[var(--link)] underline underline-offset-4 hover:text-[var(--ink)]">
          {content.consent.policyLinkLabel}
        </Link>
      </div>
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
  type?: 'email' | 'text';
  autoComplete?: string;
}

function TextField({ id, label, helper, helperId, error, errorId, describedBy, registration, type = 'text', autoComplete }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="font-mono text-label text-[var(--ink)]">{label}</label>
      {helper && helperId && <p id={helperId} className="mt-2 text-small text-[var(--ink-muted)]">{helper}</p>}
      <input {...registration} id={id} type={type} autoComplete={autoComplete} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} className={inputClassName} />
      <FieldError id={errorId} error={error} />
    </div>
  );
}

interface SelectFieldProps {
  id: string;
  label: string;
  helper?: string;
  helperId?: string;
  error?: string;
  errorId: string;
  describedBy?: string;
  registration: UseFormRegisterReturn;
  options: readonly { value: string; label: string }[];
}

function SelectField({ id, label, helper, helperId, error, errorId, describedBy, registration, options }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="font-mono text-label text-[var(--ink)]">{label}</label>
      {helper && helperId && <p id={helperId} className="mt-2 text-small text-[var(--ink-muted)]">{helper}</p>}
      <select {...registration} id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} className={inputClassName}>
        <option value="" hidden />
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <FieldError id={errorId} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? <p id={id} role="alert" className="mt-2 text-small text-[var(--danger)]">{error}</p> : null;
}
