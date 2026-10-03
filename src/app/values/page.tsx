import ValuesThroughline from '@/components/sections/values/ValuesThroughline';
import { values } from '@/content/values';
import PageJsonLd from '@/components/seo/PageJsonLd';
import { createSeoMetadata, type SeoMetadataInput } from '@/lib/seoMetadata';

/** `/values` presents the team and all three corporate values in one section. */
const seo: SeoMetadataInput = {
  title: values.meta.title,
  description: values.meta.description,
  canonicalPath: values.canonicalPath,
};

export const metadata = createSeoMetadata(seo);

export default function ValuesPage() {
  return (
    <>
      <PageJsonLd {...seo} />
      <ValuesThroughline
        heading={values.heading}
        teamImage={values.teamImage}
        values={values.values}
      />
    </>
  );
}
