import { site } from '@/content/site';
import { advantage } from '@/content/advantage';
import { solutions } from '@/content/solutions';
import { schemaIds } from '@/lib/schemaIds';
import JsonLdScript from './JsonLdScript';

const siteUrl = `${site.url}/`;

const leadership = advantage.leadership;

/**
 * Only profiles that belong to the company itself. A person's profile here
 * would tell search engines the company and the person are the same entity.
 */
const organizationSameAs = [site.companyLinkedinUrl, site.facebookUrl].filter(
  (url): url is string => typeof url === 'string' && url.length > 0,
);

const calgaryAddress = {
  '@type': 'PostalAddress',
  addressLocality: site.addressParts.city,
  addressRegion: site.addressParts.region,
  addressCountry: 'CA',
};

const philippinesOffice = site.philippinesOfficeAddressParts;

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      // One node for the company. ProfessionalService is an Organization
      // subtype; listing both keeps Organization-only consumers (logo,
      // knowledge panel) and local-business consumers on the same entity.
      '@type': ['Organization', 'ProfessionalService'],
      '@id': schemaIds.organization,
      name: site.name,
      legalName: site.legalName,
      alternateName: ['Ascend Rev', 'AscendRev Outsourcing'],
      // Separates this company from similarly named firms that search
      // engines have confused it with. Built only from facts on the site.
      disambiguatingDescription: `${site.legalName}, headquartered in Calgary, Alberta, provides dedicated sales, customer experience, and business operations teams delivered from the Philippines.`,
      description: site.description,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        '@id': schemaIds.logo,
        url: `${siteUrl}icon-512.png`,
        contentUrl: `${siteUrl}icon-512.png`,
        width: 512,
        height: 512,
        caption: site.name,
      },
      image: { '@id': schemaIds.logo },
      foundingDate: site.foundingDate,
      founder: { '@id': schemaIds.founder },
      sameAs: organizationSameAs,
      telephone: site.phone,
      email: site.contactEmail,
      address: calgaryAddress,
      location: [
        {
          '@type': 'Place',
          name: `${site.name} head office`,
          address: calgaryAddress,
        },
        {
          '@type': 'Place',
          name: `${site.name} Philippines delivery`,
          address: {
            '@type': 'PostalAddress',
            streetAddress: philippinesOffice.street,
            addressLocality: philippinesOffice.city,
            addressRegion: philippinesOffice.region,
            addressCountry: 'PH',
          },
        },
      ],
      // The site's own copy says "North American companies".
      areaServed: [
        { '@type': 'Country', name: 'Canada' },
        { '@type': 'Country', name: 'United States' },
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: site.phone,
        email: site.contactEmail,
        contactType: 'sales',
        areaServed: ['CA', 'US'],
        availableLanguage: 'English',
      },
      // The nine functions exactly as labelled in the capabilities service grid.
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: solutions.services.heading,
        itemListElement: solutions.services.items.map((item) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: item.label,
            url: `${siteUrl}capabilities/`,
            provider: { '@id': schemaIds.organization },
          },
        })),
      },
    },
    {
      '@type': 'WebSite',
      '@id': schemaIds.website,
      url: siteUrl,
      name: site.name,
      alternateName: site.legalName,
      description: site.description,
      inLanguage: 'en-CA',
      publisher: { '@id': schemaIds.organization },
    },
    {
      '@type': 'Person',
      '@id': schemaIds.founder,
      name: leadership.name,
      jobTitle: leadership.role,
      image: `${siteUrl}images/rio-vidal-portrait.webp`,
      url: `${siteUrl}advantage/`,
      worksFor: { '@id': schemaIds.organization },
      homeLocation: { '@type': 'Place', name: leadership.location },
      sameAs: site.linkedinUrl ? [site.linkedinUrl] : [],
    },
  ],
};

/** Site-wide entity graph, rendered once from the root layout. */
export default function OrganizationJsonLd() {
  return <JsonLdScript data={structuredData} />;
}
