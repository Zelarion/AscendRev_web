'use client';

import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import Link from 'next/link';
import { hoverTransitionStyle } from '@/lib/motion';

/**
 * The reader's recorded answer. Anything else in storage, including a value
 * written by an older version of this component, counts as no answer and the
 * notice is shown again. Consent is the kind of thing to be sure about rather
 * than to guess at, so an unrecognised value fails closed toward asking.
 */
type ConsentChoice = 'accepted' | 'rejected';

const CONSENT_STORAGE_KEY = 'ascendrev-cookie-consent';

function isConsentChoice(value: unknown): value is ConsentChoice {
  return value === 'accepted' || value === 'rejected';
}

function readStoredConsent(): ConsentChoice | null {
  try {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return isConsentChoice(stored) ? stored : null;
  } catch {
    // A private window throws on access rather than returning null. Treat it
    // as no answer: the notice appears, the answer cannot be saved, and the
    // reader sees it again next time. That is the honest outcome, and nothing
    // about the site's behaviour depends on which way they answered.
    return null;
  }
}

function storeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // See readStoredConsent. Nothing to recover and nothing to tell the
    // reader, since the answer changes no behaviour either way.
  }
}

/**
 * The cookie notice.
 *
 * What this is honest about, and why the copy reads the way it does: there is
 * no analytics, no advertising and no third-party tracking on this site
 * (SPEC.md §8 says so explicitly, and PRODUCT.md rules out third-party form
 * services for the same reason). Nothing is loaded or blocked by the answer.
 * Writing "we use cookies to improve your experience" here would describe a
 * system that does not exist, which is the kind of claim PRODUCT.md calls the
 * failure mode of this whole site.
 *
 * Accept and Reject are the same size, the same weight and the same colour,
 * sitting side by side in reading order. Neither is a link, neither is greyed,
 * and there is no close affordance that quietly counts as consent.
 *
 * Accessibility, and one deliberate departure. The notice is a `dialog` with a
 * label, it takes focus when it appears, Tab is trapped inside it while it is
 * open, and Escape dismisses it as a rejection. It does NOT set
 * `aria-modal="true"`, which would hide the rest of the page from a screen
 * reader until the reader answered. The brief is explicit that the notice must
 * not block the page, and hiding the entire document behind a notice about
 * storage that is not in use would be exactly that.
 *
 * It is `position: fixed`, so it cannot shift layout when it appears or when
 * it leaves.
 */
export default function CookieConsent(): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Starts closed and can only open from an effect, which never runs on the
  // server. The notice is therefore absent from the exported HTML: a reader
  // who has already answered never receives the markup at all, and no reader
  // sees it flash before storage has been read.
  useEffect(() => {
    if (readStoredConsent() === null) {
      setIsOpen(true);
    }
  }, []);

  const dismiss = useCallback((choice: ConsentChoice) => {
    storeConsent(choice);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (!panel) return;

    // Moving focus here is what announces the notice. A polite live region
    // would be read out mid-sentence over whatever the reader was already on,
    // and would leave them with no obvious way to reach the two buttons.
    panel.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        // Escape is the least committal action available, so it maps to the
        // least committal answer. Treating a dismissal as acceptance is the
        // pattern this component exists to avoid.
        dismiss('rejected');
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismiss]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby="cookie-consent-heading"
      aria-describedby="cookie-consent-body"
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 z-[var(--z-toast)] max-h-[100dvh] overflow-y-auto border-t border-[var(--border)] bg-[var(--surface)] p-[clamp(1.25rem,5vw,2rem)] outline-none"
    >
      <div className="mx-auto flex w-full min-w-0 max-w-[1200px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 max-w-[68ch]">
          <h2
            id="cookie-consent-heading"
            className="text-h3 font-sans font-semibold text-[var(--ink)]"
          >
            Cookies and site storage
          </h2>
          <p id="cookie-consent-body" className="mt-2 break-words text-small text-[var(--ink-muted)]">
            This site runs no analytics, no advertising and no third party tracking, so nothing is
            loaded or blocked by your answer today. We ask now so your preference is already on
            record if non essential storage is ever added. Your answer, and whether you chose the
            light or dark view, are kept in this browser only. See our{' '}
            <Link
              href="/privacy"
              className="text-[var(--steel-600)] underline underline-offset-2 outline-none"
              style={hoverTransitionStyle}
            >
              privacy policy
            </Link>
            .
          </p>
        </div>

        {/* Both choices retain identical styling and reading order. They stack
            below the smallest breakpoint so neither label can force the notice
            beyond the viewport. */}
        <div className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 md:w-auto md:min-w-[15rem]">
          <button
            type="button"
            onClick={() => dismiss('accepted')}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[6px] border border-[var(--border-strong)] bg-transparent px-6 text-sm font-medium text-[var(--ink)] outline-none transition-colors hover:bg-[var(--border)] active:scale-[0.98]"
            style={hoverTransitionStyle}
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => dismiss('rejected')}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[6px] border border-[var(--border-strong)] bg-transparent px-6 text-sm font-medium text-[var(--ink)] outline-none transition-colors hover:bg-[var(--border)] active:scale-[0.98]"
            style={hoverTransitionStyle}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
