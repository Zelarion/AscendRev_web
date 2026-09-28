export interface CapabilityGroup {
  heading: string;
  services: readonly string[];
}

export const capabilities = {
  title: 'Capabilities Built Around Your Business',
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
