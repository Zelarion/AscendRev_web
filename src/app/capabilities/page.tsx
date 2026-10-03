import Link from 'next/link';
import {
  ArrowRight,
  ChartLineUp,
  Coins,
  FunnelSimple,
  Headset,
  Megaphone,
} from '@phosphor-icons/react/dist/ssr';
import AtmosphereLayer from '@/components/sections/shared/AtmosphereLayer';
import CapabilityApproach from '@/components/sections/capabilities/CapabilityApproach';
import CapabilityJourney from '@/components/sections/capabilities/CapabilityJourney';
import ServiceGrid from '@/components/sections/solutions/ServiceGrid';
import { capabilities } from '@/content/capabilities';
import PageJsonLd from '@/components/seo/PageJsonLd';
import { createSeoMetadata, type SeoMetadataInput } from '@/lib/seoMetadata';

const seo: SeoMetadataInput = {
  title: capabilities.meta.title,
  description: capabilities.meta.description,
  canonicalPath: '/capabilities/',
};

export const metadata = createSeoMetadata(seo);

// One icon per capability, in `capabilities.groups` order, chosen to read as the
// heading beside it (client revision, 2026-09-30: larger, bolder, matched icons).
const CAPABILITY_ICONS = [
  { Icon: Megaphone, color: 'text-[var(--green-600)]' }, // Generate Demand
  { Icon: FunnelSimple, color: 'text-[var(--steel-600)]' }, // Convert More Opportunities
  { Icon: Headset, color: 'text-[var(--gold-500)]' }, // Serve More Customers
  { Icon: ChartLineUp, color: 'text-[var(--green-600)]' }, // Grow Existing Revenue
  { Icon: Coins, color: 'text-[var(--steel-600)]' }, // Strengthen Cash Flow
] as const;

export default function CapabilitiesPage() {
  return (
    <>
      <PageJsonLd {...seo} />
      <section className="relative isolate overflow-hidden bg-[var(--surface-page)] px-[var(--site-gutter,clamp(1.25rem,5vw,5.5rem))] pb-12 pt-[calc(var(--header-height)_+_2rem)] text-[var(--ink)] sm:pb-14 sm:pt-[calc(var(--header-height)_+_2.5rem)] lg:pb-16">
        <AtmosphereLayer variant="light-network" />
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(197,151,49,0.11),transparent_68%)]" />
        <div className="relative z-10 mx-auto w-full max-w-[1200px]">
          <header className="mx-auto mb-7 max-w-[760px] text-center sm:mb-9">
            <h1 className="mt-3 font-display text-h1 font-medium tracking-[-0.025em] text-[var(--navy-900)]">
              {capabilities.title}
            </h1>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-6">
            {capabilities.groups.map((group, index) => {
              const { Icon, color } = CAPABILITY_ICONS[index];

              return (
                <article
                  key={group.heading}
                  className={`relative flex min-h-36 flex-col justify-start overflow-hidden rounded-xl border border-[var(--border)] bg-white p-5 shadow-[0_8px_28px_rgba(15,27,51,0.045)] sm:min-h-40 sm:p-6 sm:last:col-span-2 sm:last:w-[calc(50%-0.5rem)] sm:last:justify-self-center lg:col-span-2 lg:last:w-auto ${index === 3 ? 'lg:col-start-2' : ''} ${index === 4 ? 'lg:col-start-4' : ''}`}
                >
                  <span aria-hidden="true" className="font-mono text-xs font-medium tracking-[0.14em] text-[var(--gold-text)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="mt-2.5">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] ${color}`}
                      >
                        <Icon size={30} weight="bold" />
                      </span>
                      <h2 className="font-display text-h3 font-medium leading-tight text-[var(--navy-900)]">
                        {group.heading}
                      </h2>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                      {group.services.join(' · ')}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col items-center justify-between gap-4 rounded-xl bg-[var(--navy-900)] px-5 py-5 text-center text-white sm:mt-9 sm:flex-row sm:px-7 sm:text-left">
            <p className="max-w-[52ch] text-sm leading-relaxed sm:text-base">{capabilities.cta}</p>
            <Link
              href="/contact/"
              className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[linear-gradient(135deg,var(--gold-300),var(--gold-500))] px-5 text-sm font-semibold text-[var(--gold-ink)] outline-none transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(197,151,49,0.28)]"
            >
              Request Solution Blueprint
              <ArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
      <ServiceGrid />
      <section className="bg-[var(--surface-page)] px-[var(--site-gutter,clamp(1.25rem,5vw,5.5rem))]">
        <div className="mx-auto w-full max-w-[1200px]">
          <CapabilityApproach />
        </div>
      </section>
      <CapabilityJourney />
    </>
  );
}
