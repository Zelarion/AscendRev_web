/**
 * `/careers/` and `/careers/<role>/` copy.
 *
 * Requested by Rio Vidal on 10 October 2026: a careers section where AscendRev
 * posts open roles, advertised on Facebook, with applications (resume plus five
 * screening questions) going to his mailbox. The five questions are his own
 * wording. Everything else here is a DRAFT for his approval in the preview, per
 * CONTENT-CHANGE-BLOCKER.md: role summaries are built only from what he told
 * us (onsite at Alabang Town Centre, night shift, the three role types his
 * questions imply) and from facts already published on the site.
 *
 * `src/lib/careersSchema.ts` validates the form and `public/api/careers.php`
 * re-validates the same rules. Role slugs and answer values are a contract with
 * that handler: renaming one here without the other rejects every application.
 */

import type { PageMeta } from './home';

export type RoleSlug =
  | 'outbound-sales-representative'
  | 'customer-service-representative'
  | 'team-leader'
  | 'general-application';

export type RoleTeam = 'Sales' | 'Customer Experience' | 'Leadership';

export interface CareerRole {
  slug: Exclude<RoleSlug, 'general-application'>;
  title: string;
  team: RoleTeam;
  /** One or two sentences for the card and the search snippet. */
  summary: string;
  responsibilities: string[];
  requirements: string[];
  /** Short facts shown as chips on the card. */
  facts: string[];
  /** schema.org employmentType. */
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR';
  /** ISO date the role was published, and the date it stops being advertised. */
  datePosted: string;
  validThrough: string;
  /** False hides the role everywhere without deleting its copy. */
  open: boolean;
}

export interface CareersStat {
  value: string;
  label: string;
}

export interface WorkplacePhoto {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

export interface ProcessStep {
  title: string;
  body: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ChoiceOption<Value extends string> {
  value: Value;
  label: string;
}

export type YearsValue = 'none' | 'lt1' | '1to2' | '3to5' | '5plus';
export type YesNo = 'yes' | 'no';

/* Shared facts, so the page, the roles and the structured data cannot drift. */

export const workLocation = {
  name: 'Alabang Town Centre',
  street: 'Alabang Town Centre, Ayala Alabang',
  locality: 'Muntinlupa',
  region: 'Metro Manila',
  postalCode: '1780',
  country: 'PH',
  shift: 'Night shift, aligned to North American business hours',
} as const;

export const careersMeta: PageMeta = {
  title: 'Careers in Alabang: Sales, Customer Service and Team Leader Roles',
  description:
    'Join AscendRev at Alabang Town Centre. Night-shift sales, customer service and team leader roles serving North American clients. Apply online in about five minutes.',
};

export const careersHero = {
  headline: 'Your next seat is in Alabang.',
  intro:
    'AscendRev builds dedicated sales and customer experience teams for North American companies, from our office at Alabang Town Centre. We are hiring people who want to grow with a team that is still being built.',
  primaryCta: 'See open roles',
  secondaryCta: 'Apply now',
  chips: ['Onsite, Alabang Town Centre', 'Night shift', 'North American clients'],
} as const;

export const careerRoles: CareerRole[] = [
  {
    slug: 'outbound-sales-representative',
    title: 'International Outbound Sales Representative',
    team: 'Sales',
    summary:
      'Open conversations with North American businesses by phone, qualify their needs and move them toward a meeting or a sale.',
    responsibilities: [
      'Make outbound calls to business prospects in Canada and the United States.',
      'Qualify needs, handle objections and book meetings or close sales.',
      'Keep every call, note and next step up to date in the CRM.',
      'Work to daily and weekly activity and results targets.',
    ],
    requirements: [
      'Experience in international outbound sales, ideally in a BPO.',
      'Clear, confident spoken and written English.',
      'Able to work onsite at Alabang Town Centre on the night shift.',
    ],
    facts: ['Onsite, Alabang Town Centre', 'Night shift', 'Full-time'],
    employmentType: 'FULL_TIME',
    datePosted: '2026-10-11',
    validThrough: '2027-01-31',
    open: true,
  },
  {
    slug: 'customer-service-representative',
    title: 'International Customer Service Representative',
    team: 'Customer Experience',
    summary:
      'Be the voice North American customers reach when they need help: answer, solve and follow through on every contact.',
    responsibilities: [
      'Handle customer calls, emails and chats for North American clients.',
      'Resolve issues on first contact where possible, and escalate clearly when not.',
      'Record every interaction accurately in the client\'s systems.',
      'Meet quality, response time and customer satisfaction targets.',
    ],
    requirements: [
      'Experience in international customer service, ideally in a BPO.',
      'Clear, confident spoken and written English.',
      'Able to work onsite at Alabang Town Centre on the night shift.',
    ],
    facts: ['Onsite, Alabang Town Centre', 'Night shift', 'Full-time'],
    employmentType: 'FULL_TIME',
    datePosted: '2026-10-11',
    validThrough: '2027-01-31',
    open: true,
  },
  {
    slug: 'team-leader',
    title: 'Team Leader',
    team: 'Leadership',
    summary:
      'Lead a sales or customer service team on the floor: coach people, own the numbers and keep the client confident.',
    responsibilities: [
      'Lead, coach and support a team of sales or customer service representatives.',
      'Track daily performance and act early when results slip.',
      'Run call reviews, feedback sessions and new-hire onboarding.',
      'Report on team results and work directly with client stakeholders.',
    ],
    requirements: [
      'Supervisory or team leader experience in a BPO.',
      'Background in international sales or customer service.',
      'Able to work onsite at Alabang Town Centre on the night shift.',
    ],
    facts: ['Onsite, Alabang Town Centre', 'Night shift', 'Full-time'],
    employmentType: 'FULL_TIME',
    datePosted: '2026-10-11',
    validThrough: '2027-01-31',
    open: true,
  },
];

export const openRoles = careerRoles.filter((role) => role.open);

/** Derived, so the count can never disagree with the roles actually listed. */
export const careersStats: CareersStat[] = [
  { value: String(openRoles.length), label: openRoles.length === 1 ? 'role open now' : 'roles open now' },
  { value: '5 min', label: 'to apply online' },
  { value: 'No', label: 'account needed' },
];

export const generalApplication = {
  slug: 'general-application' as const,
  title: 'General application',
  summary: 'Do not see your role? Send your resume and we will keep it for the next opening that fits.',
};

/** Real photographs of AscendRev's own office, as used elsewhere on the site. */
export const workplacePhotos: WorkplacePhoto[] = [
  {
    src: '/images/office4.webp',
    alt: 'Rows of workstations with blue partitions on the AscendRev production floor',
    caption: 'The production floor',
    width: 1672,
    height: 941,
  },
  {
    src: '/images/ascendrev-training-room.webp',
    alt: 'Training room with long desks and chairs along both walls',
    caption: 'Training room',
    width: 1206,
    height: 664,
  },
  {
    src: '/images/boardroom-gallery-wide.webp',
    alt: 'AscendRev boardroom with a long meeting table',
    caption: 'Boardroom',
    width: 1672,
    height: 941,
  },
  {
    src: '/images/hallway-gallery-wide.webp',
    alt: 'Office hallway with wooden ceiling slats and framed wall art',
    caption: 'Our Alabang office',
    width: 1672,
    height: 941,
  },
];

export const whyJoin = {
  heading: 'Where you will work',
  intro:
    'A professional office in the heart of Alabang Town Centre, built for teams that serve clients in North America through the night.',
} as const;

export const hiringProcess = {
  heading: 'How hiring works',
  steps: [
    { title: 'Apply online', body: 'Answer five short questions and attach your resume. It takes about five minutes.' },
    { title: 'Screening call', body: 'If your experience fits, our team calls you to talk about the role and your background.' },
    { title: 'Interview', body: 'Meet the team at our office in Alabang Town Centre.' },
    { title: 'Offer and onboarding', body: 'Successful applicants receive an offer, then start with training before joining the floor.' },
  ] satisfies ProcessStep[],
} as const;

export const careersFaq: FaqItem[] = [
  {
    question: 'Is the work onsite or work from home?',
    answer: 'Onsite, at our office in Alabang Town Centre.',
  },
  {
    question: 'What schedule should I expect?',
    answer: 'Night shift, so our teams work during North American business hours.',
  },
  {
    question: 'What file can I upload as my resume?',
    answer: 'A PDF or DOCX file, up to 5 MB. Other formats are not accepted. A PDF keeps your layout exactly as you made it.',
  },
  {
    question: 'How will I know you received my application?',
    answer:
      'You see a confirmation with a reference number as soon as you submit. Keep it in case you contact us about your application.',
  },
  {
    question: 'How is my personal information used?',
    answer:
      'Only to assess your application and contact you about this and future openings at AscendRev. We keep applications for up to 12 months, then delete them. You can ask us to correct or delete your data at any time.',
  },
];

/* The form. The five screening questions are Rio Vidal's own wording. */

export const yearsOptions: ChoiceOption<YearsValue>[] = [
  { value: 'none', label: 'None' },
  { value: 'lt1', label: 'Less than 1 year' },
  { value: '1to2', label: '1 to 2 years' },
  { value: '3to5', label: '3 to 5 years' },
  { value: '5plus', label: 'More than 5 years' },
];

export const yesNoOptions: ChoiceOption<YesNo>[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const applicationForm = {
  heading: 'Apply in three short steps',
  intro: 'No account needed. Your answers stay on this page until you send them.',
  steps: ['About you', 'Your experience', 'Resume and send'],
  fields: {
    fullName: { label: 'Full name' },
    email: { label: 'Email address' },
    phone: { label: 'Mobile number', helper: 'For example 0917 123 4567 or +63 917 123 4567.' },
    role: { label: 'Role you are applying for' },
    linkedin: { label: 'LinkedIn profile (optional)', helper: 'The full link, starting with https://' },
    outboundYears: { label: 'How many years of international outbound sales experience do you have?' },
    csYears: { label: 'How many years of international customer service experience do you have?' },
    onsiteNightShift: {
      label: 'This is onsite based in our Alabang Town Centre, night shift. Are you able to commit?',
    },
    supervisoryExperience: { label: 'Do you have a supervisory or Team Leader experience in BPO?' },
    supervisoryDetails: { label: 'Please tell us more.', helper: 'Team size, how long, and what you were responsible for.' },
    pay: {
      label: 'What is your monthly base pay range expectation?',
      helper: 'Monthly base pay in Philippine pesos, before allowances.',
      minLabel: 'From',
      maxLabel: 'To',
    },
    resume: {
      label: 'Resume',
      helper: 'PDF or DOCX only. Maximum file size 5 MB.',
      dropPrompt: 'Drag your resume here, or',
      browse: 'choose a file',
      replace: 'Replace file',
    },
    consent: {
      label:
        'I agree that AscendRev may use the information and resume I submit to assess my application and to contact me about this and future openings. AscendRev keeps applications for up to 12 months, then deletes them.',
    },
  },
  review: { heading: 'Check your answers', edit: 'Edit' },
  nav: { next: 'Continue', back: 'Back', submit: 'Send application', sending: 'Sending your application' },
  states: {
    validationSummary: 'A few answers need attention before you continue.',
    failure:
      'Your application did not go through. Please check your connection and press Send again; your answers are still here.',
    rateLimited: 'Too many attempts from this connection. Please try again in an hour.',
    tooLarge: 'That file is larger than the 5 MB maximum. Please upload a smaller PDF or DOCX, for example by saving it without large images.',
    wrongType: 'Only PDF or DOCX files are accepted. Please save your resume as a PDF or a Word (.docx) file and upload it again.',
  },
  success: {
    heading: 'Application received',
    body: 'Thank you. Our team reviews every application. If your experience fits the role, we will call or email you.',
    referenceLabel: 'Your reference',
    share: 'Know someone who would fit? Share this role.',
    copied: 'Link copied',
    copy: 'Copy link',
    another: 'Apply for another role',
  },
  privacyLinkLabel: 'Privacy Policy',
  privacyHref: '/privacy/',
} as const;
