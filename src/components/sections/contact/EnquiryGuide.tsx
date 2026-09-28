import type { JSX } from 'react';
import Container from '@/components/layout/Container';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';

const prompts = [
  {
    number: '01',
    title: 'Organization',
    detail: 'Entity name',
    icon: 'organization',
  },
  {
    number: '02',
    title: 'Business contact',
    detail: 'Individual name, business email, and best number to call',
    icon: 'contact',
  },
  {
    number: '03',
    title: 'A place to begin',
    detail: 'Optional comments with a brief description of the help needed, up to 200 characters',
    icon: 'message',
  },
] as const;

type PromptIconName = (typeof prompts)[number]['icon'];

function PromptIcon({ name }: { name: PromptIconName }): JSX.Element {
  if (name === 'organization') {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M12 55V18l20-9 20 9v37M8 55h48" />
        <path d="M23 24h4M37 24h4M23 34h4M37 34h4M28 55V44h8v11" />
        <path d="M19 18h26" />
      </svg>
    );
  }

  if (name === 'contact') {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="9" y="11" width="46" height="42" rx="7" />
        <circle cx="25" cy="27" r="7" />
        <path d="M15.5 45c1.8-6 5-9 9.5-9s7.7 3 9.5 9M40 25h8M40 33h8M40 41h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M10 15a6 6 0 0 1 6-6h32a6 6 0 0 1 6 6v25a6 6 0 0 1-6 6H28L15 55V46a6 6 0 0 1-5-6V15Z" />
      <path d="M21 22h22M21 30h18M21 38h10" />
      <path d="m43 42 9 9M49 40l3-3 5 5-3 3M41 44l-2 7 7-2" />
    </svg>
  );
}

const motionStyles = `
  .enquiry-guide {
    background:
      radial-gradient(ellipse at 8% 70%, rgba(68, 139, 195, .13), transparent 36%),
      radial-gradient(ellipse at 96% 6%, rgba(210, 169, 68, .17), transparent 32%),
      linear-gradient(130deg, #f4f8fc 0%, #fff 52%, #f4f7fb 100%);
  }
  .enquiry-guide::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-image: radial-gradient(rgba(25, 58, 98, .13) .7px, transparent .7px);
    background-size: 26px 26px;
    content: '';
    opacity: .17;
    pointer-events: none;
    mask-image: linear-gradient(90deg, transparent 0%, #000 18%, #000 78%, transparent 100%);
  }
  .enquiry-route {
    stroke-dasharray: 4 9;
    animation: enquiryRouteDrift 18s linear infinite;
  }
  .enquiry-route-node {
    animation: enquiryNodeBreathe 5s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  .enquiry-route-node:nth-of-type(2) { animation-delay: 1.4s; }
  .enquiry-icon-ring { transition: transform 420ms cubic-bezier(.22,1,.36,1), box-shadow 420ms ease; }
  .enquiry-card:hover .enquiry-icon-ring,
  .enquiry-card:focus-within .enquiry-icon-ring {
    transform: translateY(-2px) scale(1.045);
    box-shadow: 0 14px 24px rgba(9, 30, 58, .2);
  }
  .enquiry-card-icon svg {
    width: 2.35rem;
    height: 2.35rem;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.75;
  }
  @keyframes enquiryRouteDrift { to { stroke-dashoffset: -156; } }
  @keyframes enquiryNodeBreathe {
    0%, 100% { opacity: .72; transform: scale(.92); }
    50% { opacity: 1; transform: scale(1.08); }
  }
  @media (max-width: 48rem) {
    .enquiry-route { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .enquiry-route,
    .enquiry-route-node { animation: none !important; }
    .enquiry-card,
    .enquiry-icon-ring { transition: none !important; }
  }
`;

/** A short field guide that mirrors the existing contact form. */
export default function EnquiryGuide(): JSX.Element {
  return (
    <section className="enquiry-guide relative isolate overflow-hidden border-t border-[var(--line)] py-[clamp(3.5rem,7vw,6rem)] text-[var(--ink)]">
      <style>{motionStyles}</style>

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-60"
        viewBox="0 0 1440 700"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M-90 530C160 383 220 631 466 472S808 233 1055 366 1320 450 1520 255" stroke="#6794be" strokeOpacity=".16" strokeWidth="1.5" />
        <path d="M-90 574C157 429 236 671 480 515S819 277 1068 407 1324 488 1520 300" stroke="#bb8b2d" strokeOpacity=".19" strokeWidth="1.5" />
        <circle cx="466" cy="472" r="4" fill="#c49434" fillOpacity=".45" />
        <circle cx="1055" cy="366" r="4" fill="#347db0" fillOpacity=".35" />
      </svg>

      <Container className="relative z-10">
        <RevealOnScroll className="relative grid overflow-hidden rounded-[1.1rem] border border-[#254a74]/25 bg-[linear-gradient(112deg,#0b2141_0%,#133a65_57%,#0d294e_100%)] p-6 text-white shadow-[0_22px_52px_rgba(13,39,70,0.2)] sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end lg:gap-10 lg:p-10">
          <span aria-hidden="true" className="pointer-events-none absolute -right-12 -top-32 h-80 w-80 rounded-full border border-white/10 shadow-[0_0_0_24px_rgba(255,255,255,0.025),0_0_0_48px_rgba(255,255,255,0.02)]" />
          <div className="relative">
            <p className="text-label font-semibold uppercase tracking-[0.2em] text-[#efc85f]">
              A useful starting point
            </p>
            <h2 className="mt-3 max-w-[15ch] font-display text-h2 text-white">
              Set the enquiry in context.
            </h2>
          </div>
          <p className="relative mt-4 max-w-[58ch] text-body leading-relaxed text-slate-200/90 lg:mt-0 lg:justify-self-end">
            Use the form above to share the organization, a business contact, and a brief description of the help needed.
          </p>
        </RevealOnScroll>

        <div className="relative mt-6 sm:mt-8">
          <svg
            aria-hidden="true"
            className="enquiry-route pointer-events-none absolute left-0 top-[3.05rem] z-0 hidden h-16 w-full overflow-visible lg:block"
            viewBox="0 0 1200 80"
            fill="none"
            preserveAspectRatio="none"
          >
            <path d="M35 37C176 37 201 32 362 39S560 51 600 39 827 29 972 39 1094 40 1165 35" stroke="#c69839" strokeOpacity=".68" strokeWidth="1.7" />
            <circle className="enquiry-route-node" cx="362" cy="39" r="6" fill="#f8fbff" stroke="#c69839" strokeWidth="2" />
            <circle className="enquiry-route-node" cx="972" cy="39" r="6" fill="#f8fbff" stroke="#347db0" strokeWidth="2" />
            <circle cx="362" cy="39" r="2" fill="#c69839" />
            <circle cx="972" cy="39" r="2" fill="#347db0" />
          </svg>

          <RevealOnScroll stagger className="relative z-10 grid gap-4 md:grid-cols-3 lg:gap-5">
            {prompts.map((prompt, index) => (
              <article
                key={prompt.number}
                className={`enquiry-card group relative isolate flex min-h-[15rem] flex-col overflow-hidden rounded-[1.05rem] border border-white/75 bg-[linear-gradient(145deg,rgba(255,255,255,.98),rgba(248,251,255,.96))] p-5 shadow-[0_16px_38px_rgba(18,42,70,0.11)] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:border-white hover:shadow-[0_24px_48px_rgba(18,42,70,0.17)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6 ${index === 0 ? '[--prompt-accent:#ae791c] [--prompt-glow:rgba(224,174,65,.2)]' : index === 1 ? '[--prompt-accent:#276da8] [--prompt-glow:rgba(76,157,220,.18)]' : '[--prompt-accent:#087d69] [--prompt-glow:rgba(52,176,146,.17)]'}`}
              >
                <span aria-hidden="true" className="absolute -right-9 -top-12 z-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--prompt-glow),transparent_68%)] transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none" />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="enquiry-icon-ring enquiry-card-icon relative grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-full border border-white bg-[radial-gradient(circle,#fff_0_57%,transparent_59%),linear-gradient(145deg,rgba(255,255,255,.9),var(--prompt-glow))] text-[var(--prompt-accent)] shadow-[0_8px_16px_rgba(10,31,57,.1)]">
                    <span className="absolute inset-0 rounded-full border border-[var(--prompt-accent)]/35" />
                    <span className="absolute inset-[0.35rem] rounded-full border border-[var(--prompt-accent)]/15" />
                    <PromptIcon name={prompt.icon} />
                  </div>
                  <span aria-hidden="true" className="font-display text-[3.7rem] leading-[0.85] tracking-[-0.06em] text-[#18385e]/10 transition-colors duration-300 group-hover:text-[var(--prompt-accent)]/20 motion-reduce:transition-none">
                    {prompt.number}
                  </span>
                </div>

                <div className="relative z-10 mt-5 flex items-center gap-3">
                  <span className="grid h-7 min-w-7 place-items-center rounded-full border border-[var(--prompt-accent)]/30 bg-white px-1.5 font-mono text-[0.68rem] font-bold tracking-[0.08em] text-[var(--prompt-accent)] shadow-sm">
                    {prompt.number}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[var(--prompt-accent)]/55 to-transparent" />
                </div>
                <h3 className="relative z-10 mt-3 font-display text-h3 text-[var(--navy-900)]">
                  {prompt.title}
                </h3>
                <p className="relative z-10 mt-2 max-w-[36ch] text-small leading-relaxed text-[var(--ink-muted)]">
                  {prompt.detail}
                </p>
              </article>
            ))}
          </RevealOnScroll>
        </div>
      </Container>
    </section>
  );
}
