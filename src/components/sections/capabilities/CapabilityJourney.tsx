/** Box copy supplied by Rio Vidal, 30 Sep 2026. */
const prompts = [
  {
    number: '01',
    label: 'The work',
    question: 'What needs to get done?',
    detail: 'We understand the work, how it happens today, and what your team is responsible for delivering.',
    icon: 'workflow',
  },
  {
    number: '02',
    label: 'The opportunity',
    question: 'Where can we create more capacity?',
    detail: 'We identify where work slows down, gets missed, or pulls your team away from higher-value priorities.',
    icon: 'context',
  },
  {
    number: '03',
    label: 'The solution',
    question: 'What would better look like?',
    detail: 'We define the desired outcome, then build the right workflow and dedicated team around the work to deliver it.',
    icon: 'outcome',
  },
] as const;

type PromptIconName = (typeof prompts)[number]['icon'];

function PromptIcon({ name }: { name: PromptIconName }) {
  if (name === 'workflow') {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="9" y="11" width="18" height="15" rx="3" />
        <rect x="37" y="38" width="18" height="15" rx="3" />
        <rect x="9" y="38" width="18" height="15" rx="3" />
        <path d="M27 18.5h7a7 7 0 0 1 7 7v5.5M18 26v12M27 45.5h10M32 31l5 5 5-5" />
      </svg>
    );
  }

  if (name === 'context') {
    return (
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="31" r="22" />
        <circle cx="32" cy="31" r="13" />
        <circle cx="32" cy="31" r="4" />
        <path d="M32 5v8M32 49v10M6 31h8M50 31h8" />
        <path d="m44 16 5-5M15 47l5-5M44 46l5 5M15 15l5 5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M13 52V12M13 52h40" />
      <path d="m20 43 9-10 8 6 14-18" />
      <path d="M42 21h9v9" />
      <circle cx="29" cy="33" r="2.5" />
      <circle cx="37" cy="39" r="2.5" />
    </svg>
  );
}

const sectionStyles = `
  .capability-enquiry {
    background:
      radial-gradient(ellipse at 14% 92%, rgba(28, 107, 164, .32), transparent 34%),
      radial-gradient(ellipse at 88% 8%, rgba(190, 143, 43, .16), transparent 33%),
      linear-gradient(125deg, #07172f 0%, #102b50 54%, #081a34 100%);
  }
  .capability-enquiry::before,
  .capability-enquiry::after {
    position: absolute;
    z-index: -1;
    width: min(46vw, 38rem);
    aspect-ratio: 1;
    border: 1px solid rgba(169, 199, 225, .1);
    border-radius: 50%;
    content: '';
    pointer-events: none;
  }
  .capability-enquiry::before {
    top: -27rem;
    right: -13rem;
    box-shadow: 0 0 0 2.25rem rgba(169, 199, 225, .025), 0 0 0 4.5rem rgba(169, 199, 225, .02);
  }
  .capability-enquiry::after {
    bottom: -30rem;
    left: -20rem;
    border-color: rgba(210, 166, 67, .13);
    box-shadow: 0 0 0 2rem rgba(210, 166, 67, .025), 0 0 0 4rem rgba(210, 166, 67, .018);
  }
  .capability-enquiry__route {
    stroke-dasharray: 5 11;
    animation: capability-enquiry-flow 18s linear infinite;
  }
  .capability-enquiry__node {
    transform-box: fill-box;
    transform-origin: center;
    animation: capability-enquiry-pulse 4.4s ease-in-out infinite;
  }
  .capability-enquiry__node:nth-of-type(2) { animation-delay: 1.25s; }
  .capability-enquiry__icon svg {
    width: 2.55rem;
    height: 2.55rem;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }
  @keyframes capability-enquiry-flow { to { stroke-dashoffset: -160; } }
  @keyframes capability-enquiry-pulse {
    0%, 100% { opacity: .7; transform: scale(.92); }
    50% { opacity: 1; transform: scale(1.08); }
  }
  @media (max-width: 48rem) {
    .capability-enquiry__route { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .capability-enquiry__route,
    .capability-enquiry__node { animation: none !important; }
    .capability-enquiry__card,
    .capability-enquiry__icon,
    .capability-enquiry__icon * { transition: none !important; }
  }
`;

/** A concise prompt to help prospects frame an enquiry around real work. */
export default function CapabilityJourney() {
  return (
    <section
      aria-labelledby="capability-enquiry-title"
      className="capability-enquiry relative isolate overflow-hidden border-t border-white/10 px-[var(--site-gutter,clamp(1.25rem,5vw,5.5rem))] py-[clamp(3.75rem,7vw,6.5rem)] text-white"
    >
      <style>{sectionStyles}</style>

      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-70"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M-80 615C145 451 242 746 493 564S834 300 1098 420 1339 493 1515 291" stroke="white" strokeOpacity=".075" strokeWidth="1.3" />
        <path d="M-80 664C153 498 259 792 508 608S850 350 1114 464 1350 538 1515 341" stroke="#ddb34e" strokeOpacity=".16" strokeWidth="1.4" />
        <circle cx="493" cy="564" r="4" fill="#edc85f" fillOpacity=".7" />
        <circle cx="1098" cy="420" r="3" fill="#a9d0ed" fillOpacity=".72" />
      </svg>

      <div className="relative mx-auto w-full max-w-[1200px]">
        <header className="max-w-[760px]">
          <p className="inline-flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#f0c75d]">
            A clear starting point
            <span aria-hidden="true" className="h-px w-9 bg-gradient-to-r from-[#edc45b] to-transparent" />
          </p>
          <h2
            id="capability-enquiry-title"
            className="mt-3 max-w-[17ch] font-display text-[clamp(2rem,4.4vw,3.7rem)] font-medium leading-[1.04] tracking-[-0.035em] text-white"
          >
            Frame the work before the conversation.
          </h2>
        </header>

        <div className="relative mt-8 sm:mt-11">
          <svg
            aria-hidden="true"
            className="capability-enquiry__route pointer-events-none absolute left-0 top-[3.1rem] z-0 hidden h-16 w-full overflow-visible lg:block"
            viewBox="0 0 1200 80"
            fill="none"
            preserveAspectRatio="none"
          >
            <path d="M36 39C175 39 211 27 365 37S558 52 600 39 837 26 986 38 1107 42 1164 34" stroke="#deb246" strokeOpacity=".72" strokeWidth="1.7" />
            <circle className="capability-enquiry__node" cx="365" cy="37" r="6" fill="#102b50" stroke="#edc85f" strokeWidth="2" />
            <circle className="capability-enquiry__node" cx="986" cy="38" r="6" fill="#102b50" stroke="#8fc5e8" strokeWidth="2" />
            <circle cx="365" cy="37" r="2" fill="#edc85f" />
            <circle cx="986" cy="38" r="2" fill="#8fc5e8" />
          </svg>

          <ol className="relative z-10 grid list-none gap-4 p-0 md:grid-cols-3 lg:gap-5">
            {prompts.map((prompt, index) => (
              <li key={prompt.number} className="h-full">
                <article
                  className={`capability-enquiry__card group relative isolate flex h-full min-h-[17.5rem] flex-col overflow-hidden rounded-[1.05rem] border border-white/65 bg-[linear-gradient(145deg,rgba(255,255,255,.99),rgba(242,247,252,.97))] p-5 text-[var(--ink)] shadow-[0_18px_44px_rgba(0,0,0,.2)] transition-[transform,border-color,box-shadow] duration-500 ease-out hover:-translate-y-1.5 hover:border-white hover:shadow-[0_26px_56px_rgba(0,0,0,.3)] motion-reduce:transform-none motion-reduce:transition-none sm:p-6 ${index === 0 ? '[--prompt-accent:#bd861d] [--prompt-halo:rgba(224,170,55,.19)]' : index === 1 ? '[--prompt-accent:#286ca8] [--prompt-halo:rgba(83,164,224,.18)]' : '[--prompt-accent:#087f68] [--prompt-halo:rgba(49,173,145,.17)]'}`}
                >
                  <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 z-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--prompt-halo),transparent_68%)] transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none" />
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <span className="capability-enquiry__icon relative grid h-[5.25rem] w-[5.25rem] shrink-0 place-items-center rounded-full bg-[radial-gradient(circle,#fff_0_57%,transparent_59%),linear-gradient(145deg,rgba(255,255,255,.9),var(--prompt-halo))] text-[var(--prompt-accent)] drop-shadow-[0_8px_12px_rgba(15,33,56,.12)] transition-transform duration-500 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none">
                      <span className="absolute inset-0 rounded-full border border-[var(--prompt-accent)]/35" />
                      <span className="absolute inset-[0.4rem] rounded-full border border-[var(--prompt-accent)]/15" />
                      <PromptIcon name={prompt.icon} />
                    </span>
                    <span aria-hidden="true" className="font-display text-[3.2rem] leading-none tracking-[-0.06em] text-[#19385e]/10">
                      {prompt.number}
                    </span>
                  </div>
                  <div className="relative z-10 mt-5 flex items-center gap-3">
                    <span aria-hidden="true" className="h-[2px] w-9 bg-gradient-to-r from-[var(--prompt-accent)] to-transparent" />
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--prompt-accent)]">
                      {prompt.number} / {prompt.label}
                    </span>
                  </div>
                  <h3 className="relative z-10 mt-3 max-w-[34ch] font-display text-[1.2rem] font-semibold leading-snug text-[var(--navy-900)] sm:text-[1.3rem]">
                    {prompt.question}
                  </h3>
                  <p className="relative z-10 mt-3 max-w-[40ch] text-[0.95rem] leading-relaxed text-[var(--ink-muted)]">
                    {prompt.detail}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 grid gap-5 overflow-hidden rounded-[1.05rem] border border-white/15 bg-[linear-gradient(105deg,rgba(20,57,96,.9),rgba(13,40,75,.88))] p-5 shadow-[0_16px_40px_rgba(0,0,0,.15)] sm:mt-8 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,.78fr)] sm:items-center sm:gap-8 sm:px-7 sm:py-6">
          <div className="flex items-start gap-4 sm:items-center sm:gap-5">
            <span aria-hidden="true" className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#edc85f]/35 bg-[#edc85f]/10 text-[#edc85f] sm:mt-0">
              <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none">
                <path d="M8 34.5h32M12 28l8-8 6 5 11-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="28" r="2.2" fill="currentColor" />
                <circle cx="20" cy="20" r="2.2" fill="currentColor" />
                <circle cx="26" cy="25" r="2.2" fill="currentColor" />
                <path d="M31 13h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-snug text-[#f0c75d] sm:text-xl">
                Start With the Work That Matters
              </p>
              <p className="mt-1.5 max-w-[42ch] text-sm leading-relaxed text-white sm:text-[0.95rem]">
                A process that slows down. An opportunity that goes untouched. Work that keeps pulling your team back in.
              </p>
            </div>
          </div>
          <p className="border-l border-[#edc85f]/55 pl-4 text-sm leading-relaxed text-slate-200 sm:justify-self-end sm:pl-5 sm:text-[0.95rem]">
            Bring us one real example. We&apos;ll examine what&apos;s happening today, where the opportunity lies, and what a better outcome could look like.
          </p>
        </div>
      </div>
    </section>
  );
}
