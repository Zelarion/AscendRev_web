import type { JSX } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import Container from '@/components/layout/Container';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import Stagger from '@/components/ui/Stagger';
import styles from './OperatingModelSection.module.css';

const SERVICE_AREAS = [
  {
    heading: 'Sales & Revenue',
    serviceSummary:
      'Lead generation, data support, outbound sales, appointment setting and inbound sales that move the deals forward. Follow-up and sales development carry through to account management, reactivation, and cross-sell.',
    icon: 'revenue',
  },
  {
    heading: 'Customer Experience',
    serviceSummary:
      'Customer care is available through calls, email, chat and technical help desk.',
    icon: 'experience',
  },
  {
    heading: 'Business Operations',
    serviceSummary:
      'Accounts receivable and collections are managed alongside regular customer follow-up, keeping each open item visible.',
    icon: 'operations',
  },
] as const;

function EngineIcon({
  kind,
}: {
  kind: (typeof SERVICE_AREAS)[number]['icon'];
}): JSX.Element {
  if (kind === 'revenue') {
    return (
      <svg viewBox="0 0 112 112" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="revenue-disc" x1="15" y1="10" x2="93" y2="102" gradientUnits="userSpaceOnUse">
            <stop stopColor="#183966" />
            <stop offset="1" stopColor="#071D3E" />
          </linearGradient>
          <linearGradient id="revenue-gold" x1="31" y1="31" x2="82" y2="82" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F7D875" />
            <stop offset="1" stopColor="#C58D22" />
          </linearGradient>
        </defs>
        <circle cx="56" cy="56" r="53" fill="#F8F5EC" />
        <circle cx="56" cy="56" r="49" fill="url(#revenue-disc)" stroke="#D5B86F" strokeWidth="1.5" />
        <path d="M30 75h53" stroke="#D7E5F6" strokeOpacity=".55" strokeWidth="1.5" />
        <path d="M35 69V57h9v12m7 0V48h9v21m7 0V41h9v28" fill="url(#revenue-gold)" stroke="#F8DB7C" strokeWidth="1.2" />
        <path d="m32 51 16-9 11 4 21-19" stroke="url(#revenue-gold)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <path d="M70 27h10v10" stroke="#F7D875" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <circle cx="48" cy="42" r="2.5" fill="#FFF0B5" />
        <circle cx="59" cy="46" r="2.5" fill="#FFF0B5" />
      </svg>
    );
  }

  if (kind === 'experience') {
    return (
      <svg viewBox="0 0 112 112" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="experience-disc" x1="16" y1="9" x2="96" y2="103" gradientUnits="userSpaceOnUse">
            <stop stopColor="#63B8F3" />
            <stop offset="1" stopColor="#07539A" />
          </linearGradient>
          <linearGradient id="experience-earcup" x1="31" y1="30" x2="82" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF" />
            <stop offset="1" stopColor="#DCEBFA" />
          </linearGradient>
        </defs>
        <circle cx="56" cy="56" r="53" fill="#EFF7FE" />
        <circle cx="56" cy="56" r="49" fill="url(#experience-disc)" stroke="#B9DDF5" strokeWidth="1.5" />
        <path d="M33 58v-5a23 23 0 0 1 46 0v5" stroke="url(#experience-earcup)" strokeLinecap="round" strokeWidth="5" />
        <path d="M33 52h10v22H37a5 5 0 0 1-5-5V57a5 5 0 0 1 5-5Zm46 0H69v22h6a5 5 0 0 0 5-5V57a5 5 0 0 0-5-5Z" fill="url(#experience-earcup)" stroke="#D9EBFA" strokeWidth="1.5" />
        <path d="M75 76c-2 6-8 9-16 9h-4" stroke="#FFF" strokeLinecap="round" strokeWidth="3" />
        <rect x="47" y="81" width="11" height="6" rx="3" fill="#F5D36F" />
        <circle cx="56" cy="53" r="2" fill="#0B558E" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 112 112" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="operations-disc" x1="14" y1="8" x2="98" y2="105" gradientUnits="userSpaceOnUse">
          <stop stopColor="#18A681" />
          <stop offset="1" stopColor="#005343" />
        </linearGradient>
        <linearGradient id="operations-paper" x1="30" y1="26" x2="81" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF" />
          <stop offset="1" stopColor="#DFF4EA" />
        </linearGradient>
      </defs>
      <circle cx="56" cy="56" r="53" fill="#EFF8F5" />
      <circle cx="56" cy="56" r="49" fill="url(#operations-disc)" stroke="#A7D8C9" strokeWidth="1.5" />
      <path d="M32 31h39a3 3 0 0 1 3 3v44H35a3 3 0 0 1-3-3V31Z" fill="url(#operations-paper)" />
      <path d="M41 43h24M41 51h24M41 59h17" stroke="#14836B" strokeLinecap="round" strokeWidth="2.5" />
      <path d="m77 54 2.1 3.2 3.8-.2.6 3.8 3.4 1.7-1.4 3.5 1.4 3.5-3.4 1.7-.6 3.8-3.8-.2-2.1 3.2-3.2-2.1-3.8.2-.6-3.8-3.4-1.7 1.4-3.5-1.4-3.5 3.4-1.7.6-3.8 3.8.2L77 54Z" fill="#F4D26E" stroke="#F9E6A3" strokeLinejoin="round" strokeWidth="1.5" />
      <circle cx="77" cy="67" r="5.2" fill="#0D6D59" stroke="#FFF7D8" strokeWidth="2" />
    </svg>
  );
}

function OperatingIcon({
  kind,
}: {
  kind: 'teams' | 'execution' | 'capacity';
}): JSX.Element {
  if (kind === 'teams') {
    return (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="11" r="4" />
        <circle cx="9" cy="15" r="3" />
        <circle cx="31" cy="15" r="3" />
        <path d="M11 29v-3a9 9 0 0 1 18 0v3H11Z" />
        <path d="M3.5 28v-2a5.5 5.5 0 0 1 8.2-4.8M36.5 28v-2a5.5 5.5 0 0 0-8.2-4.8" />
      </svg>
    );
  }

  if (kind === 'execution') {
    return (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M16 4.5h8l1 4.1c1 .3 2 .8 2.8 1.3l3.8-1.8 4 6.9-3.1 2.9c.1 1.1.1 2.1 0 3.2l3.1 2.9-4 6.9-3.8-1.8c-.9.6-1.8 1-2.8 1.3l-1 4.1h-8l-1-4.1c-1-.3-2-.8-2.8-1.3l-3.8 1.8-4-6.9 3.1-2.9a14 14 0 0 1 0-3.2l-3.1-2.9 4-6.9 3.8 1.8c.9-.6 1.8-1 2.8-1.3l1-4.1Z" />
        <circle cx="20" cy="19.5" r="6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M6 33h29M9 29V20h5v9m4 0V15h5v14m4 0V9h5v20" />
      <path d="m8 16 9-6 6 2 10-8M27 4h6v6" />
    </svg>
  );
}

function ConnectedMark(): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 11v42M30 13c-4-7-14-5-16 1-8 1-10 12-4 16-5 7 0 16 8 16 3 6 10 7 14 3m2-36c4-7 14-5 16 1 8 1 10 12 4 16 5 7 0 16-8 16-3 6-10 7-14 3" />
      <path d="M19 22c4-1 7 1 8 5m-13 9c4-2 8-1 10 3m21-17c-4-1-7 1-8 5m13 9c-4-2-8-1-10 3" />
      <circle cx="32" cy="11" r="2.5" /><circle cx="8" cy="30" r="2.5" /><circle cx="56" cy="30" r="2.5" />
      <circle cx="18" cy="47" r="2.5" /><circle cx="46" cy="47" r="2.5" /><circle cx="32" cy="53" r="2.5" />
    </svg>
  );
}

export default function OperatingModelSection(): JSX.Element {
  return (
    <section
      aria-labelledby="operating-model-heading"
      className={`${styles.section} w-full border-y border-[var(--line)]`}
    >
      <Container className={`${styles.container} !max-w-[1500px]`}>
        <RevealOnScroll as="header" className={styles.intro}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>Capabilities built around your business</p>
            <h2 id="operating-model-heading" className={styles.title}>
              One operating partner.
              <br />
              Three engines for <span>growth.</span>
            </h2>
            <p className={styles.supportingCopy}>
              Fully managed dedicated teams that add capacity to your business — so you
              can scale without having to build every function in-house.
            </p>
          </div>

          <div className={styles.operatingPoints} aria-label="Operating model highlights">
            {([
              ['teams', 'Dedicated Teams'],
              ['execution', 'Managed Execution'],
              ['capacity', 'Measurable Capacity'],
            ] as const).map(([kind, label]) => (
              <div key={kind} className={styles.operatingPoint}>
                <OperatingIcon kind={kind} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <div className={styles.cardField}>
          <svg
            aria-hidden="true"
            className={styles.connector}
            viewBox="0 0 1200 164"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="operating-model-route" x1="0" x2="1">
                <stop offset="0%" stopColor="#BD8721" stopOpacity=".12" />
                <stop offset="50%" stopColor="#BD8721" stopOpacity=".88" />
                <stop offset="100%" stopColor="#BD8721" stopOpacity=".18" />
              </linearGradient>
            </defs>
            <path
              className={styles.route}
              d="M0 86 C90 86 110 98 195 91 S315 66 397 83 S519 103 600 87 S717 66 802 83 S923 104 1003 88 S1114 75 1200 82"
            />
            {[400, 800].map((cx) => (
              <g key={cx} className={styles.routeNode}>
                <circle cx={cx} cy={83} r="8" />
                <circle cx={cx} cy={83} r="2.6" />
              </g>
            ))}
          </svg>

          <Stagger className={styles.cards}>
            {SERVICE_AREAS.map((area, index) => {
              return (
                <article key={area.heading} className={styles.card}>
                  <span className={styles.cardIndex} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className={styles.cardLead}>
                    <span className={styles.iconBadge}>
                      <EngineIcon kind={area.icon} />
                    </span>
                    <div className={styles.cardHeading}>
                      <h3>{area.heading}</h3>
                    </div>
                  </div>
                  <span className={styles.goldRule} aria-hidden="true" />
                  <p className={styles.serviceSummary}>{area.serviceSummary}</p>
                </article>
              );
            })}
          </Stagger>
        </div>

        <RevealOnScroll delayMs={100}>
          <div className={styles.closingBand}>
            <div className={styles.closingLead}>
              <div className={styles.closingMark} aria-hidden="true">
                <ConnectedMark />
              </div>
              <div className={styles.closingHeading}>
                <p>A more capable, connected operation</p>
                <h3>Aligned Teams. Stronger Outcomes.</h3>
              </div>
            </div>
            <div className={styles.closingAction}>
              <p>
                Our sales, customer experience, and business operations teams work
                together as one operating model — giving you the dedicated capacity
                you need to serve customers, drive revenue, and run more efficiently.
              </p>
              <Link href="/capabilities/" className={styles.cta}>
                <span>Explore Our Solutions</span>
                <ArrowRight size={18} weight="regular" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  );
}
