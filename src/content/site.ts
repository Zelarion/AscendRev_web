/**
 * Typed site-wide constants. SPEC.md §2: all client-facing copy lives in
 * `src/content/*.ts`, never hard-coded in JSX, so a wording change is one file.
 */

export interface PostalAddress {
  street?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
}

export interface Site {
  name: string;
  legalName: string;
  /**
   * Display name for footer/legal fine print. Same string as `legalName`
   * today (`src/components/layout/Footer.tsx`, owned by another builder,
   * expects this exact field name), kept as a separate field rather than an
   * alias for `legalName` so a future rebrand can point the footer at a
   * short display name without touching the legal entity name used
   * elsewhere.
   */
  companyName: string;
  domain: string;
  url: string;
  tagline: string;
  /** Default search and social description, reused by metadata, manifest and JSON-LD. */
  description: string;
  phone: string;
  /**
   * Single-line formatted address, safe to render directly as text
   * (`{site.address}`). `addressParts` below carries the same address as
   * structured data for anything that needs the pieces rather than a
   * rendered string, e.g. the `PostalAddress` JSON-LD block (SPEC.md §8),
   * built in a later pass.
   */
  address: string;
  addressParts: PostalAddress;
  /** Confirmed Philippines office location, provided as display text and structured fields. */
  philippinesOfficesLine: string;
  philippinesOfficeAddressParts: PostalAddress;
  /**
   * Rio Vidal's personal LinkedIn profile, linked beside his bio on the
   * Advantage page. It is a person, so JSON-LD lists it on the founder's
   * Person node, never on the Organization.
   */
  linkedinUrl?: string;
  /**
   * The company's own LinkedIn page. Organization `sameAs` uses this so search
   * engines tie ascend-rev.ca to this company and not to similarly named ones
   * (Google's AI Overview mixed AscendRev up with another firm, Oct 2026).
   */
  companyLinkedinUrl?: string;
  /** Canadian registration date, ISO 8601. Stated on the Advantage page. */
  foundingDate: string;
  /** Optional Facebook page linked from the site footer. */
  facebookUrl?: string;
  /**
   * The footer's SLA/response-time line (DESIGN.md §2 permits the mono
   * `label` style here). SPEC.md §7 item 7 explicitly bans the client's
   * draft copy ("Data handled under executive compliance") as legally
   * meaningless and requires a plain factual sentence plus a link to the
   * privacy policy in its place, that is new copy this pass does not have
   * authority to write. Left unset rather than invented; `Footer.tsx`
   * already skips the line entirely when it's absent.
   */
  slaLine?: string;
  /**
   * Confirmed by the client in writing (requirements/Item Needed _Answer.docx,
   * "Website Enquiry Email"). Their architecture document had listed
   * rio.vidal@ascendrev.ca, on a domain that does not resolve; their own answer
   * corrected it to the hyphenated ascend-rev.ca. SPEC.md §7 item 2 is closed.
   */
  contactEmail: string;
  /**
   * Second enquiry recipient, so no lead depends on a single mailbox
   * (SPEC.md §6). Also confirmed in the same answer sheet.
   */
  enquiryEmailSecondary: string;
}

const addressParts: PostalAddress = {
  city: 'Calgary',
  region: 'AB',
  country: 'Canada',
};

const philippinesOfficeAddressParts: PostalAddress = {
  street: 'Alabang Town Centre',
  city: 'Ayala Alabang',
  region: 'Manila',
  country: 'Philippines',
};

export const site: Site = {
  name: 'AscendRev',
  legalName: 'AscendRev Outsourcing Services Corp.',
  companyName: 'AscendRev Outsourcing Services Corp.',
  domain: 'ascend-rev.ca',
  url: 'https://ascend-rev.ca',
  tagline: 'Dedicated Team. Targeted Solutions. Accelerated Revenue.',
  description:
    'AscendRev builds dedicated sales, customer experience, and business operations teams for North American companies, delivered from the Philippines.',
  phone: '+1 (403) 903-2912',
  address: 'Calgary, AB, Canada',
  addressParts,
  philippinesOfficesLine: 'Office locations in Alabang, Cebu and Pampanga Philippines',
  philippinesOfficeAddressParts,
  contactEmail: 'rio.vidal@ascend-rev.ca',
  enquiryEmailSecondary: 'ralph.tomines@ascend-rev.ca',
  linkedinUrl: 'https://www.linkedin.com/in/rio-mendoza-vidal-56900210b/',
  companyLinkedinUrl: 'https://www.linkedin.com/company/ascendrev-outsourcing-services-corp/',
  foundingDate: '2026-09-11',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61594055567709',
};
