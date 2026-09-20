# DESIGN.md — AscendRev Corp.

The visual system. Every value here is a token in `src/app/globals.css`. Components read
tokens, never raw hex.

---

## 1. Colour

Derived from the client's logo, sampled directly from `brand/logo-full.png`.

### Strategy: committed

Navy is not an accent on a white page. Navy **carries whole sections** as a full-bleed
surface (hero, the proof band, the closing CTA, the footer) — roughly 35% of total
surface area. The page alternates between navy and off-white bands. Green appears on
primary CTAs only, and nowhere else.

**Why this and not the obvious answer.** Navy + white + blue CTA is what anyone would
guess for a corporate outsourcing firm; it is the first training-data reflex and it looks
like every competitor. Green is already in the client's logo, gives the highest-contrast
pairing available inside their own identity, and carries the growth meaning the copy is
reaching for. It is also defensible in a review: it came from their file.

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
--bg         #FCFCFD   body. True off-white, chroma ~0.003 toward navy.
--surface    #FFFFFF   cards, form
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

No cream, sand, beige, bone, or warm-tinted near-white body background. No gold. No
gradient text. No glassmorphism. No colour-only meaning.

---

## 2. Typography

Paired on a contrast axis: editorial serif display against a humanist technical sans.

- **Display** — `Newsreader` (variable, optical sizing). h1, h2, pull quotes.
  Serif buys institutional permanence, which is exactly what a two-week-old company
  needs and what its Poppins-and-Inter competitors do not have.
- **Body / UI** — `IBM Plex Sans`. Humanist, engineered, credible. Not Inter, not Roboto,
  not Open Sans.
- **Mono** — `IBM Plex Mono`. Stats, form labels, field micro-copy, footer meta.

Self-hosted via `next/font/google` so there is no render-blocking request to Google and
no third-party call from a PIPEDA-scoped page. `display: swap`.

**Fallback if the client rejects the serif:** IBM Plex Sans alone across the full weight
range, 300 to 700. Do not substitute a second sans.

### Scale

```
display   clamp(2.75rem, 6vw, 4.75rem)   Newsreader 500, tracking -0.03em, lh 1.05
h1        clamp(2.25rem, 4.5vw, 3.5rem)  Newsreader 500, tracking -0.025em, lh 1.1
h2        clamp(1.75rem, 3vw, 2.5rem)    Newsreader 500, tracking -0.02em, lh 1.15
h3        1.25rem                        Plex Sans 600, tracking -0.01em
body-lg   1.125rem / 1.65                Plex Sans 400
body      1rem / 1.65                    Plex Sans 400
small     0.875rem / 1.55                Plex Sans 400
label     0.75rem / 1.4                  Plex Mono 500, tracking 0.06em, uppercase
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
- Breakpoints `480 / 768 / 1024 / 1280`. Mobile-first. Verified at 375px.
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
| Nav | sticky, solid navy at all scroll positions; hairline bottom border fades in past 80px, 250ms |

The nav was originally specified as transparent over the hero. That only works
above a navy hero: on `/privacy`, `/terms` and the 404 the white nav text sits on
the off-white band and disappears until the reader scrolls. The hero band is
`--navy-800` anyway, so a solid navy header looks identical there and the failure
mode goes away. Changed during the foundation pass.
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
