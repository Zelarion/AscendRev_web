import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowsClockwise,
  ChatsCircle,
  CurrencyCircleDollar,
  FunnelSimple,
  Target,
} from '@phosphor-icons/react/dist/ssr';
import AtmosphereLayer from '@/components/sections/shared/AtmosphereLayer';
import { capabilities } from '@/content/capabilities';
import { createSeoMetadata } from '@/lib/seoMetadata';

export const metadata = createSeoMetadata({
  title: capabilities.title,
  description:
    'Dedicated sales, customer experience and business operations teams shaped around the capacity your business needs.',
  canonicalPath: '/capabilities/',
});

const CAPABILITY_ICONS = [
  { Icon: Target, color: 'text-[var(--green-600)]', upward: false },
  { Icon: FunnelSimple, color: 'text-[var(--steel-600)]', upward: true },
  { Icon: ChatsCircle, color: 'text-[var(--gold-500)]', upward: false },
  { Icon: ArrowsClockwise, color: 'text-[var(--green-600)]', upward: false },
  { Icon: CurrencyCircleDollar, color: 'text-[var(--steel-600)]', upward: false },
] as const;

export default function CapabilitiesPage() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--surface-page)] px-[var(--site-gutter,clamp(1.25rem,5vw,5.5rem))] pb-12 pt-[calc(var(--header-height)_+_2rem)] text-[var(--ink)] sm:pb-14 sm:pt-[calc(var(--header-height)_+_2.5rem)] lg:pb-16">
      <AtmosphereLayer variant="light-network" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgba(197,151,49,0.11),transparent_68%)]" />
      <div className="relative z-10 mx-auto w-full max-w-[1200px]">
        <header className="mx-auto mb-7 max-w-[760px] text-center sm:mb-9">
          <h1 className="mt-3 font-display text-h1 font-medium tracking-[-0.025em] text-[var(--navy-900)]">
            {capabilities.title}
          </h1>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {capabilities.groups.map((group, index) => {
            const { Icon, color, upward } = CAPABILITY_ICONS[index];

            return (
            <article
              key={group.heading}
              className="relative flex min-h-36 flex-col justify-between overflow-hidden rounded-xl border border-[var(--border)] bg-white p-5 shadow-[0_8px_28px_rgba(15,27,51,0.045)] sm:min-h-40 sm:p-6"
            >
              <span aria-hidden="true" className="font-mono text-xs font-medium tracking-[0.14em] text-[var(--gold-text)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="mt-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] ${color}`}
                  >
                    <Icon size={19} weight="regular" />
                    {upward && (
                      <ArrowUpRight
                        size={11}
                        weight="bold"
                        className="absolute right-1 top-1 rounded-sm bg-[var(--surface)]"
                      />
                    )}
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
  );
}
