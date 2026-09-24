/**
 * `/advantage` copy. Section order matches SPEC.md §4.3 exactly: hero,
 * leadership, infrastructure, closing band.
 *
 * Two hard constraints from SPEC.md §7 shape this page.
 *
 * Item 1: the revenue figures, the deal range and the awards are Rio Vidal's
 * personal career record. They are attributed to him by name, in his own part
 * of the page, and never to AscendRev Outsourcing Services Corp., which was
 * registered on 11 September 2026. The page says so in plain words rather than
 * leaving the reader to work it out, because the reader will work it out.
 *
 * Item 3: the Philippine operation does not exist yet. The infrastructure
 * section is written in commitment tense, claims no biometric security, no
 * backup power, no fibre redundancy and no premier business district, and its
 * photograph is an unfilled image slot. The build fails while that slot is
 * unfilled (SPEC.md §9 gate 2), which is the intended behaviour: the
 * alternative was photographs of somebody else's offices, and that is the
 * exact thing a buyer who has been burned before goes looking for.
 *
 * Client revision, 2026-09-24: page retitled "The AscendRev Difference",
 * leadership section split into "Career Experience" (narrative) and
 * "PROVEN COMMERCIAL EXPERIENCE" (four stat cards). Copy is treated as
 * verbatim throughout per the client's own instruction not to change the
 * wording; the one exception is "Career Experience" itself, corrected from
 * the client's "Carrer Experience" typo and flagged back for confirmation.
 */

import type {
  ClosingBandContent,
  ImageSlot,
  PageMeta,
  PendingApproval,
} from './home';

export interface AdvantageHeroContent {
  headline: string;
  subheadline: string;
}

/** One row of the founder's career record, rendered as a labelled list. */
export interface CareerFact extends PendingApproval {
  label: string;
  value: string;
}

/**
 * A third-party award, programme or qualification. SPEC.md §7 item 4 requires
 * the wording to stay factual: what was awarded, by whom, and when. The shape
 * asks all three questions, so an unanswered one is visible in the data rather
 * than smoothed over in a sentence. An entry missing `issuer` or `awarded`
 * carries `pendingApproval: true` until AscendRev supplies it.
 */
export interface Credential extends PendingApproval {
  name: string;
  issuer: string | null;
  /** Year or date of the award. Null until confirmed. */
  awarded: string | null;
  /** Optional qualifier shown with the entry. */
  note?: string;
}

/**
 * One of the four "PROVEN COMMERCIAL EXPERIENCE" stat cards (client revision,
 * 2026-09-24). `icon` is a plain-text glyph; the component decides how to
 * render it (a Phosphor line icon for the trophy mark, the glyph character
 * itself for the rest) inside a small bordered container, never as a large
 * emoji.
 */
export interface CommercialStat {
  icon: string;
  label: string;
  description: string;
}

export interface LeadershipContent {
  /** Anchor target: the nav resolves Leadership to `#leadership` on this page (SPEC.md §3). */
  id: string;
  /** Overline above `heading`, client copy verbatim: "Career Experience". */
  sectionLabel: string;
  heading: string;
  portrait: ImageSlot;
  name: string;
  role: string;
  location: string;
  /** Narrative column, one string per paragraph. */
  narrative: readonly string[];
  /** The client's own line about onshore supervision, presented as a quote. */
  commitment: string;
  recordHeading: string;
  facts: readonly CareerFact[];
  credentialsHeading: string;
  credentials: readonly Credential[];
  /** Attribution line printed with the record. Not decoration: it is the point. */
  /** "PROVEN COMMERCIAL EXPERIENCE" heading, client copy verbatim. */
  commercialHeading: string;
  commercialStats: readonly CommercialStat[];
}

export interface CommitmentItem extends PendingApproval {
  text: string;
}

export interface InfrastructureContent {
  heading: string;
  /** Where the operation actually stands today, stated before anything is promised. */
  status: string;
  intro: string;
  image: ImageSlot;
  commitmentsHeading: string;
  commitments: readonly CommitmentItem[];
  note: string;
}

export interface AdvantageContent {
  meta: PageMeta;
  hero: AdvantageHeroContent;
  leadership: LeadershipContent;
  infrastructure: InfrastructureContent;
  closing: ClosingBandContent;
}

export const advantage: AdvantageContent = {
  meta: {
    // Client revision, 2026-09-24: page retitled "The AscendRev Difference".
    title: 'The AscendRev Difference',
    description:
      "Rio Vidal's career record, what stands behind AscendRev, and what the Philippine operation actually is right now. Registered in Canada on 11 September 2026.",
  },

  hero: {
    // Client revision, 2026-09-24: title and strapline verbatim, no full stop after "Impact".
    headline: 'The AscendRev Difference',
    subheadline: 'Right Talent. Purpose-Built Teams. Disciplined Execution. Measurable Impact',
  },

  leadership: {
    id: 'leadership',
    // Client revision, 2026-09-24. The client's brief spelled this "Carrer
    // Experience"; corrected to "Career Experience" because a misspelling in
    // a section heading is a credibility problem, not a wording preference.
    // Flagged back to the client for confirmation per the build brief.
    sectionLabel: 'Career Experience',
    // Heading verbatim from the client's 2026-09-24 brief. Replaces the prior
    // "Engineered by a Proven Player-Coach." heading, which covered the same
    // section and would otherwise sit as a duplicate heading directly above it.
    heading: 'Built by a Leader Who Has Lived the Revenue Journey.',
    portrait: {
      label:
        'Portrait of Rio Vidal, Founder. Head and shoulders, plain background, natural light, business dress. Taken for AscendRev, not a profile photo cropped from somewhere else.',
      ratio: '4 / 5',
      minWidth: 1000,
      alt: 'Rio Vidal, founder of AscendRev Outsourcing Services Corp.',
    },
    name: 'Rio Vidal',
    role: 'Founder',
    location: 'Calgary, Alberta',
    // Client revision, 2026-09-24: replaces the prior three-paragraph
    // narrative, which told the same "who is Rio Vidal" story and would
    // otherwise duplicate this copy immediately below the new heading.
    narrative: [
      'Rio Vidal brings more than a decade of B2B sales and leadership experience, with a career spanning enterprise sales, business development, account management, partnerships, sales leadership, and outsourced operations. He has generated $1B+ in sales revenue, managed commercial opportunities and deal sizes from 10K to $35M, partnered with C-suite decision-makers, and built and coached high-performing teams across diverse industries. That experience shaped the foundation of AscendRev:',
      "Growth requires more than strategy. It requires the capacity to execute. AscendRev provides dedicated professionals and purpose-built teams that extend your organization's sales, customer, and operational capabilities—allowing your internal leaders to focus on strategy, relationships, and growth.",
    ],
    // The client's own line, from the source brief, quoted as written.
    commitment:
      'Process workflow, scope of work and execution playbook is co-created and customized between AscendRev and our Partners.',
    recordHeading: 'Career record',
    // FLAG for founder/client confirmation, 2026-09-24: three different deal
    // size ranges now exist on this page and were not reconciled by the
    // client's brief: this row (CAD$500,000-$35,000,000), the new narrative
    // paragraph above ("10K to $35M", no currency given), and the new
    // commercialStats entry below ("$10M-$35M CAD"). Implemented each exactly
    // as given rather than guessing which is correct or deleting this row as
    // a duplicate, since the lower bound differs by three orders of magnitude
    // across the three mentions.
    facts: [
      {
        label: 'B2B revenue generated',
        value: 'Over CAD$1B across his career.',
      },
      {
        label: 'Deal size closed',
        value: 'CAD$500,000 to CAD$35,000,000.',
      },
      {
        label: 'Markets',
        value: 'Canada and Australia.',
      },
      {
        label: 'Based in',
        value: 'Calgary, Alberta, on the same hours as your operations team.',
      },
    ],
    credentialsHeading: 'Recognition and training',
    // Client revision, 2026-09-24: "100M Dollar Club" (issuer American
    // Express) and "President's Award, awarded twice" removed from this list
    // because they duplicate the new "$100M+ Dollar Recognition" and "2X
    // President's Club" cards in `commercialStats` below. Lean Six Sigma and
    // the Harvard programme are untouched: the client's new copy does not
    // mention either, so SPEC.md §7 item 4's pending-approval gate on them
    // still stands.
    credentials: [
      {
        name: 'Lean Six Sigma',
        issuer: null,
        awarded: null,
        pendingApproval: true,
        pendingReason:
          'SPEC.md §7 item 4. Lean Six Sigma has no single accrediting body. AscendRev must supply the belt level and the certifying organisation, and confirm the certificate is held and current, before the mark is used.',
      },
      {
        name: 'Executive education',
        issuer: 'Harvard Business Impact',
        awarded: null,
        pendingApproval: true,
        pendingReason:
          "SPEC.md §7 item 4. Neither the programme name nor the year is recorded anywhere in the client's brief, and naming Harvard without either implies more than has been confirmed. AscendRev must supply the programme and the year of completion.",
      },
    ],

    // Client revision, 2026-09-24. Four stat cards, copy verbatim including
    // the client's own en dashes in "60–80" and "$10M–$35M CAD".
    commercialHeading: 'PROVEN COMMERCIAL EXPERIENCE',
    commercialStats: [
      {
        icon: '🏆',
        label: "2X President's Club",
        description: 'Recognized for exceptional sales performance and leadership.',
      },
      {
        icon: '◇',
        label: '$100M+ Dollar Recognition',
        description: 'Enterprise recognition for 400% revenue contribution.',
      },
      {
        icon: '▤',
        label: '60–80 Deals Annually',
        description: 'Demonstrated consistency in complex B2B sales.',
      },
      {
        icon: '◆',
        label: '$10M–$35M CAD Deal Sizes',
        description: 'Experience with substantial commercial transactions.',
      },
    ],
  },

  infrastructure: {
    // The source brief titled this "State-of-the-Art Operations" and listed
    // biometric security, 100% backup power, fibre redundancy and offices in
    // premier business districts. None of it exists yet (SPEC.md §7 item 3),
    // so the section states where things stand and then commits, in future
    // tense, to what will be true before a client's team sits down.
    heading: 'What the Philippine Operation Is Today.',
    status:
      'AscendRev was registered on 11 September 2026 and the Philippine operation is being set up now. Nothing in this section describes a facility that exists today.',
    intro:
      'The honest version is more use to you than a photograph would be. Here is what we are committing to before anyone sits down on your account, and how you will know it happened.',
    image: {
      label:
        "Photograph of AscendRev's own Philippine workspace, taken after fit out. Wide interior, real staff at work, daylight. Must be our own premises, photographed by us or by a photographer we commission. Not stock, not an image search result, not another company's floor.",
      ratio: '3 / 2',
      minWidth: 1600,
      alt: 'The AscendRev operations floor in the Philippines.',
    },
    commitmentsHeading: 'What we are committing to',
    note: '',
    commitments: [
      {
        text: "A workspace AscendRev controls and supervises, so your account is not run from an arrangement we would have to take somebody's word for.",
      },
      {
        text: 'Company issued equipment on every seat. Your customer data will not live on a personal laptop.',
      },
      {
        text: 'Wired connectivity with a second line behind it, and a power arrangement that keeps a shift running through an outage. The provider, the tested runtime and the failover procedure will be published on this page once they are installed and tested, and not before.',
      },
      {
        text: 'Access control on the floor and on your systems, with a record of who opened which account and when, available to you on request.',
      },
      {
        text: 'Staff employed directly by AscendRev under Philippine labour law, with HMO coverage and standard statutory benefits.',
      },
      {
        text: 'You will be told exactly where your team sits and who supervises them before you sign anything, and you are welcome to see it on a video call.',
      },
    ],
  },

  closing: {
    heading: 'Meet the person who will be accountable.',
    body: 'The fifteen minute call is with Rio Vidal. Bring the function you are thinking about moving and what it costs you now, and you will get a straight answer about whether it should move at all.',
    cta: { label: 'Schedule Your Growth Briefing', href: '/contact' },
  },
};
