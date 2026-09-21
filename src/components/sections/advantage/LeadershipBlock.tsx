import type { JSX } from 'react';
import Image from 'next/image';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import { WordReveal } from '@/components/motion';
import Reveal from '@/components/ui/Reveal';
import Stagger from '@/components/ui/Stagger';
import { advantage } from '@/content/advantage';

/**
 * Leadership block, `#leadership` (SPEC.md §4.3, item 2).
 *
 * The one thing that matters more than the layout here: the career record is
 * Rio Vidal's personal record, earned before AscendRev existed, and a reader
 * must not be able to mistake it for the company's. SPEC.md §7 item 1 makes
 * that a content risk, not a nicety.
 *
 * So the attribution line is not a footnote under the record. It is the first
 * thing inside the record region, set at body-lg weight 500 in full-strength
 * `--ink` between two ink-coloured hairlines, which is the only place on
 * either of these pages a rule is drawn in the text colour rather than in
 * `--border`. Everything below it is read through it.
 *
 * Structure is visual left, narrative right, per the spec. The local city
 * image is used as an editorial brand visual, not as a portrait.
 */

/** Tracked mono label. Duplicated across this page's sections deliberately:
 * `sections/shared/` is another builder's directory in this pass. */
const RECORD_LABEL =
  'font-mono text-small font-medium uppercase tracking-[0.3em] text-[var(--ink)]';

/** Hairline-divided row. A top rule on every row including the first, and no
 * bottom rule anywhere, so a group reads as a set rather than as a stack of
 * boxed lines. */
const SHEET_ROW = 'border-t border-[var(--border)] py-5';
const BRAND_VISUAL_SRC = '/video/hero-poster.jpg';
const BRAND_VISUAL_ALT =
  'Nighttime city street used as an AscendRev editorial brand visual.';

export default function LeadershipBlock(): JSX.Element {
  const {
    id,
    heading,
    name,
    role,
    location,
    narrative,
    commitment,
    recordHeading,
    facts,
    credentialsHeading,
    credentials,
    attribution,
  } = advantage.leadership;

  return (
    <Section id={id}>
      <Container>
        {/* Colour is inherited from Section's light tone and deliberately not
            restated. WordReveal passes className through `cn`, and
            tailwind-merge reads the arbitrary value in `text-[var(--ink)]` as
            a possible font size, so asking for both drops `text-h2` and
            renders the heading at body size. */}
        <WordReveal as="h2" className="max-w-[20ch] font-display text-h2">
          {heading}
        </WordReveal>

        <Stagger className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--navy)]">
                <Image
                  src={BRAND_VISUAL_SRC}
                  alt={BRAND_VISUAL_ALT}
                  fill
                  sizes="(min-width: 768px) 42vw, 100vw"
                  className="object-cover brightness-[0.82] saturate-[0.78]"
                />
              </div>
              <figcaption className="mt-4 text-small text-[var(--ink-muted)]">
                Editorial brand visual, not a portrait.
              </figcaption>
            </figure>
            <p className="mt-8 text-h3 text-[var(--ink)]">{name}</p>
            <p className="mt-1 text-body text-[var(--ink-muted)]">{role}</p>
            <p className="mt-4 font-mono text-label uppercase text-[var(--ink-muted)]">
              {location}
            </p>
          </div>

          <div className="md:col-span-7">
            {narrative.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-6 max-w-[68ch] text-body-lg text-[var(--ink-muted)] first:mt-0"
              >
                {paragraph}
              </p>
            ))}

            {/* Pull quote. Newsreader is the display face for pull quotes
                (DESIGN.md §2); the size sits deliberately between h3 and h2 so
                the quote carries weight without competing with the section
                heading it sits under. No decorative quote marks. */}
            <blockquote className="mt-10 border-t border-[var(--border)] pt-8">
              <p className="max-w-[40ch] font-display text-[clamp(1.375rem,2.4vw,1.75rem)] leading-[1.35] tracking-[-0.015em] text-[var(--ink)]">
                {commitment}
              </p>
            </blockquote>
          </div>
        </Stagger>

        {/* Set at h3 scale, a step above the 18px narrative it qualifies, and
            ruled top and bottom in the text colour rather than in `--border`.
            A reader scanning the record cannot take this for a footnote, which
            is the entire requirement (SPEC.md §7 item 1). */}
        <Reveal className="mt-20">
          <p className="max-w-[64ch] border-y border-[var(--ink)] py-6 text-h3 text-[var(--ink)]">
            {attribution}
          </p>
        </Reveal>

        <Stagger className="mt-14 grid gap-x-16 gap-y-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <h3 className={RECORD_LABEL}>{recordHeading}</h3>
            <dl className="mt-8">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className={`${SHEET_ROW} grid gap-1 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-6`}
                >
                  <dt className="text-body text-[var(--ink-muted)]">{fact.label}</dt>
                  <dd className="text-body text-[var(--ink)]">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="md:col-span-5">
            <h3 className={RECORD_LABEL}>{credentialsHeading}</h3>
            <ul className="mt-8">
              {credentials.map((credential) => {
                // Joined, never invented. An entry whose issuer and year are
                // still unconfirmed renders as its name alone rather than
                // borrowing a plausible-looking one (SPEC.md §7 item 4).
                const source = [credential.issuer, credential.awarded]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <li key={credential.name} className={SHEET_ROW}>
                    <p className="text-body text-[var(--ink)]">{credential.name}</p>
                    {source ? (
                      <p className="mt-1 text-small text-[var(--ink-muted)]">{source}</p>
                    ) : null}
                    {credential.note ? (
                      <p className="mt-1 text-small text-[var(--ink-muted)]">{credential.note}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </Stagger>
      </Container>
    </Section>
  );
}
