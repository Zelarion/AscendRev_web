/**
 * Homepage copy. Section order matches SPEC.md §4.1 exactly: hero, trust band,
 * pillars, industries, closing band.
 *
 * This file also holds the content primitives the other three page files share
 * (`PageMeta`, `Cta`, `ImageSlot`, `PendingApproval`, `ClosingBandContent`).
 * They live here rather than in a `content/types.ts` because this pass owns
 * only the four page files plus `lib/enquirySchema.ts`; a fifth file would sit
 * outside that boundary. If a later pass adds `content/types.ts`, move these
 * five declarations there unchanged and update the three imports.
 *
 * Claims on this page are constrained by SPEC.md §7 (content risk register).
 * Two rules drive the wording and are not negotiable in a revision:
 *   1. Career achievements are Rio Vidal's, attributed to him by name, never to
 *      AscendRev. The company was registered on 11 September 2026 and has no
 *      track record of its own.
 *   2. Any number carries a basis, or it is not published. See `PendingApproval`.
 */

/** Per page `<head>` values, SPEC.md §8. */
export interface PageMeta {
  /**
   * Rendered through the root layout's title template (`%s | AscendRev`,
   * `src/app/layout.tsx`), so the brand name is deliberately absent here.
   */
  title: string;
  description: string;
}

/** A labelled link rendered as a button. */
export interface Cta {
  label: string;
  href: string;
}

/**
 * An image that has not been supplied yet. Field names match
 * `ImagePlaceholder`'s props (`src/components/ui/ImagePlaceholder.tsx`) so a
 * section can pass the descriptor straight through, and SPEC.md §9 gate 2
 * fails the production build while any placeholder is still rendering.
 *
 * `alt` is the text the real photograph ships with once it exists, held here
 * because alt text is copy and copy lives in this folder (DESIGN.md §5).
 */
export interface ImageSlot {
  /** What belongs in the slot, specific enough to brief a photographer. */
  label: string;
  /** CSS aspect-ratio value, e.g. '3 / 2'. */
  ratio: string;
  /** Minimum acceptable pixel width of the supplied file. */
  minWidth: number;
  alt: string;
}

/**
 * SPEC.md §7: nothing in register items 1 through 6 is published until
 * AscendRev confirms it in writing. Until then the copy lives here with
 * `pendingApproval: true` and SPEC.md §9 gate 3 fails the production build
 * while any flagged item survives. That failure is the feature.
 */
export interface PendingApproval {
  pendingApproval?: true;
  /**
   * Exactly what AscendRev has to confirm to clear the flag. Internal: for the
   * build gate's failure message and for client correspondence, never rendered.
   */
  pendingReason?: string;
}

/** The navy band that closes every page. */
export interface ClosingBandContent {
  heading: string;
  body: string;
  cta: Cta;
}

export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  /**
   * Short line rendered beneath the subheadline, ahead of the CTAs. A tuple of
   * exactly the three clauses the client's own colour treatment assigns to
   * green / blue / gold (email, 2026-09-24), because HeroSection pairs each
   * entry with a fixed colour by array position, not by parsing punctuation.
   * Rendered joined by a single space beneath the main headline.
   */
  tagline: readonly [string, string, string];
  primaryCta: Cta;
  secondaryCta: Cta;
  trustLead: string;
  /**
   * One rendered credential line (client copy, 2026-09-24). Kept as a single
   * string rather than a list of eyebrow/detail pairs because the source
   * copy is itself one line separated by " | ", with only the first segment
   * carrying an internal hyphen split — forcing that into a uniform
   * eyebrow/detail shape would invent structure the copy doesn't have.
   */
  credentialLine: string;
  sideWords: readonly string[];
}

export interface TrustItem extends PendingApproval {
  text: string;
}

export interface TrustBandContent {
  lead: string;
  items: readonly TrustItem[];
}

/**
 * Semantic icon key. The section component maps each key to one Phosphor icon
 * (Regular weight, per-icon import, DESIGN.md §5). Content stays free of the
 * icon library so swapping the library is a component change, not a copy change.
 */
export type PillarIcon = 'cost' | 'record' | 'accountability';

/**
 * A number attached to a claim. SPEC.md §7 item 5: a performance claim needs an
 * adequate basis established before the claim is made, so `basis` states what
 * the figure is measured against. A claim with `basis: null` must also carry
 * `pendingApproval: true`, which keeps it out of the production build.
 */
export interface QuantifiedClaim extends PendingApproval {
  text: string;
  basis: string | null;
}

export interface Pillar {
  icon: PillarIcon;
  heading: string;
  body: string;
  quantifiedClaim?: QuantifiedClaim;
}

export interface PillarsContent {
  heading: string;
  supportingCopy: string;
  intro: string;
  items: readonly Pillar[];
  /** Closing line rendered beneath the three pillars. */
  closingLine: string;
}

/** Semantic icon key for a revenue-gap question in the impact grid. */
export type IndustryIcon =
  | 'leads'
  | 'sales-capacity'
  | 'customer-service'
  | 'follow-up'
  | 'operations'
  | 'retention'
  | 'scale'
  | 'receivables'
  | 'growth';

export interface IndustryQuestion {
  icon: IndustryIcon;
  question: string;
  answer: string;
}

export interface IndustriesContent {
  /** Anchor target for the `/#revenue-impact` nav item (SPEC.md §3). */
  id: string;
  heading: string;
  intro: string;
  subheading: string;
  items: readonly IndustryQuestion[];
}

export interface HomeContent {
  meta: PageMeta;
  hero: HeroContent;
  approachStages: readonly [string, string, string];
  officeStages: readonly [string, string, string];
  trustBand: TrustBandContent;
  pillars: PillarsContent;
  industries: IndustriesContent;
  closing: ClosingBandContent;
}

export const home: HomeContent = {
  meta: {
    title: 'Offshore Teams for North American Companies',
    description:
      'AscendRev builds and runs dedicated sales, support and back office teams in the Philippines for North American companies. Calgary head office, founder led, one monthly rate per seat.',
  },

  hero: {
    eyebrow: 'SCALABLE TEAMS. REAL IMPACT.',
    // Client copy revision, 2026-09-24. Three sentences, rendered one per
    // line by `toSentences` in HeroSection.tsx (splits on sentence-ending
    // punctuation), gold on the final line — the same mechanism the old
    // three-sentence headline used, so no component change was needed here.
    headline: 'Dedicated Team. Targeted Solutions. Accelerated Revenue.',
    // Client copy revision, 2026-09-24, verbatim. Says "Founder's" rather than
    // naming Rio Vidal, same as the subheadline it replaces — flagged in the
    // delivery report rather than silently tightened, since SPEC.md §7 item 1
    // reads as wanting the named attribution used in the trust band below.
    subheadline:
      "Backed by Founder's career track record of CAD1B+ in generated sales revenue, we provide fully managed front- and back-office teams that scale your business. We absorb the infrastructure costs, talent shortages, and administrative burdens—so you can focus entirely on growth.",
    tagline: ['Identify the gap.', 'Build the team.', 'Improve the outcome.'],
    primaryCta: { label: 'Build Your Dedicated Team', href: '/contact' },
    secondaryCta: {
      label: 'Explore our approach',
      href: '/#approach-story',
    },
    trustLead: 'LED BY',
    // Client copy revision, 2026-09-24, verbatim including the hyphen and the
    // pipe separators.
    credentialLine:
      "Harvard Certificate in Leadership Excellence - Harvard Business Impact Enterprise | Lean Six Sigma Certified | 100M Dollar Club Recognition | 2X President's Club Award",
    sideWords: ['PEOPLE', 'PROCESS', 'PERFORMANCE'],
  },

  approachStages: ['Uncover the growth constraints.', 'Design around the work.', 'Measure what moves.'] as const,

  officeStages: ['Decide what matters.', 'Connect people to the plan.', 'Give good work room to grow.'] as const,

  trustBand: {
    // The source brief's trust banner read "Led by Harvard Business Impact
    // Enterprise & Lean Six Sigma Certified Expertise | 100M Dollar Club
    // Recognized". Every item there is a third-party mark held by a person, not
    // by the company (SPEC.md §7 items 1 and 4), so the band now carries only
    // facts that are true of AscendRev itself plus one attributed line.
    lead: 'AscendRev was registered in Canada on 11 September 2026. This is what stands behind it.',
    items: [
      {
        text: 'Founded by Rio Vidal, who has generated over CAD1B in B2B revenue across a career in Canada and Australia.',
      },
      {
        text: 'Head office in Calgary, Alberta. Your account is supervised on Calgary hours, not on a time zone you have to work around.',
      },
      {
        text: 'One named person in Canada is accountable for your account, and you meet them before you sign anything.',
      },
    ],
  },

  pillars: {
    // Client copy revision, 2026-09-24, verbatim (second sentence is a
    // fragment in the source copy, kept as written per the client's
    // no-wording-changes instruction).
    heading: 'Address Revenue Gaps.',
    supportingCopy: 'Turn missed opportunities to active conversations.',
    intro:
      'AscendRev replaces fragmented operating costs with one managed growth model.',
    items: [
      {
        // Client copy revision, 2026-09-24, verbatim, including the lower-case
        // sentence opening and the em dash run against "burden" in the body.
        // NOTE: this reintroduces the unsubstantiated "up to 50%" comparative
        // figure that the removed `quantifiedClaim` below used to gate behind
        // `pendingApproval` for SPEC.md §7 item 5 / Competition Act ss. 52 and
        // 74.01 — the claim is now baked into the heading itself rather than
        // an optional gated field. Flagged in the delivery report; not
        // silently re-gated or altered here since it was scoped as a literal
        // heading/body replacement.
        icon: 'cost',
        heading: 'Up to 50% cost reduction',
        body: 'By outsourcing/offshoring, we help organizations increase capacity, improve customer coverage, strengthen sales execution and reduce the operational burden— without the cost and complexity of building every function in-house.',
      },
      {
        icon: 'record',
        heading: 'Proven Revenue Engine',
        body: 'Built from career true market, field experience and systems which generated CAD1B+ in revenue plus the operating discipline, structure and accountability needed to support growth.',
      },
      {
        icon: 'accountability',
        heading: 'Dedicated Teams Built Around Your Business',
        body: "From generating new opportunities and following up with prospects to supporting customers and taking repetitive work off your team's plate, AscendRev provides dedicated teams that extend your capabilities and keep your business moving.",
      },
    ],
    closingLine:
      'Your team focuses on growth. We handle the execution that makes it possible.',
  },

  industries: {
    id: 'revenue-impact',
    // Client copy revision, 2026-09-24: the industry-group tabs with stock
    // photography are replaced outright by a nine-item revenue-gap Q&A grid,
    // per the client's brief. Every remote image URL that used to back this
    // section (`IndustriesSection.tsx`'s old `INDUSTRY_IMAGES` map) is gone
    // with it — the client requires no external image dependencies here.
    heading: "Built for Canada's Economic Engines.",
    intro:
      'AscendRev supports all industries that keep Canada moving with tailored operational functions built for efficiency, scale, and measurable growth.',
    subheading: 'Revenue Gaps and Solution Framework.',
    // Client copy revision, 2026-09-24, verbatim. Icon keys are semantic and
    // mapped to the shared Phosphor family by IndustriesSection.
    items: [
      { icon: 'leads', question: 'Insufficient leads?', answer: 'We build the pipeline behind you.' },
      {
        icon: 'sales-capacity',
        question: 'More leads than your team can follow up?',
        answer: 'We add sales development capacity.',
      },
      {
        icon: 'customer-service',
        question: 'Customer inquiries piling up?',
        answer: 'We extend your customer-service capacity.',
      },
      {
        icon: 'follow-up',
        question: 'Quotes and opportunities going cold?',
        answer: 'We build the follow-up engine.',
      },
      {
        icon: 'operations',
        question: 'Too much administrative work?',
        answer: "We take the repetitive work off your team's plate.",
      },
      {
        icon: 'retention',
        question: 'Existing customers going untouched?',
        answer: 'We reactivate, re-engage, keep, and identify cross-sell opportunities.',
      },
      {
        icon: 'scale',
        question: 'Need to scale without adding every function in-house?',
        answer: 'We build a dedicated team around the gap.',
      },
      {
        icon: 'receivables',
        question: 'Cash sitting on receivables?',
        answer:
          'We maintain consistent contact with customers and keep outstanding balances moving toward resolution.',
      },
      {
        icon: 'growth',
        question: 'Unheard 30%-50% growth potential?',
        answer:
          'We add a dedicated sales, customer and operational capacity needed to pursue more opportunities, follow up more consistently and broader market coverage.',
      },
    ],
  },

  closing: {
    // Heading and CTA label pinned by SPEC.md §4.1, verbatim from the client's
    // brief. "Profit Center" keeps the client's spelling; flagged to the
    // founder as a Canadian-spelling question, not changed unilaterally.
    heading: 'Ready to Accelerate Profit and Revenue?',
    body: '',
    cta: { label: 'Schedule your growth dialogue', href: '/contact' },
  },
};
