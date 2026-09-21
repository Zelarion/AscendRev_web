import type { JSX } from 'react';
import { ReceiptIcon, ShieldCheckIcon, TargetIcon } from '@phosphor-icons/react/dist/ssr';
// `Icon` is Phosphor's own component type. It lives on the `lib` entry point,
// not on `dist/ssr`, which re-exports only the glyphs.
import type { Icon } from '@phosphor-icons/react/lib';
import Section from '@/components/layout/Section';
import Container from '@/components/layout/Container';
import WordReveal from '@/components/motion/WordReveal';
import RevealOnScroll from '@/components/sections/shared/RevealOnScroll';
import type { PillarIcon, PillarsContent } from '@/content/home';

interface PillarsSectionProps {
  content: PillarsContent;
}

/**
 * Content names an icon by meaning; this map is the only place that meaning
 * becomes a specific glyph. Swapping icon libraries is therefore a change to
 * three lines here rather than a change to the copy (DESIGN.md §5).
 * Phosphor, Regular weight, imported per icon so the bundle carries three
 * glyphs and not the family.
 *
 * The `*Icon` spellings are Phosphor's current names. The bare `Receipt` /
 * `Target` forms still resolve but are marked deprecated in the package's own
 * types, so new code uses the current ones. Three earlier call sites in
 * `Header` and `Button` still use the bare form; aligning them is a small
 * follow-up outside this pass.
 */
const PILLAR_ICONS: Record<PillarIcon, Icon> = {
  cost: ReceiptIcon,
  record: TargetIcon,
  accountability: ShieldCheckIcon,
};

const ICON_SIZE = 32; // DESIGN.md §5 tokenises icons at 20 / 24 / 32.

/**
 * The three reasons, as a hairline-divided row.
 *
 * NOT CARDS, ON PURPOSE
 *
 * DESIGN.md §3 singles this section out: it is the one place on the site where
 * the obvious answer is three identical boxes, and three identical boxes is
 * what every competitor's page already looks like. So the three items are
 * rows, divided by full-width rules, laid out as an asymmetric two-column
 * split: the icon and the claim on the left, the argument on the right. The
 * rules run edge to edge, which makes the section read as one structure being
 * subdivided rather than as three objects placed next to each other.
 *
 * The rows are also not identical. Only the first carries a quantified claim,
 * so only the first has the extra line, and the resulting asymmetry is worth
 * more than the tidiness it costs.
 *
 * The heading is the page's one use of `WordReveal`. It is the argument the
 * whole page turns on, and resolving it word by word under the reader's own
 * scroll is the one place that effect means something; applied to every
 * heading it would just be the house style for headings.
 */
export default function PillarsSection({ content }: PillarsSectionProps): JSX.Element {
  return (
    <Section tone="light">
      <Container>
        <div className="max-w-[24ch]">
          <WordReveal as="h2" className="font-display text-h1 text-[var(--ink)]">
            {content.heading}
          </WordReveal>
        </div>

        <RevealOnScroll>
          <p className="mt-6 max-w-[62ch] text-body-lg text-[var(--ink-muted)]">{content.intro}</p>
        </RevealOnScroll>

        <RevealOnScroll
          as="ul"
          stagger
          className="mt-[clamp(3rem,6vw,4.5rem)] border-b border-[var(--border)]"
        >
          {content.items.map((item) => {
            const Icon = PILLAR_ICONS[item.icon];
            return (
              <li
                key={item.heading}
                className="grid grid-cols-1 gap-x-12 gap-y-5 border-t border-[var(--border)] py-[clamp(2rem,4vw,3rem)] md:grid-cols-12"
              >
                <div className="md:col-span-5">
                  <Icon
                    size={ICON_SIZE}
                    weight="regular"
                    aria-hidden="true"
                    className="text-[var(--steel-600)]"
                  />
                  {/* No max-width: the column is already the measure, and
                      capping it further made `text-wrap: balance` break
                      "Built by someone who has carried the number." after
                      four words. */}
                  <h3 className="mt-5 font-sans text-h3 text-[var(--ink)]">
                    {item.heading}
                  </h3>
                </div>

                <div className="md:col-span-7">
                  <p className="max-w-[62ch] text-body text-[var(--ink-muted)]">{item.body}</p>

                  {item.quantifiedClaim && (
                    /*
                     * Rendered exactly as written, flag and all. SPEC.md §7
                     * item 5 keeps this out of the production build until
                     * AscendRev supplies the basis the range is measured
                     * against, and gate 3 is what enforces that. Stripping it
                     * here to make the page ship would defeat the gate, so it
                     * stays and the build stays red until the claim is real.
                     *
                     * `basis` is deliberately not rendered when it is null.
                     * Writing "typical" or "in most cases" in its place would
                     * be inventing the substantiation the register is waiting
                     * for.
                     */
                    <p
                      data-pending-approval={
                        item.quantifiedClaim.pendingApproval ? 'true' : undefined
                      }
                      className="mt-6 max-w-[54ch] font-display text-h3 leading-[1.4] text-[var(--ink)]"
                    >
                      {item.quantifiedClaim.text}
                      {item.quantifiedClaim.basis ? (
                        <span className="mt-2 block text-body text-[var(--ink-muted)]">
                          {item.quantifiedClaim.basis}
                        </span>
                      ) : null}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </RevealOnScroll>
      </Container>
    </Section>
  );
}
