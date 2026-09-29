/**
 * Homepage copy. Revenue-gap questions now live on the Solutions page, while
 * the homepage focuses on the hero, proof, pillars and operating model.
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
   * Three short clauses presented together on a centered line in the hero.
   * HeroSection pairs each entry with a fixed colour by array position.
   */
  tagline: readonly [string, string, string];
  primaryCta: Cta;
  trustLead: string;
  /**
   * One rendered credential line (client copy, 2026-09-24). Kept as a single
   * string rather than a list of eyebrow/detail pairs because the source
   * copy is itself one line separated by " | ", with only the first segment
   * carrying an internal hyphen split — forcing that into a uniform
   * eyebrow/detail shape would invent structure the copy doesn't have.
   */
  credentialLine: string;
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
  image?: {
    src: string;
    alt: string;
  };
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
  /** Anchor target for the Revenue Impact section on `/solutions/`. */
  id: string;
  heading: string;
  intro: string;
  subheading: string;
  items: readonly IndustryQuestion[];
}

export interface HomeContent {
  meta: PageMeta;
  hero: HeroContent;
  trustBand: TrustBandContent;
  pillars: PillarsContent;
  revenueImpact: IndustriesContent;
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
    // Client copy revision supplied for Wave 1A. Sentences render one per line
    // through `toSentences` in HeroSection.tsx.
    headline: 'Dedicated Team. Targeted Solutions. Accelerated Revenue.',
    subheadline:
      'Built on decades of frontline sales and revenue leadership, AscendRev provides fully managed teams that extend your sales, customer experience and operational capabilities. We take on the talent, infrastructure and execution—so your team can stay focused on growth.',
    tagline: ['People.', 'Process.', 'Performance.'],
    primaryCta: { label: 'Build Your Dedicated Team', href: '/contact' },
    trustLead: 'LED BY EXPERIENCED REVENUE LEADERSHIP',
    // Preserve the credential wording currently published on the live site.
    credentialLine:
      "Harvard Certificate in Leadership Excellence - Harvard Business Impact Enterprise | Lean Six Sigma Certified | 100M Dollar Club Recognition | 2X President's Club Award",
  },

  trustBand: {
    // The source brief's trust banner read "Led by Harvard Business Impact
    // Enterprise & Lean Six Sigma Certified Expertise | 100M Dollar Club
    // Recognized". Every item there is a third-party mark held by a person, not
    // by the company (SPEC.md §7 items 1 and 4), so the band now carries only
    // facts that are true of AscendRev itself plus one attributed line.
    lead: 'AscendRev was registered in Canada on 11 September 2026. This is what stands behind it.',
    items: [
      {
        text: 'Founded by Rio Vidal, who has generated more than CAD $1B in B2B revenue over his career in Canada and Australia.',
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
    heading: 'Address Revenue Gaps.',
    supportingCopy: 'Turn missed opportunities to active conversations.',
    intro:
      'AscendRev gives you the dedicated capacity to pursue more opportunities, serve more customers and execute more consistently—without building every function in-house.',
    items: [
      {
        icon: 'cost',
        heading: 'Up to 50% Lower Operating Costs',
        body: 'By outsourcing/offshoring, we help organizations increase capacity, improve customer coverage, strengthen sales execution and reduce the operational burden— without the cost and complexity of building every function in-house.',
      },
      {
        icon: 'record',
        heading: 'Proven Revenue Engine',
        body: 'Built on real-world market experience, frontline sales leadership, and proven systems, AscendRev brings a disciplined, structured, and accountable approach to every engagement—backed by more than CAD $1B in generated sales revenue.',
        image: {
          src: '/images/ascendrev-sales-dashboard-team.png',
          alt: 'A sales team reviewing performance metrics together around a conference table.',
        },
      },
      {
        icon: 'accountability',
        heading: 'Dedicated Teams Built Around Your Business.',
        body: 'From generating new opportunities and following up with prospects to supporting customers and managing repetitive work, AscendRev builds dedicated teams around the gaps in your business.',
      },
    ],
    closingLine:
      'Your team focuses on growth. We handle the execution that makes it possible.',
  },

  revenueImpact: {
    id: 'revenue-impact',
    heading: 'Built for North American Business.',
    intro:
      'AscendRev supports businesses across industries with dedicated teams designed around efficiency, scale and measurable growth.',
    subheading: 'WHERE YOUR BUSINESS NEEDS MORE CAPACITY',
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
        question: 'Untapped Growth Potential?',
        answer:
          'We add the sales, customer and operational capacity needed to pursue more opportunities, follow up consistently and expand market coverage.',
      },
    ],
  },

  closing: {
    heading: 'Ready to Build Your Revenue Engine?',
    body: '',
    cta: { label: 'Schedule your growth dialogue', href: '/contact' },
  },
};
