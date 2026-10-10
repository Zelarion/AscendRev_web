import Image from 'next/image';
import type { JSX } from 'react';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import { whyJoin, workplacePhotos } from '@/content/careers';
import styles from './careers.module.css';

/**
 * Photographs of AscendRev's own office only (DESIGN.md §5 standing
 * constraint). Bento layout on four columns: the production floor takes the
 * left half across both rows, two frames sit side by side top right, and the
 * last spans the bottom right, so four photos always fill two clean rows.
 */
export default function WorkplaceGallery(): JSX.Element {
  const [lead, ...rest] = workplacePhotos;

  return (
    <section aria-labelledby="workplace-heading" className="bg-[var(--surface-band-raised)] py-[clamp(3.5rem,8vw,6rem)]">
      <div className="mx-auto w-full max-w-[1280px] px-[var(--site-gutter)]">
        <div className="max-w-[44rem]">
          <h2 id="workplace-heading" className="font-display text-h2 text-[var(--navy-900)]">
            {whyJoin.heading}
          </h2>
          <p className="mt-3 text-body text-[var(--ink-muted)]">{whyJoin.intro}</p>
        </div>

        <RevealOnScroll as="ul" stagger className="mt-9 grid gap-4 md:grid-cols-4 md:grid-rows-2">
          {lead && (
            <li className="md:col-span-2 md:row-span-2">
              <Photo photo={lead} sizes="(min-width: 768px) 50vw, 100vw" tall />
            </li>
          )}
          {rest.map((photo, index) => {
            const wide = index === rest.length - 1 && rest.length === 3;
            return (
              <li key={photo.src} className={wide ? 'md:col-span-2' : undefined}>
                <Photo photo={photo} sizes={wide ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 100vw'} />
              </li>
            );
          })}
        </RevealOnScroll>
      </div>
    </section>
  );
}

function Photo({ photo, sizes, tall = false }: { photo: (typeof workplacePhotos)[number]; sizes: string; tall?: boolean }) {
  return (
    <figure className={`${styles.photo} relative m-0 h-full overflow-hidden rounded-[10px] ${tall ? 'min-h-[18rem] md:min-h-[26rem]' : 'aspect-[16/10] md:aspect-auto md:min-h-[12.5rem]'}`}>
      <Image src={photo.src} alt={photo.alt} fill sizes={sizes} loading="lazy" className="object-cover" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-[linear-gradient(0deg,rgba(15,27,51,0.82),rgba(15,27,51,0))] px-4 pb-3 pt-10 text-small font-medium text-white">
        {photo.caption}
      </figcaption>
    </figure>
  );
}
