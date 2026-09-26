/**
 * `/solutions` copy. Section order matches SPEC.md §4.2: hero, service grid,
 * the "Team" block, the screening block, closing band.
 *
 * 2026-09-24 client revision: the client asked for the nine function entries
 * and the six screening steps to carry an icon and a label only, no
 * descriptive paragraph, and gave every string below verbatim ("Please do not
 * change the wording, if possible"). Copy is implemented as supplied,
 * including wording that does not match elsewhere on this page (see the
 * inline notes below) — those mismatches are flagged back to the client
 * rather than silently corrected.
 */

import type { Cta, PageMeta } from './home';

export interface SolutionsHeroContent {
  headline: string;
  subheadline: string;
}

/** An icon-plus-label entry: the nine services and the six screening steps
 * share this exact shape, so one type serves both. */
export interface IconLabelItem {
  /** Stable key for React, and the grid's stagger order. */
  id: string;
  /** Literal glyph character(s) rendered inside the icon container. */
  glyph: string;
  label: string;
}

export interface ServiceGridContent {
  heading: string;
  intro: string;
  items: readonly IconLabelItem[];
}

export interface TeamCapabilityContent {
  heading: string;
  items: readonly string[];
}

export interface ScreeningContent {
  heading: string;
  items: readonly IconLabelItem[];
}

export interface HiringStandardContent {
  heading: string;
  capability: TeamCapabilityContent;
}

export interface SolutionsContent {
  meta: PageMeta;
  hero: SolutionsHeroContent;
  services: ServiceGridContent;
  hiring: HiringStandardContent;
  screening: ScreeningContent;
  closing: {
    heading: string;
    cta: Cta;
  };
}

export const solutions: SolutionsContent = {
  meta: {
    title: 'Outsourced Sales, Support and Help Desk Teams',
    description:
      'The nine functions AscendRev staffs from the Philippines: outbound sales, inbound conversion, appointment setting, customer care, help desk, account management, after hours cover, lead data and collections.',
  },

  hero: {
    // Client revision, 2026-09-24: exact replacement text, no trailing period
    // given.
    headline: 'The Core Behind Revenue Acceleration',
    // rather than rewritten on our own judgment.
    subheadline:
      'Capabilities and scope of expertise with dedicated support team for execution',
  },

  services: {
    // rewritten on our own judgment.
    heading: 'Extend Capability. Accelerate Growth',
    // Client revision, 2026-09-24: exact replacement text.
    intro:
      'Core aspects where we do well. Your partnership investment is backed by premium talents where ownership, discipline, performance consistency, and winning are the way of life.',
    // Client revision, 2026-09-24: descriptions removed, icon + label only.
    // Order, glyphs and labels are the client's own, verbatim.
    items: [
      { id: 'lead-generation-data', glyph: '◈', label: 'Lead Generation & Data' },
      { id: 'outbound-sales', glyph: '↗', label: 'Outbound Sales & Cold Acquisition' },
      { id: 'inbound-conversion', glyph: '◉', label: 'Inbound Lead Conversion' },
      { id: 'appointment-setting', glyph: '◫', label: 'High-Yield Appointment Setting' },
      { id: 'customer-care', glyph: '◎', label: 'Omnichannel Customer Care' },
      { id: 'help-desk', glyph: '⌁', label: 'Technical Help Desk' },
      {
        id: 'account-management',
        glyph: '◇',
        label: 'Strategic Account Management & Reactivation',
      },
      { id: 'after-hours', glyph: '∞', label: '24/7/365 After-Hours Coverage' },
      { id: 'receivables-collections', glyph: '$', label: 'Accounts Receivable & Collections' },
    ],
  },

  hiring: {
    // Client revision, 2026-09-24: exact replacement heading.
    heading: 'We employ Premium and Experienced Career Professionals, Not Clock-Punchers.',
    // Client revision, 2026-09-24: the prior intro paragraph ("AscendRev is a
    // new company, so the first hires set the standard...") is deleted per
    // the client's instruction, not replaced. This block is now heading +
    // labels only, matching the rest of this revision.
    capability: {
      heading: 'Team Capability',
      items: [
        'Years of relevant industry experience',
        'Formal and relevant education',
        'Operational Discipline',
        'Dedicated Execution',
      ],
    },
  },

  screening: {
    // Client revision, 2026-09-24: new section, split out from the old
    // combined hiring/screening block so it carries its own heading, per the
    // client's brief.
    heading: 'How we screen our Team members',
    items: [
      { id: 'resume-screening', glyph: '▤✓', label: 'Resume Screening' },
      { id: 'phone-interview', glyph: '☎◉', label: 'Phone Interview' },
      { id: 'face-to-face-screening', glyph: '◉◉', label: 'Face-to-Face Screening' },
      { id: 'skills-technical-assessment', glyph: '◇✓', label: 'Skills & Technical Assessment' },
      { id: 'client-partner-final-interview', glyph: '◉◆', label: 'Client / Partner Final Interview' },
      { id: 'background-check-clearance', glyph: '⛨✓', label: 'Background Check & Clearance' },
    ],
  },

  closing: {
    heading: 'Unsure which ones are a good fit?',
    cta: { label: 'Request Outsourcing Blueprint', href: '/contact' },
  },
};
