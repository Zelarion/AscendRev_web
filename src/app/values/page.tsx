import type { Metadata } from 'next';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import ValuesList from '@/components/sections/values/ValuesList';
import { values } from '@/content/values';

/**
 * `/values`. A plain content page like `/privacy`, not a hero marketing
 * page like `/advantage`: the client's own instruction was "Please do not
 * change the wording, if possible," so the page's job is to present the
 * three values faithfully rather than to dramatise them.
 */
export const metadata: Metadata = {
  title: values.meta.title,
  description: values.meta.description,
  alternates: {
    canonical: values.canonicalPath,
  },
};

export default function ValuesPage() {
  return (
    <Section
      size="large"
      className="!pt-[calc(var(--header-height)_+_1.5rem)] !pb-[clamp(2.5rem,5vw,4rem)]"
    >
      <Container className="max-w-none">
        <h1 className="text-h1 font-display font-medium tracking-[-0.025em] text-[var(--ink)]">
          {values.heading}
        </h1>

        <ValuesList values={values.values} />
      </Container>
    </Section>
  );
}
