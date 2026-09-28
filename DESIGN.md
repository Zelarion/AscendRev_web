# DESIGN.md — AscendRev Corp.

The visual system. Every value here is a token in `src/app/globals.css`. Components read
tokens, never raw hex.

---

## 1. Colour

Derived from the client's logo, sampled directly from `brand/logo-full.png`.

### Strategy: white-primary (client approved)

The current approved presentation uses white as the primary page surface, with AscendRev
navy and steel blue for brand structure and the header, and the existing gold and green
brand accents for emphasis and calls to action. Lightly tinted bands can separate
sections. Do not force a full-bleed navy treatment or a fixed target percentage of dark
surface area; keep the established palette coherent as sections vary in purpose.

### Tokens

```
--navy-900   #0F1B33   deepest, footer
--navy-800   #192B51   PRIMARY. Logo navy. Hero and band surfaces.
--navy-700   #23406C   raised surface on navy
--steel-600  #326292   logo steel. Links on light, borders on navy.
--steel-400  #6E93BC   muted text on navy
--green-700  #174A37   CTA pressed        (see note)
--green-600  #1E5E46   PRIMARY CTA. Logo green.
--green-500  #286D50   CTA hover
--bg         #FFFFFF   primary page background
--surface    #FFFFFF   cards, form
--band       #F4F7FB   raised, lightly tinted band surface
--band-deep  #EEF2F8   deeper tinted band surface
--gold       #F0D47B / #C89731  existing gold brand accent and CTA treatment
--ink        #111827   body text
--ink-muted  #4B5563   secondary text. 7.0:1 on --bg. Never lighter than this.
--border     #E3E6EB   1px hairline, everywhere
--border-navy rgba(255,255,255,0.14)  hairline on navy surfaces
--danger     #B42318   form errors
--success    #174A37   form success
```

Note: `--green-700` and `--success` are `#174A37`.

### Contrast, verified targets

| Pair | Ratio | Use |
|---|---|---|
| `--ink` on `--bg` | 15.9:1 | body |
| `--ink-muted` on `--bg` | 7.0:1 | secondary |
| `#FFFFFF` on `--navy-800` | 13.4:1 | text on navy |
| `--steel-400` on `--navy-800` | 4.6:1 | muted on navy, large only |
| `#FFFFFF` on `--green-600` | 7.3:1 | CTA label |

Placeholder text uses `--ink-muted`, not a lighter grey. Body text is never below 4.5:1.

### Bans

No cream, sand, beige, bone, or warm-tinted near-white body background. Keep approved
gold and green brand accents. Avoid gradient text, glass effects, and color-only meaning.

---

## 2. Typography

Paired on a contrast axis: editorial serif display against a rounded humanist sans.

- **Display** — `Newsreader Variable` (variable, optical sizing). h1, h2, pull quotes.
- **Body / UI** — `Rubik Variable`, matching the client’s Native Teams typography reference.
- **Utility labels** — Rubik with tracking; do not introduce a third family for monospaced styling.

Use no more than two families: Newsreader Variable for display headings and Rubik Variable
for body/UI and utility labels. Newsreader is loaded from the existing local Fontsource
package; Rubik is self-hosted under `public/fonts/`. Both use local font files with
`display: swap`; the page makes no Google Fonts request.

Keep the Newsreader/Rubik pairing unless the client requests a change. Do not introduce a
third type family.

### Scale

```
display   clamp(2.75rem, 6vw, 4.75rem)   Newsreader 500, tracking -0.03em, lh 1.05
h1        clamp(2.25rem, 4.5vw, 3.5rem)  Newsreader 500, tracking -0.025em, lh 1.1
h2        clamp(1.75rem, 3vw, 2.5rem)    Newsreader 500, tracking -0.02em, lh 1.15
h3        1.25rem                        Rubik 600, tracking -0.01em
body-lg   1.125rem / 1.65                Rubik 400
body      1rem / 1.65                    Rubik 400
small     0.875rem / 1.55                Rubik 400
label     0.75rem / 1.4                  Rubik 500, tracking 0.06em, uppercase
```

Display ceiling is 4.75rem, under the 6rem limit. Letter-spacing floor is -0.03em.
`text-wrap: balance` on h1–h3, `text-wrap: pretty` on paragraphs. Body measure capped at
68ch.

### The eyebrow rule

Small uppercase tracked labels above section headings are a saturated AI tell and are
**banned as a repeating pattern**. The `label` style exists for genuine metadata only:
form field labels, stat units, the footer's SLA line. It never sits above a section
heading. Section hierarchy is carried by size, weight, and the navy/off-white band
alternation instead.

Numbered section markers (01 / 02 / 03) are banned as scaffolding. The one permitted
numbered sequence is the "What to Expect" flow on Contact, because that genuinely is an
ordered process.

---

## 3. Layout

- Container `max-w-[1200px]`, gutters `clamp(1.25rem, 5vw, 4rem)`.
- Prose blocks `max-w-[68ch]`.
- Spacing scale 4px-based: `4 8 12 16 24 32 48 64 96 128`.
- Section vertical rhythm: `clamp(5rem, 10vw, 8rem)` standard, `clamp(7rem, 14vw, 11rem)`
  for hero and closing band.
- Breakpoints `480 / 768 / 1024 / 1280`, plus the desktop navigation onset at
  `68rem / 1088px`. Keep the accessible hamburger sheet below 68rem, including phone
  and tablet widths through 1024px; show desktop tabs from 1088px upward. Mobile-first.
  Verify the layout at laptop and phone widths.
- Flexbox for 1D, Grid for 2D. Responsive grids use
  `repeat(auto-fit, minmax(clamp value, 1fr))` before reaching for a breakpoint.

### z-index scale

```
--z-base 0  --z-sticky 10  --z-dropdown 20  --z-backdrop 30  --z-modal 40  --z-toast 50
```

Never an arbitrary 999.

### On cards

The service grid is the one place an eight-item card grid is the honest affordance, and
even there the cards are flat: `1px solid var(--border)`, `border-radius: 10px`, no
shadow, generous internal padding. **Nested cards are forbidden.** The three-pillar
section on the homepage is deliberately *not* cards — it uses a hairline-divided row so
the page does not become a stack of identical boxes.

Side-stripe borders (a thick coloured `border-left`) are banned outright.

---

## 4. Motion

Motion is part of the build, not decoration applied afterward. The rule: it must express
cause and effect, and the page must be complete and readable with JavaScript disabled.

### Non-negotiable

**Reveals enhance an already-visible default.** Content is never gated behind a class
that a transition later removes. Server-rendered HTML ships visible; the reveal is an
enhancement applied only after hydration confirms motion is wanted. A headless renderer,
a hidden tab, or a failed bundle must still show a complete page.

### Tokens

```
--ease-out-quart  cubic-bezier(0.25, 1, 0.5, 1)
--ease-out-expo   cubic-bezier(0.16, 1, 0.3, 1)
--dur-fast    150ms   hover, focus, press
--dur-base    250ms   state change
--dur-slow    600ms   scroll reveal
--dur-exit    170ms   ~68% of base, exits are faster than entrances
```

No bounce. No elastic. No linear on UI transitions.

### Inventory

| Element | Motion |
|---|---|
| Scroll reveal | `translateY(14px)` + `opacity 0 → 1`, 600ms, ease-out-expo, IntersectionObserver, fires once |
| Grid / list entrance | stagger 60ms per item, capped at 8 items then instant |
| Hero | headline words rise on a 90ms stagger; navy field wipes up behind via `clip-path` |
| Nav | fixed branded header; keep the complete accessible menu sheet below 68rem / 1088px, including phone/tablet widths through 1024px; from 1088px show HOME, OUR DIFFERENCE, OUR VALUES, CONTACT, and a separate CTA, with PROBLEM-SOLUTION FRAMEWORK, CAPABILITIES, and REVENUE IMPACT grouped in the SOLUTIONS dropdown |
| Buttons | `scale(0.98)` on `:active`, background shift 150ms |
| Cards | border colour deepens + `translateY(-2px)`, 200ms. No shadow bloom |
| Industry tabs | animated underline slides between tabs, shared-element style |
| Stat counters | count up once on enter, 900ms, skipped under reduced motion (final value shown) |
| Page transition | View Transitions API crossfade, 200ms. Progressive enhancement only |
| Form | inline validation on blur, error slides down 170ms, submit button spinner |

Animate `transform`, `opacity`, `clip-path`, and `filter` only. Never `width`, `height`,
`top`, or `left`. `will-change` only on elements actively animating.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` is mandatory and is a real alternative, not a
blanket `animation: none`. Reveals become instant, counters show their final value,
the hero renders in place, the tab underline jumps rather than slides.

---

## 5. Iconography and imagery

- **Icons: Phosphor Icons, Regular weight**, imported per-icon so the bundle stays small.
  One family, one stroke weight, sizes tokenised at 20 / 24 / 32. No emoji anywhere, in
  markup, copy, or alt text.
- **Photography.** Desaturated, cool-leaning, never oversaturated stock. Real photographs
  of real people and places only. During the build, every image slot renders a labelled
  placeholder component stating exactly what belongs there and at what aspect ratio.
- **Every image** ships `width`, `height`, explicit `aspect-ratio`, `loading="lazy"`
  below the fold, and descriptive alt text. Format AVIF with WebP fallback.

**Standing constraint on imagery:** no photograph may be used that depicts a facility,
team, or workplace that is not AscendRev's own, or that is not properly licensed. This is
recorded in the content risk register and is not a stylistic preference.

---

## 6. Accessibility floor

Visible focus ring `3px solid var(--steel-600)` with `2px` offset, and a light ring on
navy surfaces. Never removed. Skip link to main. Sequential headings, no level skipped.
Touch targets 44×44 minimum with 8px separation. Form inputs have real `<label>`
elements, not placeholder labels. Errors sit below their field, are announced via
`role="alert"`, and focus moves to the first invalid field on submit. Semantic landmarks
throughout. Full keyboard operation, tab order matching visual order.

---

## 7. Conflicts resolved

Three skills informed this system and they disagreed. Recorded so the decisions are not
silently re-litigated later.

1. **Warm off-white canvas** (minimalist-ui) vs **warm near-white is the 2026 AI tell**
   (impeccable). Resolved for impeccable: the canvas is `#FCFCFD`, tinted toward navy,
   not toward warmth. Kept from minimalist-ui: flat surfaces, 1px hairlines, near-absent
   shadows, macro whitespace.
2. **Navy + blue CTA** (ui-ux-pro-max) vs **category-reflex check** (impeccable).
   Resolved for impeccable: navy is kept because the client asked for it and it is in
   their logo, but it is committed as a full surface rather than used as an accent, and
   the CTA is the logo's green. Kept from ui-ux-pro-max: the section order, the
   accessibility floor, and the trust-and-authority conversion pattern.
3. **Lucide / Heroicons** (ui-ux-pro-max) vs **Phosphor** (minimalist-ui). Resolved for
   Phosphor. Both skills actually require the same thing — consistent SVG, never emoji —
   and Phosphor satisfies that while being less visually generic.
