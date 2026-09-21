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
  headline: string;
  subheadline: string;
  primaryCta: Cta;
  secondaryCta: Cta;
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
  intro: string;
  items: readonly Pillar[];
}

export interface IndustryGroup {
  /** Tab id, also the panel's `aria-controls` target. */
  id: string;
  label: string;
  body: string;
  /** The client's own sector list for this group, from the source brief. */
  sectors: readonly string[];
  /** The functions AscendRev staffs in this group. */
  functions: readonly string[];
}

export interface IndustriesContent {
  /** Anchor target for the `/#industries` nav item (SPEC.md §3). */
  id: string;
  heading: string;
  intro: string;
  groups: readonly IndustryGroup[];
}

export interface HomeContent {
  meta: PageMeta;
  hero: HeroContent;
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
    // Headline pinned by SPEC.md §4.1 and matches `site.tagline`.
    headline: 'Lower Costs. Higher Efficiencies. Accelerate Revenue.',
    // Rewritten per SPEC.md §7 item 1. The source brief opened with "Backed by
    // a track record of generating over CAD$1B+ in market revenue, we provide",
    // which attributes a career to a company registered on 11 September 2026.
    subheadline:
      'AscendRev builds and runs dedicated sales, support and back office teams in the Philippines for North American companies. You get the people, the supervision and the reporting. You do not get the payroll taxes, the seat licences, the recruiting cycle or the lease.',
    primaryCta: { label: 'Build Your Dedicated Team', href: '/contact' },
    secondaryCta: {
      // The query param preselects the cost-analysis intent on the enquiry form
      // (SPEC.md §4.1). The value is read by the contact page; see
      // `src/content/contact.ts`.
      label: 'Run a Cost-Savings Analysis',
      href: '/contact?intent=cost-analysis',
    },
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
        text: 'Founded by Rio Vidal, who has generated over CAD$1B in B2B revenue across a career in Canada and Australia.',
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
    // Heading pinned by SPEC.md §4.1.
    heading: 'Stop Burning Capital on Local Turnover.',
    intro:
      'A front office seat that turns over twice a year costs far more than the salary line suggests. There is the vacancy, the recruiter, the ramp, and the customer who did not get called back while the seat was empty.',
    items: [
      {
        icon: 'cost',
        heading: 'One rate, not nine cost lines.',
        body: 'A local hire costs you salary, payroll taxes, benefits, software seats, recruiting fees, equipment and floor space. An AscendRev seat is one monthly rate that covers all of it. When the work changes the rate changes, and there is no severance conversation.',
        quantifiedClaim: {
          // SPEC.md §7 item 5. The source brief said "Slash budgets by 30%-50%"
          // with nothing behind it. The sentence below is written and ready;
          // it publishes the moment AscendRev supplies the comparison the
          // figure rests on, and `basis` is where that goes.
          text: 'Moving a front office or back office function to AscendRev typically reduces the fully loaded cost of that function by 30% to 50%.',
          basis: null,
          pendingApproval: true,
          pendingReason:
            'SPEC.md §7 item 5. AscendRev must supply the comparison the 30% to 50% range is measured against (for example fully loaded local salary, benefits and overhead at a stated headcount and role), and the working behind it, before a comparative performance claim can be published under Competition Act ss. 52 and 74.01.',
        },
      },
      {
        icon: 'record',
        heading: 'Built by someone who has carried the number.',
        body: 'Rio Vidal has closed deals from CAD$500,000 to CAD$35,000,000 across Canada and Australia, and generated over CAD$1B in B2B revenue over his career. The call structure, the objection handling and the escalation paths your team works to are written and reviewed by him.',
      },
      {
        icon: 'accountability',
        heading: 'The employment risk is ours.',
        body: 'AscendRev employs the team in the Philippines, supervises it, and carries the attrition. You approve who joins your account and you tell us what good looks like. Everything underneath that is our problem, not a line item you inherit.',
      },
    ],
  },

  industries: {
    id: 'industries',
    // Heading pinned by SPEC.md §4.1. The five groups and their sector lists
    // are the client's own, from the source brief.
    heading: "Built for Canada's Economic Engines.",
    intro:
      'These are the sectors AscendRev is set up to serve. If yours is not listed the functions are the same, and fifteen minutes will tell us both whether it fits.',
    groups: [
      {
        id: 'fintech',
        label: 'Fintech and SaaS',
        body: 'Finance teams lose their evenings to chasing payables and receivables, and support queues spike the week after every release. We staff the collections calls, the reconciliation work inside your ERP and tier one support, so your engineers stop answering tickets.',
        sectors: ['Fintech', 'SaaS', 'Payments', 'Financial services'],
        functions: [
          'Accounts payable and receivable',
          'ERP data entry and reconciliation',
          'Tier one product support',
          'Onboarding and implementation follow up',
        ],
      },
      {
        id: 'energy',
        label: 'Energy and Industrial',
        body: 'Field operations generate paperwork faster than an office can absorb it: purchase orders, dispatch confirmations, rental agreements, supplier follow up. None of that work needs to sit in your building, and most of it does not need to sit in your time zone.',
        sectors: ['Oil and gas', 'Utilities', 'Supply chain', 'Equipment rental'],
        functions: [
          'Purchase order and invoice processing',
          'Dispatch and scheduling support',
          'Supplier and vendor follow up',
          'Equipment rental administration',
        ],
      },
      {
        id: 'construction',
        label: 'Construction and Trades',
        body: 'Estimators spend their day chasing permits, suppliers and unanswered quotes instead of pricing work. We take the chasing and the quote follow up, and we answer the after hours calls, so a burst pipe at 2am reaches a person rather than a voicemail box.',
        sectors: [
          'Residential and commercial developers',
          'Earthworks',
          'HVAC',
          'Electrical',
          'Roofing and siding',
          'Drywall',
        ],
        functions: [
          'Quote follow up and booking',
          'Permit and document chasing',
          'Supplier coordination',
          'After hours emergency intake',
        ],
      },
      {
        id: 'retail',
        label: 'Retail and Professional Services',
        body: 'Booking, rebooking, chasing documents and answering the same twenty questions all day. This is high volume work with clear rules, which is exactly the work a trained and supervised team absorbs well, and exactly the work that burns out a local hire you cannot afford to lose.',
        sectors: [
          'E-commerce',
          'Advertising',
          'Medical groups',
          'Real estate',
          'Mortgage providers',
          'Wholesalers',
          'Automotive',
        ],
        functions: [
          'Inbound enquiry handling',
          'Appointment booking and reminders',
          'Document collection and chasing',
          'Order and returns processing',
        ],
      },
      {
        id: 'transport',
        label: 'Transport, Travel and Telecom',
        body: 'Coverage is the whole job. Freight moves overnight, flights do not wait, and an outage does not book itself into business hours. A team fourteen hours ahead of Calgary is awake for all of it because it is the middle of their working day.',
        sectors: [
          'Aviation',
          'Travel and hospitality',
          'Telecommunications',
          'Transportation',
          'Freight and logistics',
        ],
        functions: [
          'Overnight dispatch and tracking',
          'Booking changes and disruption handling',
          'Tier one technical support',
          '24/7/365 escalation cover',
        ],
      },
    ],
  },

  closing: {
    // Heading and CTA label pinned by SPEC.md §4.1, verbatim from the client's
    // brief. "Profit Center" keeps the client's spelling; flagged to the
    // founder as a Canadian-spelling question, not changed unilaterally.
    heading: 'Ready to Turn Operations Into a Profit Center?',
    body: 'Book fifteen minutes with Rio Vidal. You get a straight read on whether the function you have in mind can be run offshore at all, and a written comparison of what it costs you now against what it would cost with us.',
    cta: { label: 'Schedule Your Growth Briefing', href: '/contact' },
  },
};
