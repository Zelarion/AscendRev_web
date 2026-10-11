'use client';

import { useEffect } from 'react';

/**
 * Where an applicant came from, kept across the careers pages for the session.
 *
 * An ad or a shared post links to a posting page; the applicant then clicks
 * "Apply for this Job", which opens the apply screen without the original query
 * string. Reading the source only on the apply screen would record every such
 * applicant as unknown, so it is captured on whichever careers page they land
 * on first and read back on the apply screen.
 *
 * The value goes to `public/api/careers.php`, which accepts 1 to 40 characters
 * of [A-Za-z0-9_.-] and drops anything else.
 */

const STORAGE_KEY = 'ascendrev-careers-source-v1';
const MAX_LENGTH = 40;

/** Referring sites worth naming; anything else external is recorded as "referral". */
const REFERRER_SOURCES: [RegExp, string][] = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, 'facebook'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, 'linkedin'],
  [/(^|\.)indeed\.com$/, 'indeed'],
  [/(^|\.)jobstreet\.com$/, 'jobstreet'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
];

function clean(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH);
}

/** utm_source (or source), plus utm_content when present, e.g. "facebook-video-1". */
function taggedSource(params: URLSearchParams): string {
  const source = params.get('utm_source') ?? params.get('source') ?? '';
  const content = params.get('utm_content') ?? '';
  return clean([source, content].filter(Boolean).join('-'));
}

/** A best guess when the link carried no tag: Facebook's click id, then the referring site. */
function inferredSource(params: URLSearchParams, referrer: string): string {
  if (params.has('fbclid')) return 'facebook';
  if (!referrer) return '';
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host === window.location.hostname) return '';
    return REFERRER_SOURCES.find(([pattern]) => pattern.test(host))?.[1] ?? 'referral';
  } catch {
    return '';
  }
}

function readStored(): string {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function store(value: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode or blocked storage: the apply screen still reads its own URL.
  }
}

/**
 * Records the source for this visit. A tagged link always wins, because it is
 * what the ad or post was set up to say; a guess never replaces an earlier answer.
 */
export function captureCareersSource(): string {
  const params = new URLSearchParams(window.location.search);
  const tagged = taggedSource(params);
  if (tagged) {
    store(tagged);
    return tagged;
  }
  const stored = readStored();
  if (stored) return stored;
  const inferred = inferredSource(params, document.referrer);
  if (inferred) store(inferred);
  return inferred;
}

/** The source to send with an application: what was captured, or "direct". */
export function careersSourceForApplication(): string {
  return captureCareersSource() || 'direct';
}

/** Drop-in for the careers pages that do not render the form. */
export function CareersSourceCapture(): null {
  useEffect(() => {
    captureCareersSource();
  }, []);
  return null;
}
