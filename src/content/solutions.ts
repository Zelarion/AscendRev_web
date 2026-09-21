/**
 * `/solutions` copy. Section order matches SPEC.md §4.2 exactly: hero, service
 * grid, the "No Warm Bodies" hiring block, closing band.
 *
 * The eight function names are the client's own, kept verbatim from the source
 * brief. Their one-line descriptions are rewritten: the source versions carried
 * absolute claims ("Zero missed revenue", "Flawlessly executed") that a company
 * with no delivery history cannot make, and that a sceptical buyer reads as
 * noise. Same functions, same order, claims a supervisor can actually stand
 * behind on a Monday morning.
 */

import type {
  ClosingBandContent,
  Cta,
  PageMeta,
  PendingApproval,
} from './home';

export interface SolutionsHeroContent {
  headline: string;
  subheadline: string;
}

export interface ServiceItem {
  /** Stable key for React, and the grid's stagger order. */
  id: string;
  title: string;
  body: string;
}

export interface ServiceGridContent {
  heading: string;
  intro: string;
  items: readonly ServiceItem[];
}

export interface HiringPoint extends PendingApproval {
  text: string;
}

/** One column of the two-column hiring block. */
export interface HiringColumn extends PendingApproval {
  heading: string;
  items: readonly HiringPoint[];
}

export interface HiringStandardContent {
  heading: string;
  intro: string;
  standard: HiringColumn;
  screening: HiringColumn;
  /** Closing line under both columns. */
  note: string;
  cta: Cta;
}

export interface SolutionsContent {
  meta: PageMeta;
  hero: SolutionsHeroContent;
  services: ServiceGridContent;
  hiring: HiringStandardContent;
  closing: ClosingBandContent;
}

export const solutions: SolutionsContent = {
  meta: {
    title: 'Outsourced Sales, Support and Help Desk Teams',
    description:
      'The eight functions AscendRev staffs from the Philippines: outbound sales, inbound conversion, appointment setting, customer care, help desk, account management, after hours cover and lead data.',
  },

  hero: {
    // Headline pinned by SPEC.md §4.2.
    headline:
      'The Infrastructure Behind Fast-Growing North American Enterprises.',
    subheadline:
      'Eight functions, staffed by people who do this for a career. Each one comes with a written playbook, a named supervisor and reporting you can read in ten minutes on a Monday.',
  },

  services: {
    heading: 'Eight functions, staffed and supervised.',
    intro:
      'You are not buying seats. You are buying a function with someone accountable for it, working to rules you set and reporting you can check.',
    items: [
      {
        id: 'outbound-sales',
        title: 'Outbound Sales and Cold Acquisition',
        body: 'Multichannel campaigns into small, mid market and enterprise accounts: phone first, with email and LinkedIn behind it. Your team works a list you approve, to a script we write with you and revise every two weeks against what is actually landing.',
      },
      {
        id: 'inbound-conversion',
        title: 'Inbound Lead Conversion',
        body: 'Every inbound lead is called back against a response target you set with us, qualified on your criteria, and either booked or disqualified with a reason recorded against it. Marketing spend stops leaking into a queue nobody works.',
      },
      {
        id: 'appointment-setting',
        title: 'High-Yield Appointment Setting',
        body: 'BDR and SDR teams that book qualified meetings into your calendar and log them in Salesforce or HubSpot, so your closers open their diary and find work already in it. A meeting is not counted until it is held.',
      },
      {
        id: 'customer-care',
        title: 'Omnichannel Customer Care',
        body: 'Voice, chat and email handled by the same team, so a customer who switches channel does not start again. Tone, escalation rules and refund limits are yours. We follow them, and we record what we did.',
      },
      {
        id: 'help-desk',
        title: 'Technical Help Desk',
        body: 'Tier one and tier two troubleshooting and application support, working to response targets written into your contract rather than to a best effort promise. Tickets we cannot close reach your engineers with the diagnosis already done.',
      },
      {
        id: 'account-management',
        title: 'Strategic Account Management',
        body: 'Scheduled check ins with your existing customers, usage reviewed before the call, renewals raised before the month they lapse. Cross sell and upsell happen because someone is paying attention, not because a sequence fired.',
      },
      {
        id: 'after-hours',
        title: '24/7/365 After-Hours Coverage',
        body: 'Nights, weekends and statutory holidays covered by a shift that is awake because it is the middle of their working day. Your customers reach a person. Your local team gets its evenings back.',
      },
      {
        id: 'lead-data',
        title: 'Lead Generation and Data',
        body: 'Market mapping, list building and contact verification, plus intent data tracking where you already buy the data. A researcher who checks the number is right before a caller spends an hour proving it is not.',
      },
    ],
  },

  hiring: {
    // Heading verbatim from the client's brief.
    heading: 'We Hire Career Professionals, Not Clock-Punchers.',
    intro:
      'AscendRev is a new company, so the first hires set the standard for everyone who follows them. That standard is written down here rather than described in adjectives, because a standard you can read is a standard you can hold us to.',
    standard: {
      heading: 'What we hire for',
      items: [
        {
          text: 'Degree educated, most often in communication, business or economics.',
          pendingApproval: true,
          pendingReason:
            'SPEC.md §7 item 4 and the no-invented-facts rule. The source brief claims "academic backgrounds in English Communication and Economics" for staff who have not been hired yet. AscendRev must confirm this is the hiring bar it will actually apply before the site states it as a fact about its people.',
        },
        {
          text: 'English that holds up on a live call with a frustrated customer, not only on paper.',
        },
        {
          text: 'Prior experience in the function itself, rather than a general contact centre background stretched to fit your account.',
        },
        {
          text: 'A named supervisor on your account from the first day, who joins your calls and is copied on your reporting.',
        },
        {
          text: 'Direct employment with AscendRev under Philippine labour law, with HMO coverage. People who are looked after stay, and the person who already knows your account is the one worth keeping.',
        },
      ],
    },
    screening: {
      // SPEC.md §7 item 6. The source brief said "rigorous psychological
      // resilience evaluations", which raises Data Privacy Act questions in the
      // Philippines and reads badly to a Canadian buyer wondering what is being
      // done to the people serving their account. Rewritten below as the
      // screening a contact centre role actually needs, written out in full so
      // AscendRev can confirm or correct it in one pass rather than in six.
      heading: 'How we screen',
      pendingApproval: true,
      pendingReason:
        "SPEC.md §7 item 6. Zelarion cannot verify AscendRev's actual hiring process. These five steps are the proposed replacement for \"psychological resilience evaluations\" and need written confirmation, or correction, from AscendRev before publication.",
      items: [
        {
          text: 'A structured interview with the supervisor who will run your account, not a recruiter reading from a form.',
        },
        {
          text: 'A live call assessment. The job happens on the phone, so the assessment happens on the phone.',
        },
        {
          text: 'A recorded role play of a difficult call, scored on whether the candidate stays calm and keeps control of the conversation. That is the part of this work that wears people down, and it is better to find out in an interview than in month three.',
        },
        {
          text: 'Reference checks with named former supervisors, contacted directly.',
        },
        {
          text: 'NBI clearance and employment history verification before a start date is confirmed.',
        },
      ],
    },
    note: 'You interview the shortlist yourself if you want to, and nobody joins your account over your objection.',
    cta: { label: 'Request Outsourcing Blueprint', href: '/contact' },
  },

  closing: {
    heading: 'Not sure which function to move first?',
    body: 'Most companies pick the one that hurts most and get it wrong. Bring the whole picture to a fifteen minute call and you will get a view on which function actually moves offshore well, which one should stay where it is, and why.',
    cta: { label: 'Schedule Your Growth Briefing', href: '/contact' },
  },
};
