export interface CapabilityGroup {
  heading: string;
  services: readonly string[];
}

export const capabilities = {
  /** Visible page heading (the H1). Not used for search; see `meta`. */
  title: 'Capabilities Built Around Your Business',
  meta: {
    // Search and browser-tab wording, Canada-first. Not shown in the page body.
    // Founder approved on 2026-10-03 as a non-visible change (see
    // CONTENT-CHANGE-BLOCKER.md); visible copy is untouched.
    title: 'Offshore Sales, CX and Back Office Teams',
    description:
      'Dedicated sales, customer experience and back office teams from the Philippines, shaped around the capacity your Canadian business needs.',
  },
  groups: [
    {
      heading: 'Generate Demand',
      services: ['Lead Generation', 'Data', 'Outbound Sales', 'Appointment Setting'],
    },
    {
      heading: 'Convert More Opportunities',
      services: ['Inbound Conversion', 'Follow-Up', 'Sales Development'],
    },
    {
      heading: 'Serve More Customers',
      services: ['Customer Care', 'Email', 'Chat', 'Technical Support'],
    },
    {
      heading: 'Grow Existing Revenue',
      services: ['Account Management', 'Reactivation', 'Cross-Sell'],
    },
    {
      heading: 'Strengthen Cash Flow',
      services: ['Accounts Receivable', 'Collections', 'Customer Follow-Up'],
    },
  ] satisfies readonly CapabilityGroup[],
  cta: "Need something else? Tell us where the gap is. We'll tell you if we can help.",
} as const;
