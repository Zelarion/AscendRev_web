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

export interface LeadershipContent {
  /** Anchor target: the nav resolves Leadership to `#leadership` on this page (SPEC.md §3). */
  id: string;
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
  attribution: string;
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
    title: 'Who Runs AscendRev, and What Exists Today',
    description:
      "Rio Vidal's career record, what stands behind AscendRev, and what the Philippine operation actually is right now. Registered in Canada on 11 September 2026.",
  },

  hero: {
    headline: 'Who You Are Actually Dealing With.',
    subheadline:
      'AscendRev is a young company with an experienced founder. Both of those facts matter to you, so both of them are on this page, in that order.',
  },

  leadership: {
    id: 'leadership',
    // Heading verbatim from the client's brief.
    heading: 'Engineered by a Proven Player-Coach.',
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
    narrative: [
      'Rio Vidal spent his career in B2B sales across Canada and Australia, carrying a quota himself long before he managed anyone else who carried one. He founded AscendRev because he kept meeting companies that needed five more people in a seat they could not justify filling locally, and had nobody credible to call.',
      'He runs the Canadian side of every account personally. The scripts your team reads, the way a call gets escalated, and the standard a conversation is judged against are his, and he keeps reviewing them once your team is live rather than handing them over at launch.',
      'The record below is his, earned before AscendRev existed. The company itself was registered on 11 September 2026 and has no track record of its own yet. You would rather hear that from us now than work it out later, and we would rather be the ones who said it.',
    ],
    // The client's own line, from the source brief, quoted as written.
    commitment:
      'Every script, workflow and playbook deployed in the Philippines is built and calibrated under direct onshore supervision.',
    recordHeading: 'Career record',
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
    credentials: [
      {
        name: '100M Dollar Club',
        issuer: 'American Express',
        awarded: null,
      },
      {
        name: "President's Award",
        issuer: null,
        awarded: null,
        note: 'Awarded twice.',
        pendingApproval: true,
        pendingReason:
          "SPEC.md §7 item 4. The awarding organisation is not named anywhere in the client's brief. An award named without its issuer cannot be checked by a buyer and reads as filler. AscendRev must supply who granted it and in which years before it is published.",
      },
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
    attribution:
      "These are Rio Vidal's personal achievements, earned across his career before AscendRev was founded. They are not claims about the company.",
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
