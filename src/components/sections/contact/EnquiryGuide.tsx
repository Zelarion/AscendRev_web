import type { JSX } from 'react';
import type { WhatToExpectContent } from '@/content/contact';
import BlueprintStory from './BlueprintStory';

interface EnquiryGuideProps {
  content: WhatToExpectContent;
}

/** The three-step blueprint path, paired with the enquiry form on Contact. */
export default function EnquiryGuide({ content }: EnquiryGuideProps): JSX.Element {
  return (
    <section aria-labelledby="what-to-expect-heading" className="min-w-0 text-left">
      <BlueprintStory content={content} />
    </section>
  );
}
