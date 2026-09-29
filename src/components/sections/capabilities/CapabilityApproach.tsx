import Image from 'next/image';

/** Approved AI-enabled, human-led capability copy supplied by Rio Vidal. */
export default function CapabilityApproach() {
  return (
    <section
      aria-labelledby="capability-approach-heading"
      className="mt-[clamp(2.5rem,5vw,4.25rem)] grid gap-8 border-y border-[var(--border)] py-[clamp(2rem,4vw,3.5rem)] md:grid-cols-2 md:items-center md:gap-12"
    >
      <figure className="relative m-0 aspect-[3/2] min-w-0 overflow-hidden rounded-lg bg-[#edf5fb]">
        <Image
          src="/images/ascendrev-ai-enabled-human-led.webp"
          alt="AI-enabled, human-led customer service team with holographic workflow and performance dashboards."
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain"
        />
      </figure>

      <div className="max-w-[34rem] text-left">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-text)] sm:text-[11px]">
          AI-Enabled, Human-Led.
        </p>
        <h2
          id="capability-approach-heading"
          className="font-display text-h2 font-medium tracking-[-0.02em] text-[var(--navy-900)]"
        >
          Smarter workflows. Better execution. Measurable results.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-[var(--ink-muted)] sm:text-lg">
          AscendRev integrates AI-powered tools across prospecting, research, customer engagement,
          workflow automation, and performance management—helping our teams work faster, make
          better decisions, and create more opportunities for your business.
        </p>
      </div>
    </section>
  );
}
