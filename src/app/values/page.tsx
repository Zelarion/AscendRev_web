import ValuesThroughline from '@/components/sections/values/ValuesThroughline';
import { values } from '@/content/values';
import { createSeoMetadata } from '@/lib/seoMetadata';

/** `/values` presents the team and all three corporate values in one section. */
export const metadata = createSeoMetadata({
  title: values.meta.title,
  description: values.meta.description,
  canonicalPath: values.canonicalPath,
});

export default function ValuesPage() {
  return (
    <ValuesThroughline
      heading={values.heading}
      teamImage={values.teamImage}
      values={values.values}
    />
  );
}
