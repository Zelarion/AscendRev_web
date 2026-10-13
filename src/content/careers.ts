/**
 * `/careers/`, `/careers/<role>/` and `/careers/<role>/apply/` copy.
 *
 * Rio Vidal's exact content, sent by email on 11 October 2026 ("Career Section
 * in our website"), with the instruction "No other details / content." The page
 * lines, the questions and the thank-you message are his wording; each posting
 * is his job description document word for word ("Web Career_ Outbound Sales
 * Representative.docx", 11 Oct; "Customer Service Representative.docx", 13 Oct). Do not add copy here without his approval
 * (CONTENT-CHANGE-BLOCKER.md).
 *
 * `src/lib/careersSchema.ts` validates the form and `public/api/careers.php`
 * re-validates the same rules. Role slugs and answer values are a contract with
 * that handler: renaming one here without the other rejects every application.
 */

import type { PageMeta } from './home';

export type RoleSlug = 'outbound-sales-representative' | 'customer-service-representative';

export interface RoleSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Paragraphs after the bullets, where the document has them. */
  closing?: string[];
}

export interface CareerRole {
  slug: RoleSlug;
  title: string;
  /** The posting's own one-line facts, as written in the document. */
  location: string;
  employmentType: string;
  experience: string;
  /** schema.org employmentType values for Google for Jobs. */
  schemaEmploymentType: ('FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY')[];
  /** ISO date the role was published. */
  datePosted: string;
  /** The card's one-line description: his opening line of About the Role, as edited on 11 Oct 2026. */
  summary: string;
  sections: RoleSection[];
  /** False hides the role everywhere without deleting its copy. */
  open: boolean;
}

export type YearsValue = 'none' | 'lt1' | '1to2' | '3to5' | '5plus';

export interface ChoiceOption<Value extends string> {
  value: Value;
  label: string;
}

/** Address for the structured data only; the visible location line is the posting's own. */
export const workLocation = {
  street: 'Alabang Town Centre, Ayala Alabang',
  locality: 'Muntinlupa',
  region: 'Metro Manila',
  country: 'PH',
} as const;

export const careersMeta: PageMeta = {
  title: 'Careers',
  description: 'Join our team, grow your career, and build your future with us.',
};

export const careersPage = {
  heading: 'Careers',
  description: 'Join our team, grow your career, and build your future with us.',
  postingsHeading: 'Ready to grow with us?',
} as const;

/**
 * Rio's edits of 11 October 2026: the role is titled in the plural and his opening line is
 * plural too. Both are defined once so the card, the posting page, the apply screen, the page
 * title, the structured data and llms.txt cannot drift apart. The URL slug stays singular: it is
 * a contract with public/api/careers.php.
 */
const outboundTitle = 'Outbound Sales Representatives';
const outboundOpeningLine =
  'We are looking for high-performing Outbound Sales Representatives who know how to create opportunities, build relationships and move prospects toward a sale.';

/**
 * Second posting (Rio, 13 October 2026), titled in the plural like the first and listed
 * under it. Its card line is the opening sentence of his About the Role.
 */
const customerServiceTitle = 'Customer Service Representatives';
const customerServiceOpeningLine =
  'AscendRev is looking for proactive, customer-focused Customer Service Representatives to help build and shape our customer service operations.';

export const careerRoles: CareerRole[] = [
  {
    slug: 'outbound-sales-representative',
    title: outboundTitle,
    location: 'Onsite | Ayala Alabang Town Centre',
    employmentType: 'Contract | Full time',
    experience: '3+ years of Outbound B2B sales experience',
    schemaEmploymentType: ['FULL_TIME', 'CONTRACTOR'],
    datePosted: '2026-10-11',
    summary: outboundOpeningLine,
    sections: [
      {
        heading: 'About AscendRev',
        paragraphs: [
          'AscendRev is a startup Calgary, Alberta Canada-headquartered outsourcing company experiencing rapid growth. We build dedicated sales and operational teams that help businesses expand capacity, create opportunities and grow revenue.',
          'We are looking for talented sales professionals who want more than just a job. This is an opportunity to build a career, contribute to our growth strategy and have a direct influence on the path of a growing company.',
          'We are looking for people who can confidently and proudly represent the AscendRev and our Client’s brand in the market.',
        ],
      },
      {
        heading: 'About the Role',
        paragraphs: [
          outboundOpeningLine,
          'This is a proactive, phone-based sales role focused on outbound prospecting, lead generation, customer engagement, customer sign up and consistent follow-up.',
          'The ideal candidate is customer-centric, highly motivated, comfortable making outbound calls and confident asking for the appointment and next step.',
        ],
      },
      {
        heading: 'Key Responsibilities',
        bullets: [
          'Generate new sales opportunities through outbound calling and prospecting',
          'Contact prospective customers and identify their needs, projects and timelines',
          'Qualify prospects and determine genuine sales opportunities',
          'Manage leads through the sales cycle from initial contact through qualified opportunity and close',
          'Follow up consistently with prospects and previous inquiries',
          'Re-engage past customers and dormant opportunities',
          'Maintain accurate lead and customer information',
          'Use a sales dialer and other sales technology to maintain consistent activity',
          'Record call outcomes, customer information and next steps accurately',
          'Meet defined activity, appointment and sales targets',
          'Work closely with the sales team to ensure qualified opportunities are properly handed off',
          'Participate in coaching and continuously improve sales performance',
        ],
      },
      {
        heading: 'What We’re Looking For',
        bullets: [
          '3+ years of outbound sales experience',
          'Strong track record of generating and converting sales opportunities',
          'Confident and professional telephone communication skills',
          'Comfortable making a high volume of outbound calls',
          'Strong discovery, qualification and objection-handling skills',
          'Customer-centric approach with a strong commercial mindset',
          'Persistent, disciplined and highly organized with follow-up',
          'Confident asking for the appointment and moving the customer toward a decision',
          'Experience using a CRM is an asset',
          'Experience using a sales dialer is an asset',
          'Strong written and verbal communication skills',
          'Highly coachable and motivated by measurable results',
        ],
      },
      {
        heading: 'The Person We’re Looking For',
        paragraphs: [
          'We are looking for people who strive to deliver results while upholding accuracy, honesty and quality in every customer interaction.',
          'You understand that great outbound sales are not about simply making calls or pushing for a sale. It is about creating a professional, helpful and memorable customer experience while identifying genuine opportunities to do business.',
          'You are a hunter, not an order taker.',
          'You are comfortable starting conversations with people who may not know you, uncovering a need, building trust and creating a reason for the customer to take the next step.',
          'You know how to listen and put the customer first—but you are also confident enough to ask for the appointment, overcome objections, create momentum and/-or close the deal.',
          'You take ownership of your pipeline, your follow-up and your results.',
          'Most importantly, you take pride in how you represent AscendRev and the clients we serve.',
        ],
      },
      {
        heading: 'Why Join AscendRev?',
        paragraphs: ['AscendRev is growing quickly, and we want our people to grow with us.', 'You will have the opportunity to:'],
        bullets: [
          'Build a potential long-term career with us',
          'Contribute ideas and influence how we build and scale our business',
          'Develop your sales skills through coaching, technology and real-world experience',
          'Earn performance-based commissions on top of your base pay',
          'Pursue career progression and leadership opportunities',
          'Be part of a team where individual performance and contribution matter',
        ],
        closing: [
          'We are building something with long-term potential, and we are looking for driven sales professionals who want to be part of that journey.',
          'If you are an experienced outbound salesperson who enjoys prospecting, connecting with customers, creating opportunities and closing, we want to hear from you.',
        ],
      },
    ],
    open: true,
  },
  {
    slug: 'customer-service-representative',
    title: customerServiceTitle,
    location: 'Onsite | Ayala Alabang Town Centre',
    employmentType: 'Contract | Full time',
    experience: '2 years',
    schemaEmploymentType: ['FULL_TIME', 'CONTRACTOR'],
    datePosted: '2026-10-12',
    summary: customerServiceOpeningLine,
    sections: [
      {
        heading: 'About AscendRev',
        paragraphs: [
          'AscendRev is a startup Calgary, Alberta Canada-headquartered outsourcing company experiencing rapid growth. We build dedicated sales and operational teams that help businesses expand capacity, create opportunities and grow revenue.',
          'We are looking for talented professionals who want more than just a job. This is an opportunity to build a career, contribute to our growth strategy and have a direct influence on the path of a growing company.',
          'We are looking for people who can confidently and proudly represent the AscendRev and our Client’s brand in the market.',
        ],
      },
      {
        heading: 'About the Role',
        paragraphs: [
          `${customerServiceOpeningLine} As one of our foundational team members, you will have the opportunity to influence our service framework, workflows, customer satisfaction (CSAT) standards, and performance measures while delivering exceptional customer experiences.`,
          'This is more than a customer service role—it’s an opportunity to make an impact, contribute ideas, improve processes, and grow into greater responsibilities as AscendRev expands.',
        ],
      },
      {
        heading: 'Key Responsibilities',
        bullets: [
          'Manage customer inquiries through phone, web, email, and chat.',
          'Process orders, maintain accurate customer records, and schedule appointments.',
          'Conduct timely follow-ups to ensure customer satisfaction and issue resolution.',
          'Identify cross-selling opportunities and contribute to business growth.',
          'Help establish customer service workflows, service standards, CSAT initiatives, and performance measures.',
          'Identify opportunities to improve efficiency, service quality, and the overall customer experience.',
        ],
      },
      {
        heading: 'Qualifications',
        bullets: [
          'Minimum 2 years of international customer service experience.',
          'Excellent verbal and written communication skills.',
          'Strong data entry, data management, and organizational skills.',
          'Exceptional attention to detail, accuracy, and due diligence.',
          'Proactive problem-solving skills, accountability, and initiative.',
          'Experience using CRM systems, scheduling tools, and dialer platforms is preferred.',
          'A customer-first mindset with a commitment to service excellence.',
          'A willingness to take ownership, contribute ideas, and grow with a developing organization.',
        ],
      },
      {
        heading: 'Why Join AscendRev?',
        paragraphs: ['AscendRev is growing quickly, and we want our people to grow with us.', 'You will have the opportunity to:'],
        bullets: [
          'Build a potential long-term career with us',
          'Contribute ideas and influence how we build and scale our business',
          'Develop your sales skills through coaching, technology and real-world experience',
          'Earn performance-based commissions on top of your base pay',
          'Pursue career progression and leadership opportunities',
          'Be part of a team where individual performance and contribution matter',
        ],
        closing: [
          'We are building something with long-term potential, and we are looking for driven customer service professionals who want to be part of that journey.',
          'If you are an experienced customer service professional who enjoys connecting with customers while creating and closing opportunities, we want to hear from you.',
        ],
      },
    ],
    open: true,
  },
];

export const openRoles = careerRoles.filter((role) => role.open);

/** "11 Oct 2026", the format of Rio's example postings. */
export function formatPostedDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00+08:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });
}

/* The application screen. Questions and the thank-you line are Rio's wording. */

export const yearsOptions: ChoiceOption<YearsValue>[] = [
  { value: 'none', label: 'None' },
  { value: 'lt1', label: 'Less than 1 year' },
  { value: '1to2', label: '1 to 2 years' },
  { value: '3to5', label: '3 to 5 years' },
  { value: '5plus', label: 'More than 5 years' },
];

export const applicationForm = {
  applyCta: 'Apply for this Job',
  submit: 'Submit',
  sending: 'Submitting',
  fields: {
    resume: {
      label: 'Attach your resume',
      helper: 'PDF or DOCX only. Maximum file size 5 MB.',
      dropPrompt: 'Drag your resume here, or',
      browse: 'choose a file',
      replace: 'Replace file',
    },
    fullName: { label: 'Full name' },
    email: { label: 'Email address' },
    phone: { label: 'Mobile number' },
    outboundYears: { label: 'How many years of international outbound sales experience do you have?' },
    csYears: { label: 'How many years of international customer service experience do you have?' },
    expectedSalary: { label: 'What’s your expected monthly salary?' },
    siteShiftConfirmed: {
      label:
        'These are for our Alabang-site location (not work from home) and night-shift. Submit your application if these are clear.',
    },
    // Required by the Data Privacy Act for collecting a resume; not part of Rio's copy.
    consent: {
      label: 'I agree that AscendRev may use my resume and answers to assess my application, and keep them for up to 12 months.',
    },
  },
  states: {
    validationSummary: 'A few answers need attention.',
    failure: 'Your application did not go through. Please check your connection and press Submit again; your answers are still here.',
    rateLimited: 'Too many attempts from this connection. Please try again in an hour.',
    tooLarge: 'That file is larger than the 5 MB maximum. Please upload a smaller PDF or DOCX.',
    wrongType: 'Only PDF or DOCX files are accepted. Please save your resume as a PDF or a Word (.docx) file and upload it again.',
  },
  thankYou: 'Thank you for applying. We’ll review and reach out when there’s a right fit.',
  privacyLinkLabel: 'Privacy Policy',
  privacyHref: '/privacy/',
} as const;
