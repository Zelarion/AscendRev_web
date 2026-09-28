import { site } from '@/content/site';

const siteUrl = `${site.url}/`;
const organizationId = `${siteUrl}#organization`;

const sameAs = [site.linkedinUrl, site.facebookUrl].filter(
  (url): url is string => typeof url === 'string' && url.length > 0,
);

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: site.name,
      legalName: site.legalName,
      url: siteUrl,
      logo: `${siteUrl}new-logo.png`,
      sameAs,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: site.phone,
        email: site.contactEmail,
        contactType: 'sales',
        areaServed: 'Canada',
        availableLanguage: 'English',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.addressParts.city,
        addressRegion: site.addressParts.region,
        addressCountry: 'CA',
      },
    },
    {
      '@type': 'ProfessionalService',
      '@id': `${siteUrl}#professional-service`,
      name: site.name,
      url: siteUrl,
      image: `${siteUrl}ascendrev-og-preview.jpg`,
      description:
        'Dedicated sales, customer experience, and business operations teams for North American companies, delivered from the Philippines.',
      serviceType:
        'Sales, customer experience, and business operations team services',
      areaServed: {
        '@type': 'Country',
        name: 'Canada',
      },
      provider: {
        '@id': organizationId,
      },
      telephone: site.phone,
      email: site.contactEmail,
      address: {
        '@type': 'PostalAddress',
        addressLocality: site.addressParts.city,
        addressRegion: site.addressParts.region,
        addressCountry: 'CA',
      },
    },
  ],
};

export default function OrganizationJsonLd() {
  const jsonLd = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
