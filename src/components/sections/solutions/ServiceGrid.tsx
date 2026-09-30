import type { JSX } from 'react';
import Image from 'next/image';
import {
  CalendarCheck,
  ClockCountdown,
  CurrencyCircleDollar,
  FunnelSimple,
  Handshake,
  Headset,
  Lifebuoy,
  PhoneOutgoing,
  UserPlus,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import Container from '@/components/layout/Container';
import Section from '@/components/layout/Section';
import AtmosphereLayer from '@/components/sections/shared/AtmosphereLayer';
import { WordReveal } from '@/components/motion';
import Stagger from '@/components/ui/Stagger';
import { solutions, type ServiceId } from '@/content/solutions';
import { stateTransitionStyle } from '@/lib/motion';
import GlyphIcon, { GLYPH_ACCENT_CYCLE } from './GlyphIcon';

// Keyed by `solutions.services.items[].id`. Client revision, 2026-09-30: the thin
// text glyphs were too faint to see, so each service gets a bold icon that matches
// its label. A missing id is a type error, not a blank tile.
const SERVICE_ICONS: Record<ServiceId, Icon> = {
  'lead-generation-data': UserPlus,
  'outbound-sales': PhoneOutgoing,
  'inbound-conversion': FunnelSimple,
  'appointment-setting': CalendarCheck,
  'customer-care': Headset,
  'help-desk': Lifebuoy,
  'account-management': Handshake,
  'after-hours': ClockCountdown,
  'receivables-collections': CurrencyCircleDollar,
};

/** Capability overview and nine-function service list for `/capabilities`. */
export default function ServiceGrid(): JSX.Element {
  const { heading, intro, items, salesDashboardImage } = solutions.services;

  return (
    <Section className="relative isolate overflow-hidden !py-[clamp(3rem,6vw,5rem)]">
      <AtmosphereLayer variant="light-network" />
      <Container className="relative z-10 max-w-none wide-nav:px-10">
        <div className="grid items-center gap-7 lg:grid-cols-2 lg:gap-10 2xl:gap-14">
          <figure className="relative m-0 aspect-[4/3] w-full min-w-0 overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface-band)]">
            <Image
              src={salesDashboardImage.src}
              alt={salesDashboardImage.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </figure>

          <div className="min-w-0 text-left">
            <div className="max-w-[620px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-text)] sm:text-[11px]">
                CAPABILITIES / SERVICES
              </p>
              <WordReveal as="h2" className="mt-3 max-w-[20ch] font-display text-h2">
                {heading}
              </WordReveal>
              <p className="mt-4 text-body-lg text-[var(--ink-muted)] sm:mt-6">
                {intro}
              </p>
            </div>

            <Stagger className="mt-7 grid min-w-0 grid-cols-1 gap-3 min-[640px]:grid-cols-2 2xl:grid-cols-3">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  // Hover deepens the hairline (DESIGN.md §4). No shadow bloom.
                  className="flex min-h-[76px] min-w-0 items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3 transition-[border-color] hover:border-[var(--border-strong)] sm:min-h-[82px] sm:gap-3 sm:p-3.5"
                  style={stateTransitionStyle}
                >
                  <GlyphIcon
                    icon={SERVICE_ICONS[item.id]}
                    accent={GLYPH_ACCENT_CYCLE[index % GLYPH_ACCENT_CYCLE.length]}
                  />
                  <h3 className="ar-service-card-title min-w-0 flex-1 text-left [overflow-wrap:anywhere]">
                    {item.label}
                  </h3>
                </article>
              ))}
            </Stagger>
          </div>
        </div>
      </Container>
    </Section>
  );
}
