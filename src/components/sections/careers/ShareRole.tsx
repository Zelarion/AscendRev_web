'use client';

import { useState, type JSX } from 'react';
import { FacebookLogo, LinkSimple, ShareNetwork } from '@phosphor-icons/react';
import { site } from '@/content/site';

/**
 * Sharing for a role page: the phone's native share sheet where there is one,
 * otherwise Facebook (where AscendRev advertises roles) and copy-link. The
 * shared URL is the canonical one, never the current URL with tracking on it.
 */
export default function ShareRole({ path, title }: { path: string; title: string }): JSX.Element {
  const [copied, setCopied] = useState(false);
  const url = new URL(path, site.url).toString();

  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `${title} at AscendRev`, url });
        return;
      } catch {
        // Dismissed or unsupported: fall through to copying.
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  const buttonClass =
    'inline-flex min-h-12 items-center gap-2 rounded-[7px] border border-white/30 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void share()} className={`${buttonClass} md:hidden`}>
        <ShareNetwork size={18} aria-hidden="true" /> Share
      </button>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${buttonClass} hidden md:inline-flex`}
      >
        <FacebookLogo size={18} aria-hidden="true" /> Share on Facebook
      </a>
      <button type="button" onClick={() => void copy()} className={`${buttonClass} hidden md:inline-flex`} aria-live="polite">
        <LinkSimple size={18} aria-hidden="true" /> {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
