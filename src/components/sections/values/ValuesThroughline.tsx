import type { JSX } from 'react';
import Image from 'next/image';
import Container from '@/components/layout/Container';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import type { CorporateValue } from '@/content/values';

interface ValuesThroughlineProps {
  heading: string;
  teamImage: {
    src: string;
    alt: string;
  };
  values: readonly CorporateValue[];
}

const VALUE_ICONS = ['commit', 'discipline', 'partnership'] as const;
type ValueIconName = (typeof VALUE_ICONS)[number];

function PrincipleIcon({ name }: { name: ValueIconName }): JSX.Element {
  if (name === 'commit') {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M32 7 51 14v15c0 13-8 22-19 28C21 51 13 42 13 29V14L32 7Z" />
        <path d="m23 31 6 6 13-14M22 16.5 32 13l10 3.5" />
      </svg>
    );
  }

  if (name === 'discipline') {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="21" />
        <circle cx="32" cy="32" r="12" />
        <path d="M32 5v7M32 52v7M5 32h7M52 32h7M13 13l5 5M46 46l5 5M51 13l-5 5M18 46l-5 5m19-16 5-7-5-7-5 7 5 7Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M25 23 21 19a9 9 0 0 0-13 13l8 8a9 9 0 0 0 13 0l5-5m5 6 4 4a9 9 0 0 0 13-13l-8-8a9 9 0 0 0-13 0l-5 5m-6 11 16-16m-15 8h14" />
      <circle cx="13.5" cy="25.5" r="2" />
      <circle cx="50.5" cy="38.5" r="2" />
    </svg>
  );
}

const motionStyles = `
  .values-throughline {
    background:
      radial-gradient(ellipse at 12% 100%, rgba(51, 105, 162, .27), transparent 35%),
      radial-gradient(ellipse at 88% 0%, rgba(195, 146, 48, .16), transparent 31%),
      linear-gradient(118deg, #07172f 0%, #102b50 53%, #0b1f3b 100%);
  }
  .values-throughline::before,
  .values-throughline::after {
    position: absolute;
    z-index: -1;
    width: min(48vw, 42rem);
    aspect-ratio: 1;
    border: 1px solid rgba(159, 191, 222, .1);
    border-radius: 50%;
    content: '';
    pointer-events: none;
  }
  .values-throughline::before {
    top: -27rem;
    right: -10rem;
    box-shadow: 0 0 0 2rem rgba(136, 174, 211, .035), 0 0 0 4rem rgba(136, 174, 211, .025);
  }
  .values-throughline::after {
    bottom: -31rem;
    left: -21rem;
    border-color: rgba(219, 174, 79, .14);
    box-shadow: 0 0 0 2rem rgba(219, 174, 79, .03), 0 0 0 4rem rgba(219, 174, 79, .02);
  }
  .values-route {
    stroke-dasharray: 4 10;
    animation: valuesRouteTravel 17s linear infinite;
  }
  .values-route-node {
    transform-box: fill-box;
    transform-origin: center;
    animation: valuesNodeGlow 4.8s ease-in-out infinite;
  }
  .values-route-node:nth-of-type(2) { animation-delay: 1.6s; }
  .values-icon-ring { animation: valuesRingBreathe 6.8s ease-in-out infinite; }
  .values-card:nth-child(2) .values-icon-ring { animation-delay: 1.2s; }
  .values-card:nth-child(3) .values-icon-ring { animation-delay: 2.4s; }
  .values-card:hover .values-icon-ring,
  .values-card:focus-within .values-icon-ring { transform: scale(1.045); }
  .values-card-icon svg {
    width: 2.7rem;
    height: 2.7rem;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
  @keyframes valuesRouteTravel { to { stroke-dashoffset: -168; } }
  @keyframes valuesNodeGlow {
    0%, 100% { opacity: .68; transform: scale(.92); }
    50% { opacity: 1; transform: scale(1.08); }
  }
  @keyframes valuesRingBreathe {
    0%, 100% { filter: drop-shadow(0 5px 7px rgba(3, 14, 29, .12)); }
    50% { filter: drop-shadow(0 10px 14px rgba(3, 14, 29, .2)); }
  }
  @media (max-width: 48rem) {
    .values-route { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .values-route,
    .values-route-node,
    .values-icon-ring { animation: none !important; }
    .values-card,
    .values-card-icon,
    .values-card-icon * { transition: none !important; }
  }
`;

/** The original corporate values, displayed once in the animated card design. */
export default function ValuesThroughline({ heading, teamImage, values }: ValuesThroughlineProps): JSX.Element {
  return (
    <section className="values-throughline relative isolate overflow-hidden border-y border-white/10 pb-[clamp(3.5rem,7vw,6.5rem)] pt-[calc(var(--header-height)+clamp(1.5rem,4vw,3.5rem))] text-white">
      <style>{motionStyles}</style>

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70"
        viewBox="0 0 1440 760"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M-80 584C188 418 218 700 472 527S812 249 1074 381 1337 474 1510 264" stroke="white" strokeOpacity=".08" strokeWidth="1.2" />
        <path d="M-80 632C184 469 249 741 491 571S819 302 1084 425 1339 514 1510 318" stroke="#d8ad4a" strokeOpacity=".16" strokeWidth="1.4" />
        <circle cx="472" cy="527" r="4" fill="#efc75d" fillOpacity=".72" />
        <circle cx="1074" cy="381" r="3" fill="#a9d0ed" fillOpacity=".7" />
      </svg>

      <Container className="relative z-10">
        <div className="grid items-center gap-7 sm:gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <figure className="relative m-0 aspect-[3/2] w-full overflow-hidden rounded-[10px] border border-white/15 bg-white/5 shadow-[0_18px_46px_rgba(0,0,0,0.24)]">
            <Image
              src={teamImage.src}
              alt={teamImage.alt}
              width={1081}
              height={723}
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="block h-full w-full object-cover"
            />
          </figure>
          <header className="text-left lg:pl-2">
            <h1 className="max-w-[18ch] font-display text-h1 text-white">{heading}</h1>
            <span aria-hidden="true" className="mt-6 block h-px w-16 bg-[#e0aa37] sm:mt-8" />
          </header>
        </div>

        <div className="relative mt-[clamp(2.5rem,5vw,4rem)]">
          <svg
            aria-hidden="true"
            className="values-route pointer-events-none absolute left-0 top-[3.15rem] z-0 hidden h-20 w-full overflow-visible lg:block"
            viewBox="0 0 1200 100"
            fill="none"
            preserveAspectRatio="none"
          >
            <path d="M55 58C192 58 177 33 330 44S493 73 600 48 809 29 918 45 1074 62 1145 43" stroke="#e2b348" strokeOpacity=".58" strokeWidth="1.7" />
            <circle className="values-route-node" cx="330" cy="44" r="7" fill="#102b50" stroke="#e7bc53" strokeWidth="2" />
            <circle className="values-route-node" cx="918" cy="45" r="7" fill="#102b50" stroke="#b6d7ef" strokeWidth="2" />
            <circle cx="330" cy="44" r="2.3" fill="#f5d879" />
            <circle cx="918" cy="45" r="2.3" fill="#b6d7ef" />
          </svg>

          <RevealOnScroll stagger className="relative z-10 grid gap-4 lg:grid-cols-3 lg:gap-5">
            {values.map((value, index) => (
              <article
                key={value.number}
                className={`values-card group relative isolate flex min-h-[30rem] flex-col overflow-hidden rounded-[1.05rem] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.99),rgba(242,247,252,0.97))] p-5 text-[var(--ink)] shadow-[0_18px_46px_rgba(0,0,0,0.2)] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:border-white hover:shadow-[0_25px_56px_rgba(0,0,0,0.3)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6 ${index === 0 ? '[--principle-accent:#bd861d] [--principle-halo:rgba(224,170,55,0.2)]' : index === 1 ? '[--principle-accent:#286ca8] [--principle-halo:rgba(83,164,224,0.2)]' : '[--principle-accent:#087f68] [--principle-halo:rgba(49,173,145,0.19)]'}`}
              >
                <span aria-hidden="true" className="absolute -right-6 -top-12 z-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,var(--principle-halo),transparent_68%)]" />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="values-card-icon relative grid h-[5.8rem] w-[5.8rem] shrink-0 place-items-center rounded-full bg-[radial-gradient(circle,#fff_0_57%,transparent_59%),linear-gradient(145deg,rgba(255,255,255,.86),var(--principle-halo))] text-[var(--principle-accent)] drop-shadow-[0_8px_12px_rgba(15,33,56,0.12)] transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none">
                    <span className="values-icon-ring absolute inset-0 rounded-full border border-[var(--principle-accent)]/35" />
                    <span className="absolute inset-[0.42rem] rounded-full border border-[var(--principle-accent)]/15" />
                    <PrincipleIcon name={VALUE_ICONS[index] ?? 'commit'} />
                  </div>
                  <span aria-hidden="true" className="font-display text-[2.7rem] leading-none tracking-[-0.06em] text-[#19385e]/10">
                    {value.number}
                  </span>
                </div>

                <h2 className="relative z-10 mt-5 font-display text-h3 text-[var(--navy-900)]">
                  {value.name}
                </h2>
                <p className="relative z-10 mt-3 font-display text-body-lg italic text-[var(--ink)]">
                  {value.principle}
                </p>
                <p className="relative z-10 mt-3 text-body leading-relaxed text-[var(--ink-muted)]">
                  {value.body}
                </p>
                <p className="relative z-10 mt-4 text-body font-semibold leading-relaxed text-[var(--ink)]">
                  {value.closing}
                </p>
              </article>
            ))}
          </RevealOnScroll>
        </div>
      </Container>
    </section>
  );
}
