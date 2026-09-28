import Image from 'next/image';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import ValuesList from '@/components/sections/values/ValuesList';
import ValuesThroughline from '@/components/sections/values/ValuesThroughline';
import { values } from '@/content/values';
import { createSeoMetadata } from '@/lib/seoMetadata';

/**
 * `/values`. A plain content page like `/privacy`, not a hero marketing
 * page like `/advantage`: the client's own instruction was "Please do not
 * change the wording, if possible," so the page's job is to present the
 * three values faithfully rather than to dramatise them.
 */
export const metadata = createSeoMetadata({
  title: values.meta.title,
  description: values.meta.description,
  canonicalPath: values.canonicalPath,
});

export default function ValuesPage() {
  return (
    <>
      <Section
        size="large"
        className="!pt-[calc(var(--header-height)_+_1.5rem)] !pb-[clamp(2.5rem,5vw,4rem)]"
      >
        <Container className="max-w-none">
          <h1 className="text-h1 font-display font-medium tracking-[-0.025em] text-[var(--ink)]">
            {values.heading}
          </h1>

          <div className="mx-auto mt-7 w-full max-w-[560px] sm:mt-9">
            <figure className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-band)]">
              <Image
                src={values.teamImage.src}
                alt={values.teamImage.alt}
                width={1081}
                height={723}
                sizes="(min-width: 560px) 560px, calc(100vw - 2.5rem)"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </figure>
          </div>

          <ValuesList values={values.values} />
        </Container>
      </Section>
      <ValuesThroughline />
    </>
  );
}
