'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type JSX, type ReactNode } from 'react';
import { CheckCircle, CircleNotch, FileArrowUp, FileDoc, FilePdf, X } from '@phosphor-icons/react';
import { applicationForm as copy, yearsOptions, type RoleSlug } from '@/content/careers';
import {
  FIELD_ORDER,
  RESUME_MAX_BYTES,
  checkResume,
  parsePeso,
  validateCareers,
  type CareersField,
  type CareersValues,
} from '@/lib/careersSchema';
import styles from './careers.module.css';

/**
 * Where applications are posted. Same-origin on cPanel; overridable at build
 * time for a split deployment, in which case that host must be in the
 * handler's ASCENDREV_ALLOWED_HOSTS or every application gets a 403.
 */
const CAREERS_ENDPOINT = process.env.NEXT_PUBLIC_CAREERS_ENDPOINT || '/api/careers.php';

/** Text answers survive an accidental refresh. The file cannot, by design. */
const DRAFT_KEY = 'ascendrev-careers-draft-v2';

type DraftValues = Omit<CareersValues, 'role' | 'siteShiftConfirmed' | 'consent'>;

const EMPTY_DRAFT: DraftValues = {
  fullName: '',
  email: '',
  phone: '',
  outboundYears: '',
  csYears: '',
  expectedSalary: '',
};

/**
 * One key per intent to apply, kept across retries and replaced only after the
 * server has recorded the application. A key per attempt would let a retry over
 * a dropped connection file the same applicant twice.
 */
function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function readDraft(): Partial<DraftValues> {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<DraftValues>) : {};
  } catch {
    return {};
  }
}

function writeDraft(values: DraftValues | null): void {
  try {
    if (values) window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    else window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private mode or blocked storage: the form simply does not remember.
  }
}

interface ServerResult {
  status: number;
  body: { ok?: boolean; recorded?: boolean; error?: string; fields?: string[] } | null;
}

/** XHR rather than fetch, because fetch cannot report upload progress. */
function postApplication(data: FormData, onProgress: (fraction: number) => void): Promise<ServerResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CAREERS_ENDPOINT);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let body: ServerResult['body'] = null;
      try {
        body = JSON.parse(xhr.responseText) as ServerResult['body'];
      } catch {
        body = null;
      }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error('network'));
    xhr.ontimeout = () => reject(new Error('timeout'));
    xhr.send(data);
  });
}

const inputClassName =
  'mt-2 block min-h-12 w-full rounded-[6px] border border-[var(--border-strong)] bg-[var(--surface-band-raised)] px-3.5 text-[16px] text-[var(--ink)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[var(--ink-muted)] focus:border-[var(--focus-ring)] focus:bg-[var(--surface-raised)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--focus-ring)_18%,transparent)] aria-[invalid=true]:border-[var(--danger)]';

export default function ApplicationForm({ role }: { role: RoleSlug }): JSX.Element {
  const formId = useId();
  const [values, setValues] = useState<DraftValues>(EMPTY_DRAFT);
  const [siteShiftConfirmed, setSiteShiftConfirmed] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<CareersField, string>>>({});
  const [resume, setResume] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [source, setSource] = useState('');
  const inFlight = useRef(false);
  const idempotencyKey = useRef(newIdempotencyKey());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thankYouRef = useRef<HTMLDivElement>(null);
  const draftLoaded = useRef(false);

  const id = (name: string) => `${formId}-${name}`;

  // Restore a draft and remember where the applicant came from (the Facebook
  // post links carry ?utm_source=facebook).
  useEffect(() => {
    setValues((current) => ({ ...current, ...readDraft() }));
    const params = new URLSearchParams(window.location.search);
    const utm = (params.get('utm_source') ?? params.get('source') ?? '').slice(0, 40);
    setSource(/^[A-Za-z0-9_.-]*$/.test(utm) ? utm : '');
    draftLoaded.current = true;
  }, []);

  useEffect(() => {
    if (draftLoaded.current && !done) writeDraft(values);
  }, [values, done]);

  useEffect(() => {
    if (done) thankYouRef.current?.focus();
  }, [done]);

  // The summary banner goes once the applicant has fixed everything it flagged.
  useEffect(() => {
    if (status === copy.states.validationSummary && !Object.values(errors).some(Boolean)) setStatus(null);
  }, [errors, status]);

  function clearError(field: CareersField) {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function update(name: keyof DraftValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    clearError(name);
  }

  function onText(event: ChangeEvent<HTMLInputElement>) {
    update(event.target.name as keyof DraftValues, event.target.value);
  }

  function validateAll(): boolean {
    const found = validateCareers({ ...values, role, siteShiftConfirmed, consent });
    if (!resume) found.resume ??= 'Attach your resume.';
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (!first) {
      setStatus(null);
      return true;
    }
    setStatus(copy.states.validationSummary);
    requestAnimationFrame(() => document.getElementById(id(first))?.focus());
    return false;
  }

  async function acceptFile(file: File | undefined) {
    if (!file) return;
    const verdict = await checkResume(file);
    if (verdict === 'ok') {
      setResume(file);
      clearError('resume');
      return;
    }
    setResume(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrors((current) => ({
      ...current,
      resume:
        verdict === 'too_large'
          ? copy.states.tooLarge
          : verdict === 'empty'
            ? 'That file is empty. Please choose your resume again.'
            : copy.states.wrongType,
    }));
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    void acceptFile(event.dataTransfer.files?.[0]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !validateAll() || !resume) return;

    inFlight.current = true;
    setSubmitting(true);
    setProgress(0);
    setStatus(null);

    const data = new FormData();
    data.append('role', role);
    data.append('fullName', values.fullName.trim());
    data.append('email', values.email.trim());
    data.append('phone', values.phone.trim());
    data.append('outboundYears', values.outboundYears);
    data.append('csYears', values.csYears);
    // The handler accepts digits only; "25,000" is normalised here.
    data.append('expectedSalary', String(parsePeso(values.expectedSalary) ?? ''));
    data.append('siteShiftConfirmed', siteShiftConfirmed ? 'yes' : '');
    data.append('consent', consent ? 'yes' : '');
    data.append('source', source);
    data.append('website', '');
    data.append('idempotencyKey', idempotencyKey.current);
    data.append('resume', resume, resume.name);

    try {
      const { status: code, body } = await postApplication(data, setProgress);
      // 2xx, or any response that says the application is on file (a replay,
      // or mail still queued), means the applicant is done.
      if ((code >= 200 && code < 300) || body?.recorded === true) {
        idempotencyKey.current = newIdempotencyKey();
        writeDraft(null);
        setDone(true);
        return;
      }
      if (code === 413 || code === 415) {
        const message = code === 413 ? copy.states.tooLarge : copy.states.wrongType;
        setErrors((current) => ({ ...current, resume: message }));
        setStatus(message);
      } else if (code === 422 && Array.isArray(body?.fields) && body.fields.length > 0) {
        const serverFields = body.fields.filter((field): field is CareersField => (FIELD_ORDER as string[]).includes(field));
        setErrors((current) => {
          const next = { ...current };
          for (const field of serverFields) next[field] = 'Please check this answer.';
          return next;
        });
        const first = FIELD_ORDER.find((field) => serverFields.includes(field));
        if (first) requestAnimationFrame(() => document.getElementById(id(first))?.focus());
        setStatus(copy.states.validationSummary);
      } else if (code === 429) {
        setStatus(copy.states.rateLimited);
      } else {
        setStatus(copy.states.failure);
      }
    } catch {
      // The key is kept: the request may have arrived even though the answer
      // did not, and the retry must be recognised as the same application.
      setStatus(copy.states.failure);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        ref={thankYouRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-raised)] p-8 text-center shadow-[0_24px_60px_rgba(13,39,70,0.10)] outline-none sm:p-12"
      >
        <svg className={`${styles.successMark} mx-auto size-16 text-[var(--green-600)]`} viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.12" />
          <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
          <path className={styles.successCheck} d="M20 33 L28 41 L45 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="mx-auto mt-6 max-w-[30ch] font-display text-[clamp(1.5rem,3vw,2rem)] leading-snug text-[var(--navy-900)]">{copy.thankYou}</h2>
      </div>
    );
  }

  return (
    <form
      action={CAREERS_ENDPOINT}
      method="post"
      encType="multipart/form-data"
      noValidate
      onSubmit={(event) => void submit(event)}
      className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-raised)] px-5 pb-7 pt-7 shadow-[0_24px_60px_rgba(13,39,70,0.10)] sm:px-9 sm:pt-9"
    >
      {/* Honeypot: hidden from people, filled by bots. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0" defaultValue="" />

      {status && (
        <p role="alert" className="mb-6 rounded-[7px] border border-[var(--danger)]/35 bg-[var(--danger)]/[0.06] px-4 py-3 text-small text-[var(--danger)]">
          {status}
        </p>
      )}

      <div className="grid gap-7">
        <div>
          <span className="text-small font-semibold text-[var(--ink)]">{copy.fields.resume.label}</span>
          <label
            htmlFor={id('resume')}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''} mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed px-5 py-8 text-center ${
              errors.resume
                ? 'border-[var(--danger)] bg-[var(--danger)]/[0.04]'
                : dragging
                  ? 'border-[var(--green-600)] bg-[var(--green-600)]/[0.06]'
                  : 'border-[var(--border-strong)] bg-[var(--surface-band-raised)] hover:border-[var(--steel-600)]'
            }`}
          >
            {resume ? (
              <>
                {resume.name.toLowerCase().endsWith('.pdf') ? (
                  <FilePdf size={36} aria-hidden="true" className="text-[var(--steel-600)]" />
                ) : (
                  <FileDoc size={36} aria-hidden="true" className="text-[var(--steel-600)]" />
                )}
                <span className="max-w-full truncate text-small font-semibold text-[var(--navy-900)]">{resume.name}</span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {(resume.size / 1024 / 1024).toFixed(2)} MB of {RESUME_MAX_BYTES / 1024 / 1024} MB · {copy.fields.resume.replace}
                </span>
              </>
            ) : (
              <>
                <FileArrowUp size={36} aria-hidden="true" className="text-[var(--steel-600)]" />
                <span className="text-small text-[var(--navy-900)]">
                  {copy.fields.resume.dropPrompt}{' '}
                  <span className="font-semibold text-[var(--steel-600)] underline underline-offset-4">{copy.fields.resume.browse}</span>
                </span>
                <span className="text-xs text-[var(--ink-muted)]">{copy.fields.resume.helper}</span>
              </>
            )}
          </label>
          <input
            ref={fileInputRef}
            id={id('resume')}
            name="resume"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            aria-invalid={errors.resume ? 'true' : undefined}
            aria-describedby={errors.resume ? `${id('resume')}-error` : undefined}
            onChange={(event) => void acceptFile(event.target.files?.[0])}
          />
          {resume && (
            <button
              type="button"
              onClick={() => {
                setResume(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--danger)]"
            >
              <X size={14} aria-hidden="true" /> Remove file
            </button>
          )}
          <FieldError id={`${id('resume')}-error`} error={errors.resume} />
        </div>

        <TextInput id={id('fullName')} name="fullName" label={copy.fields.fullName.label} value={values.fullName} error={errors.fullName} onChange={onText} autoComplete="name" />
        <div className="grid gap-7 sm:grid-cols-2">
          <TextInput id={id('email')} name="email" type="email" label={copy.fields.email.label} value={values.email} error={errors.email} onChange={onText} autoComplete="email" />
          <TextInput id={id('phone')} name="phone" type="tel" label={copy.fields.phone.label} value={values.phone} error={errors.phone} onChange={onText} autoComplete="tel" />
        </div>

        <Choice id={id('outboundYears')} name="outboundYears" legend={copy.fields.outboundYears.label} value={values.outboundYears} error={errors.outboundYears} onChange={(v) => update('outboundYears', v)} />
        <Choice id={id('csYears')} name="csYears" legend={copy.fields.csYears.label} value={values.csYears} error={errors.csYears} onChange={(v) => update('csYears', v)} />

        <div>
          <label htmlFor={id('expectedSalary')} className="text-small font-semibold text-[var(--ink)]">
            {copy.fields.expectedSalary.label}
          </label>
          <div className="relative max-w-[18rem]">
            <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-small font-semibold text-[var(--ink-muted)]">
              PHP
            </span>
            <input
              id={id('expectedSalary')}
              name="expectedSalary"
              inputMode="numeric"
              autoComplete="off"
              placeholder="25,000"
              value={values.expectedSalary}
              onChange={onText}
              aria-invalid={errors.expectedSalary ? 'true' : undefined}
              aria-describedby={errors.expectedSalary ? `${id('expectedSalary')}-error` : undefined}
              className={`${inputClassName} pl-12 tabular-nums`}
            />
          </div>
          <FieldError id={`${id('expectedSalary')}-error`} error={errors.expectedSalary} />
        </div>

        <Tick
          id={id('siteShiftConfirmed')}
          checked={siteShiftConfirmed}
          error={errors.siteShiftConfirmed}
          emphasis
          onChange={(checked) => {
            setSiteShiftConfirmed(checked);
            clearError('siteShiftConfirmed');
          }}
        >
          {copy.fields.siteShiftConfirmed.label}
        </Tick>

        <Tick
          id={id('consent')}
          checked={consent}
          error={errors.consent}
          onChange={(checked) => {
            setConsent(checked);
            clearError('consent');
          }}
        >
          {copy.fields.consent.label}{' '}
          <Link href={copy.privacyHref} className="font-semibold text-[var(--steel-600)] underline underline-offset-4">
            {copy.privacyLinkLabel}
          </Link>
        </Tick>
      </div>

      {submitting && (
        <div className="mt-7" role="status" aria-live="polite">
          <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--surface-band-deep)]">
            <span className={`${styles.uploadBar} block h-full bg-[var(--green-600)]`} style={{ transform: `scaleX(${Math.max(progress, 0.04)})` }} />
          </span>
          <span className="mt-2 block text-xs text-[var(--ink-muted)]">
            {copy.sending} ({Math.round(progress * 100)}%)
          </span>
        </div>
      )}

      <div className="mt-8 border-t border-[var(--border)] pt-6">
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[7px] bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-8 text-small font-semibold text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.18)] transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] sm:w-auto"
        >
          {submitting ? (
            <>
              <CircleNotch size={18} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> {copy.sending}
            </>
          ) : (
            <>
              {copy.submit} <CheckCircle size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

/* ---------- Small field components ---------- */

function TextInput({
  id,
  name,
  label,
  value,
  error,
  onChange,
  type = 'text',
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'tel';
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-small font-semibold text-[var(--ink)]">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClassName}
      />
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function Choice({
  id,
  name,
  legend,
  value,
  error,
  onChange,
}: {
  id: string;
  name: string;
  legend: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-small font-semibold leading-snug text-[var(--ink)]">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {yearsOptions.map((option, index) => {
          const checked = value === option.value;
          return (
            <label key={option.value} className={`${styles.option} cursor-pointer`}>
              <input
                // The first option carries the group's id, so error focus lands in the group.
                id={index === 0 ? id : undefined}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-small transition-colors duration-150 ${
                  checked
                    ? 'border-[var(--green-600)] bg-[var(--green-600)] font-semibold text-white'
                    : error
                      ? 'border-[var(--danger)] bg-[var(--surface-raised)] text-[var(--navy-900)]'
                      : 'border-[var(--border-strong)] bg-[var(--surface-raised)] text-[var(--navy-900)] hover:border-[var(--steel-600)]'
                }`}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      <FieldError id={`${id}-error`} error={error} />
    </fieldset>
  );
}

function Tick({
  id,
  checked,
  error,
  emphasis = false,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  error?: string;
  emphasis?: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className={emphasis ? `rounded-[10px] border p-4 ${error ? 'border-[var(--danger)]' : 'border-[var(--border-strong)]'} bg-[var(--surface-band-raised)]` : undefined}>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-1 size-5 shrink-0 accent-[var(--green-600)]"
        />
        <span className={`leading-relaxed text-[var(--ink)] ${emphasis ? 'text-body font-semibold' : 'text-small'}`}>{children}</span>
      </label>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} role="alert" className="mt-2 text-xs leading-4 text-[var(--danger)]">
      {error}
    </p>
  ) : null;
}
