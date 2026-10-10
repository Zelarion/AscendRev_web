'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type JSX } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CircleNotch,
  FileArrowUp,
  FilePdf,
  FileDoc,
  LinkSimple,
  FacebookLogo,
  PencilSimple,
  X,
} from '@phosphor-icons/react';
import {
  applicationForm as copy,
  careerRoles,
  generalApplication,
  openRoles,
  yearsOptions,
  yesNoOptions,
  type RoleSlug,
} from '@/content/careers';
import {
  FIELD_ORDER,
  FIELD_STEP,
  RESUME_MAX_BYTES,
  ROLE_SLUGS,
  checkResume,
  parsePeso,
  validateCareers,
  type CareersField,
  type CareersValues,
} from '@/lib/careersSchema';
import { ROLE_SELECTED_EVENT } from './roleSelection';
import styles from './careers.module.css';

/**
 * Where applications are posted. Same-origin on cPanel; overridable at build
 * time for a split deployment, in which case that host must be in the
 * handler's ASCENDREV_ALLOWED_HOSTS or every application gets a 403.
 */
const CAREERS_ENDPOINT = process.env.NEXT_PUBLIC_CAREERS_ENDPOINT || '/api/careers.php';

/** Text answers survive an accidental refresh. The file cannot, by design. */
const DRAFT_KEY = 'ascendrev-careers-draft-v1';

const EMPTY: CareersValues = {
  fullName: '',
  email: '',
  phone: '',
  role: '',
  linkedin: '',
  outboundYears: '',
  csYears: '',
  onsiteNightShift: '',
  supervisoryExperience: '',
  supervisoryDetails: '',
  payMin: '',
  payMax: '',
  consent: false,
};

const STEP_FIELDS: CareersField[][] = [0, 1, 2].map((step) => FIELD_ORDER.filter((field) => FIELD_STEP[field] === step));

const ROLE_OPTIONS: { value: RoleSlug; label: string }[] = [
  ...openRoles.map((role) => ({ value: role.slug, label: role.title })),
  { value: generalApplication.slug, label: generalApplication.title },
];

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

function isRoleSlug(value: string | null): value is RoleSlug {
  return value !== null && (ROLE_SLUGS as readonly string[]).includes(value);
}

function readDraft(): Partial<CareersValues> {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<CareersValues>) : {};
  } catch {
    return {};
  }
}

function writeDraft(values: CareersValues | null): void {
  try {
    if (values) window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, consent: false }));
    else window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private mode or blocked storage: the form simply does not remember.
  }
}

interface ServerResult {
  status: number;
  body: { ok?: boolean; recorded?: boolean; reference?: string; error?: string; fields?: string[] } | null;
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

interface ApplicationFormProps {
  /** Pre-selects a role, e.g. on a role's own page. */
  initialRole?: RoleSlug;
}

export default function ApplicationForm({ initialRole }: ApplicationFormProps): JSX.Element {
  const formId = useId();
  const [values, setValues] = useState<CareersValues>({ ...EMPTY, role: initialRole ?? '' });
  const [errors, setErrors] = useState<Partial<Record<CareersField, string>>>({});
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [resume, setResume] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [source, setSource] = useState('');
  const inFlight = useRef(false);
  const idempotencyKey = useRef(newIdempotencyKey());
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftLoaded = useRef(false);

  const id = (name: string) => `${formId}-${name}`;

  // Restore a draft, then let the URL (?role=, utm_source) and the page's
  // initial role win, because they reflect what the applicant just clicked.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role');
    const draft = readDraft();
    setValues((current) => ({
      ...current,
      ...draft,
      consent: false,
      role: initialRole ?? (isRoleSlug(urlRole) ? urlRole : (draft.role ?? current.role)),
    }));
    const utm = (params.get('utm_source') ?? params.get('source') ?? '').slice(0, 40);
    setSource(/^[A-Za-z0-9_.-]*$/.test(utm) ? utm : '');
    draftLoaded.current = true;
  }, [initialRole]);

  useEffect(() => {
    if (draftLoaded.current && !done) writeDraft(values);
  }, [values, done]);

  useEffect(() => {
    function onSelect(event: Event) {
      const slug = (event as CustomEvent<RoleSlug>).detail;
      if (isRoleSlug(slug)) {
        setValues((current) => ({ ...current, role: slug }));
        setErrors((current) => ({ ...current, role: undefined }));
        setDone(false);
        setStep(0);
      }
    }
    window.addEventListener(ROLE_SELECTED_EVENT, onSelect);
    return () => window.removeEventListener(ROLE_SELECTED_EVENT, onSelect);
  }, []);

  const focusStepHeading = useCallback(() => {
    requestAnimationFrame(() => stepHeadingRef.current?.focus({ preventScroll: false }));
  }, []);

  function update<K extends keyof CareersValues>(name: K, value: CareersValues[K]) {
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function onText(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    update(event.target.name as keyof CareersValues, event.target.value as never);
  }

  /** Validates the given step (or all of them) and shows only that step's errors. */
  function validateStep(target: 0 | 1 | 2 | 'all'): boolean {
    const found = validateCareers(values) as Partial<Record<CareersField, string>>;
    if (!resume) found.resume = 'Attach your resume.';
    const fields = target === 'all' ? FIELD_ORDER : STEP_FIELDS[target];
    const relevant: Partial<Record<CareersField, string>> = {};
    for (const field of fields) if (found[field]) relevant[field] = found[field];

    setErrors((current) => {
      const next = { ...current };
      for (const field of fields) next[field] = relevant[field];
      return next;
    });

    const first = fields.find((field) => relevant[field]);
    if (!first) {
      setStatus(null);
      return true;
    }
    setStatus(copy.states.validationSummary);
    const firstStep = FIELD_STEP[first];
    if (firstStep !== step) setStep(firstStep);
    requestAnimationFrame(() => document.getElementById(id(first))?.focus());
    return false;
  }

  function next() {
    if (step < 2 && validateStep(step)) {
      setStep((step + 1) as 1 | 2);
      focusStepHeading();
    }
  }

  function back() {
    if (step > 0) {
      setStatus(null);
      setStep((step - 1) as 0 | 1);
      focusStepHeading();
    }
  }

  async function acceptFile(file: File | undefined) {
    if (!file) return;
    const verdict = await checkResume(file);
    if (verdict === 'ok') {
      setResume(file);
      setErrors((current) => ({ ...current, resume: undefined }));
      return;
    }
    setResume(null);
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
    if (step < 2) {
      next();
      return;
    }
    if (inFlight.current || !validateStep('all') || !resume) return;

    inFlight.current = true;
    setSubmitting(true);
    setProgress(0);
    setStatus(null);

    const data = new FormData();
    data.append('fullName', values.fullName.trim());
    data.append('email', values.email.trim());
    data.append('phone', values.phone.trim());
    data.append('role', values.role);
    data.append('linkedin', values.linkedin.trim());
    data.append('outboundYears', values.outboundYears);
    data.append('csYears', values.csYears);
    data.append('onsiteNightShift', values.onsiteNightShift);
    data.append('supervisoryExperience', values.supervisoryExperience);
    data.append('supervisoryDetails', values.supervisoryExperience === 'yes' ? values.supervisoryDetails.trim() : '');
    // The handler accepts digits only; "25,000" is normalised here.
    data.append('payMin', String(parsePeso(values.payMin) ?? ''));
    data.append('payMax', String(parsePeso(values.payMax) ?? ''));
    data.append('source', source);
    data.append('consent', values.consent ? 'yes' : '');
    data.append('website', '');
    data.append('idempotencyKey', idempotencyKey.current);
    data.append('resume', resume, resume.name);

    try {
      const { status: code, body } = await postApplication(data, setProgress);
      // 2xx, or any response that says the application is on file (a replay,
      // or mail still queued), means the applicant is done.
      if ((code >= 200 && code < 300) || body?.recorded === true) {
        idempotencyKey.current = newIdempotencyKey();
        setReference(body?.reference ?? null);
        setDone(true);
        writeDraft(null);
        return;
      }
      if (code === 413) {
        setStep(2);
        setErrors((current) => ({ ...current, resume: copy.states.tooLarge }));
        setStatus(copy.states.tooLarge);
      } else if (code === 415) {
        setStep(2);
        setErrors((current) => ({ ...current, resume: copy.states.wrongType }));
        setStatus(copy.states.wrongType);
      } else if (code === 422 && Array.isArray(body?.fields) && body.fields.length > 0) {
        const serverFields = body.fields.filter((field): field is CareersField => field in FIELD_STEP);
        const first = FIELD_ORDER.find((field) => serverFields.includes(field));
        setErrors((current) => {
          const nextErrors = { ...current };
          for (const field of serverFields) nextErrors[field] = 'Please check this answer.';
          return nextErrors;
        });
        if (first) {
          setStep(FIELD_STEP[first]);
          requestAnimationFrame(() => document.getElementById(id(first))?.focus());
        }
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

  function startAnother() {
    setValues({ ...EMPTY });
    setResume(null);
    setErrors({});
    setStatus(null);
    setReference(null);
    setStep(0);
    setDone(false);
    setProgress(0);
    focusStepHeading();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  function shareUrl(): string {
    const role = careerRoles.find((candidate) => candidate.slug === values.role);
    return role ? `${window.location.origin}/careers/${role.slug}/` : `${window.location.origin}/careers/`;
  }

  const roleLabel = ROLE_OPTIONS.find((option) => option.value === values.role)?.label ?? '';
  const yearsLabel = (value: string) => yearsOptions.find((option) => option.value === value)?.label ?? '';
  const yesNoLabel = (value: string) => yesNoOptions.find((option) => option.value === value)?.label ?? '';
  const pay = (value: string) => {
    const n = parsePeso(value);
    return n === null ? value : `PHP ${n.toLocaleString('en-PH')}`;
  };

  if (done) {
    return (
      <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-raised)] p-6 text-center shadow-[0_24px_60px_rgba(13,39,70,0.10)] sm:p-10" role="status" aria-live="polite">
        <svg className={`${styles.successMark} mx-auto size-16 text-[var(--green-600)]`} viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.12" />
          <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
          <path className={styles.successCheck} d="M20 33 L28 41 L45 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3 className="mt-5 font-display text-h2 text-[var(--navy-900)]">{copy.success.heading}</h3>
        <p className="mx-auto mt-3 max-w-[48ch] text-body text-[var(--ink-muted)]">{copy.success.body}</p>
        {reference && (
          <p className="mx-auto mt-6 inline-flex flex-col rounded-[9px] border border-[var(--border)] bg-[var(--surface-band-raised)] px-6 py-3">
            <span className="text-xs text-[var(--ink-muted)]">{copy.success.referenceLabel}</span>
            <span className="font-display text-2xl tracking-[0.06em] text-[var(--navy-900)]">{reference}</span>
          </p>
        )}
        <div className="mt-8 border-t border-[var(--border)] pt-6">
          <p className="text-small text-[var(--ink-muted)]">{copy.success.share}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-[7px] border border-[var(--border-strong)] px-4 text-small font-semibold text-[var(--navy-900)] hover:border-[var(--steel-600)]"
            >
              <FacebookLogo size={18} aria-hidden="true" /> Share on Facebook
            </a>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex min-h-11 items-center gap-2 rounded-[7px] border border-[var(--border-strong)] px-4 text-small font-semibold text-[var(--navy-900)] hover:border-[var(--steel-600)]"
            >
              <LinkSimple size={18} aria-hidden="true" /> {copied ? copy.success.copied : copy.success.copy}
            </button>
          </div>
          <button type="button" onClick={startAnother} className="mt-6 text-small font-semibold text-[var(--steel-600)] underline underline-offset-4">
            {copy.success.another}
          </button>
        </div>
      </div>
    );
  }

  const stepTitle = copy.steps[step];

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[var(--surface-raised)] shadow-[0_24px_60px_rgba(13,39,70,0.10)]">
      {/* Progress: three labelled segments, the fill animates by transform only. */}
      <div className="border-b border-[var(--border)] px-5 pb-5 pt-6 sm:px-8">
        <ol className="grid grid-cols-3 gap-2" aria-label="Application progress">
          {copy.steps.map((label, index) => (
            <li key={label} aria-current={index === step ? 'step' : undefined}>
              <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--surface-band-deep)]">
                <span
                  className={`${styles.progressFill} block h-full rounded-full bg-[linear-gradient(90deg,var(--green-600),var(--gold-500))]`}
                  style={{ transform: `scaleX(${index < step ? 1 : index === step ? 0.5 : 0})` }}
                />
              </span>
              <span className={`mt-2 block text-xs ${index === step ? 'font-semibold text-[var(--navy-900)]' : 'text-[var(--ink-muted)]'}`}>
                <span className="sr-only">Step {index + 1} of 3: </span>
                {label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <form action={CAREERS_ENDPOINT} method="post" encType="multipart/form-data" noValidate onSubmit={(event) => void submit(event)} className="px-5 pb-7 pt-6 sm:px-8">
        {/* Honeypot: hidden from people, filled by bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute h-px w-px overflow-hidden opacity-0" defaultValue="" />

        <h3 ref={stepHeadingRef} tabIndex={-1} className="font-display text-[1.6rem] text-[var(--navy-900)] outline-none">
          {stepTitle}
        </h3>

        {status && (
          <p role="alert" className="mt-4 rounded-[7px] border border-[var(--danger)]/35 bg-[var(--danger)]/[0.06] px-4 py-3 text-small text-[var(--danger)]">
            {status}
          </p>
        )}

        <div key={step} className={`${styles.stepEnter} mt-6 grid gap-6`}>
          {step === 0 && (
            <>
              <Field id={id('role')} label={copy.fields.role.label} error={errors.role}>
                <select id={id('role')} name="role" value={values.role} onChange={onText} aria-invalid={errors.role ? 'true' : undefined} aria-describedby={errors.role ? `${id('role')}-error` : undefined} className={`${inputClassName} pr-10`}>
                  <option value="" disabled>
                    Choose a role
                  </option>
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <TextInput id={id('fullName')} name="fullName" label={copy.fields.fullName.label} value={values.fullName} error={errors.fullName} onChange={onText} autoComplete="name" />
              <div className="grid gap-6 sm:grid-cols-2">
                <TextInput id={id('email')} name="email" type="email" label={copy.fields.email.label} value={values.email} error={errors.email} onChange={onText} autoComplete="email" />
                <TextInput id={id('phone')} name="phone" type="tel" label={copy.fields.phone.label} helper={copy.fields.phone.helper} value={values.phone} error={errors.phone} onChange={onText} autoComplete="tel" />
              </div>
              <TextInput id={id('linkedin')} name="linkedin" type="url" label={copy.fields.linkedin.label} helper={copy.fields.linkedin.helper} value={values.linkedin} error={errors.linkedin} onChange={onText} autoComplete="url" />
            </>
          )}

          {step === 1 && (
            <>
              <Choice id={id('outboundYears')} name="outboundYears" legend={copy.fields.outboundYears.label} options={yearsOptions} value={values.outboundYears} error={errors.outboundYears} onChange={(v) => update('outboundYears', v)} />
              <Choice id={id('csYears')} name="csYears" legend={copy.fields.csYears.label} options={yearsOptions} value={values.csYears} error={errors.csYears} onChange={(v) => update('csYears', v)} />
              <Choice id={id('onsiteNightShift')} name="onsiteNightShift" legend={copy.fields.onsiteNightShift.label} options={yesNoOptions} value={values.onsiteNightShift} error={errors.onsiteNightShift} onChange={(v) => update('onsiteNightShift', v)} />
              <Choice id={id('supervisoryExperience')} name="supervisoryExperience" legend={copy.fields.supervisoryExperience.label} options={yesNoOptions} value={values.supervisoryExperience} error={errors.supervisoryExperience} onChange={(v) => update('supervisoryExperience', v)} />
              {values.supervisoryExperience === 'yes' && (
                <div className={styles.stepEnter}>
                  <Field id={id('supervisoryDetails')} label={copy.fields.supervisoryDetails.label} helper={copy.fields.supervisoryDetails.helper} error={errors.supervisoryDetails} counter={`${values.supervisoryDetails.length} / 800`}>
                    <textarea id={id('supervisoryDetails')} name="supervisoryDetails" rows={4} maxLength={800} value={values.supervisoryDetails} onChange={onText} aria-invalid={errors.supervisoryDetails ? 'true' : undefined} aria-describedby={`${id('supervisoryDetails')}-help${errors.supervisoryDetails ? ` ${id('supervisoryDetails')}-error` : ''}`} className={`${inputClassName} min-h-[7rem] resize-y py-3 leading-6`} />
                  </Field>
                </div>
              )}
              <fieldset>
                <legend className="text-small font-semibold text-[var(--ink)]">{copy.fields.pay.label}</legend>
                <p id={`${id('pay')}-help`} className="mt-1 text-xs text-[var(--ink-muted)]">{copy.fields.pay.helper}</p>
                <div className="mt-1 grid grid-cols-2 gap-4">
                  <PesoInput id={id('payMin')} name="payMin" placeholder="25,000" label={copy.fields.pay.minLabel} value={values.payMin} error={errors.payMin} onChange={onText} helpId={`${id('pay')}-help`} />
                  <PesoInput id={id('payMax')} name="payMax" placeholder="30,000" label={copy.fields.pay.maxLabel} value={values.payMax} error={errors.payMax} onChange={onText} helpId={`${id('pay')}-help`} />
                </div>
              </fieldset>
            </>
          )}

          {step === 2 && (
            <>
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
                    errors.resume ? 'border-[var(--danger)] bg-[var(--danger)]/[0.04]' : dragging ? 'border-[var(--green-600)] bg-[var(--green-600)]/[0.06]' : 'border-[var(--border-strong)] bg-[var(--surface-band-raised)] hover:border-[var(--steel-600)]'
                  }`}
                >
                  {resume ? (
                    <>
                      {resume.name.toLowerCase().endsWith('.pdf') ? <FilePdf size={36} aria-hidden="true" className="text-[var(--steel-600)]" /> : <FileDoc size={36} aria-hidden="true" className="text-[var(--steel-600)]" />}
                      <span className="max-w-full truncate text-small font-semibold text-[var(--navy-900)]">{resume.name}</span>
                      <span className="text-xs text-[var(--ink-muted)]">
                        {(resume.size / 1024 / 1024).toFixed(2)} MB of {RESUME_MAX_BYTES / 1024 / 1024} MB · {copy.fields.resume.replace}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileArrowUp size={36} aria-hidden="true" className="text-[var(--steel-600)]" />
                      <span className="text-small text-[var(--navy-900)]">
                        {copy.fields.resume.dropPrompt} <span className="font-semibold text-[var(--steel-600)] underline underline-offset-4">{copy.fields.resume.browse}</span>
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

              <div className="rounded-[10px] border border-[var(--border)] p-5">
                <h4 className="text-small font-semibold text-[var(--navy-900)]">{copy.review.heading}</h4>
                <dl className="mt-3 grid gap-x-6 gap-y-2 text-small sm:grid-cols-2">
                  <Review label="Role" value={roleLabel} onEdit={() => setStep(0)} />
                  <Review label="Name" value={values.fullName} onEdit={() => setStep(0)} />
                  <Review label="Email" value={values.email} onEdit={() => setStep(0)} />
                  <Review label="Mobile" value={values.phone} onEdit={() => setStep(0)} />
                  <Review label="Outbound sales" value={yearsLabel(values.outboundYears)} onEdit={() => setStep(1)} />
                  <Review label="Customer service" value={yearsLabel(values.csYears)} onEdit={() => setStep(1)} />
                  <Review label="Onsite, night shift" value={yesNoLabel(values.onsiteNightShift)} onEdit={() => setStep(1)} />
                  <Review label="Supervisory experience" value={yesNoLabel(values.supervisoryExperience)} onEdit={() => setStep(1)} />
                  <Review label="Pay expectation" value={`${pay(values.payMin)} to ${pay(values.payMax)}`} onEdit={() => setStep(1)} />
                </dl>
              </div>

              <div>
                <label htmlFor={id('consent')} className="flex cursor-pointer items-start gap-3">
                  <input
                    id={id('consent')}
                    type="checkbox"
                    name="consent"
                    checked={values.consent}
                    onChange={(event) => update('consent', event.target.checked)}
                    aria-invalid={errors.consent ? 'true' : undefined}
                    aria-describedby={errors.consent ? `${id('consent')}-error` : undefined}
                    className="mt-1 size-5 shrink-0 accent-[var(--green-600)]"
                  />
                  <span className="text-small leading-relaxed text-[var(--ink)]">
                    {copy.fields.consent.label}{' '}
                    <Link href={copy.privacyHref} className="font-semibold text-[var(--steel-600)] underline underline-offset-4">
                      {copy.privacyLinkLabel}
                    </Link>
                  </span>
                </label>
                <FieldError id={`${id('consent')}-error`} error={errors.consent} />
              </div>
            </>
          )}
        </div>

        {submitting && (
          <div className="mt-6" role="status" aria-live="polite">
            <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--surface-band-deep)]">
              <span className={`${styles.uploadBar} block h-full bg-[var(--green-600)]`} style={{ transform: `scaleX(${Math.max(progress, 0.04)})` }} />
            </span>
            <span className="mt-2 block text-xs text-[var(--ink-muted)]">
              {copy.nav.sending} ({Math.round(progress * 100)}%)
            </span>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-6">
          {step > 0 ? (
            <button type="button" onClick={back} disabled={submitting} className="inline-flex min-h-12 items-center gap-2 rounded-[7px] px-3 text-small font-semibold text-[var(--navy-900)] hover:bg-[var(--surface-band-raised)] disabled:opacity-50">
              <ArrowLeft size={18} aria-hidden="true" /> {copy.nav.back}
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="inline-flex min-h-12 items-center gap-2 rounded-[7px] bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-6 text-small font-semibold text-[var(--gold-ink)] shadow-[0_8px_22px_rgba(197,151,49,0.18)] transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            {submitting ? (
              <>
                <CircleNotch size={18} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> {copy.nav.sending}
              </>
            ) : step < 2 ? (
              <>
                {copy.nav.next} <ArrowRight size={18} aria-hidden="true" />
              </>
            ) : (
              <>
                {copy.nav.submit} <CheckCircle size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Small field components ---------- */

function Field({
  id,
  label,
  helper,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  counter?: string;
  children: JSX.Element;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-small font-semibold text-[var(--ink)]">
          {label}
        </label>
        {counter && <span className="shrink-0 text-xs tabular-nums text-[var(--ink-muted)]">{counter}</span>}
      </div>
      {helper && (
        <p id={`${id}-help`} className="mt-1 text-xs text-[var(--ink-muted)]">
          {helper}
        </p>
      )}
      {children}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function TextInput({
  id,
  name,
  label,
  helper,
  value,
  error,
  onChange,
  type = 'text',
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  helper?: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'email' | 'tel' | 'url';
  autoComplete?: string;
}) {
  const describedBy = [helper ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <Field id={id} label={label} helper={helper} error={error}>
      <input id={id} name={name} type={type} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} className={inputClassName} />
    </Field>
  );
}

function PesoInput({
  id,
  name,
  placeholder,
  label,
  value,
  error,
  onChange,
  helpId,
}: {
  id: string;
  name: string;
  placeholder: string;
  label: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  helpId: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-[var(--ink-muted)]">
        {label}
      </label>
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 mt-1 -translate-y-1/2 text-small font-semibold text-[var(--ink-muted)]">
          PHP
        </span>
        <input
          id={id}
          name={name}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[helpId, error ? `${id}-error` : null].filter(Boolean).join(' ')}
          className={`${inputClassName} pl-12 tabular-nums`}
        />
      </div>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function Choice<V extends string>({
  id,
  name,
  legend,
  options,
  value,
  error,
  onChange,
}: {
  id: string;
  name: string;
  legend: string;
  options: { value: V; label: string }[];
  value: string;
  error?: string;
  onChange: (value: V) => void;
}) {
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-small font-semibold leading-snug text-[var(--ink)]">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option, index) => {
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

function Review({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] py-2 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      <div className="min-w-0">
        <dt className="text-xs text-[var(--ink-muted)]">{label}</dt>
        <dd className="m-0 truncate text-[var(--navy-900)]">{value || 'Not answered'}</dd>
      </div>
      <button type="button" onClick={onEdit} className="inline-flex min-h-9 shrink-0 items-center gap-1 text-xs font-semibold text-[var(--steel-600)]" aria-label={`${'Edit'} ${label}`}>
        <PencilSimple size={14} aria-hidden="true" />
        Edit
      </button>
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
