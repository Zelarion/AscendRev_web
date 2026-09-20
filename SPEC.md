# SPEC.md — AscendRev Corp. Website Build

Source of truth: the client's `requirements/website-architecture-proposal.pdf`, dated
September 2026. Where this spec departs from that document, the departure is stated and
the reason given. Nothing is changed silently.

Read with `PRODUCT.md` (who and why) and `DESIGN.md` (the visual system).

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router | Client's stated stack. Static export is first-class. |
| Output | `output: 'export'` | Shared cPanel host. Node exists but is not needed at runtime for four pages, and a Passenger process is one more thing that can fall over. |
| Language | TypeScript, `strict: true` | |
| Styles | Tailwind CSS v4, CSS-first `@theme` | Tokens live in CSS, so `DESIGN.md` maps to one file. |
| Motion | `motion` (v12) | Tree-shakeable, ~18KB for what we use. |
| Icons | `@phosphor-icons/react`, per-icon imports | |
| Fonts | `next/font/google`, self-hosted at build | No third-party request at runtime. |
| Forms | `react-hook-form` + `zod` | Schema validation at the boundary. |
| Form transport | POST to `/api/enquiry.php` on the same cPanel host | See §6. |

`images.unoptimized: true` is required by static export; every image is therefore
pre-sized and pre-compressed at build time rather than on demand.

## 2. Directory layout

```
clients/ascendrev/web/
  PRODUCT.md  DESIGN.md  SPEC.md
  next.config.ts  tsconfig.json  package.json  .gitignore  .gitattributes
  public/
    logo.svg  logo-mark.svg  favicon.ico  og-image.png
    images/                     real photography, once supplied
    api/enquiry.php             copied into out/ at build
  src/
    app/
      layout.tsx  page.tsx  globals.css
      solutions/page.tsx
      advantage/page.tsx
      contact/page.tsx
      not-found.tsx
      privacy/page.tsx  terms/page.tsx
    components/
      layout/    Header  Nav  Footer  SkipLink  Container  Section
      ui/        Button  Field  Select  CheckboxGroup  Tabs  Stat
                 Reveal  Stagger  ImagePlaceholder  Prose
      sections/  Hero  Pillars  Industries  ServiceGrid  LeadershipBlock
                 InfrastructureBlock  ClosingBand  EnquiryForm
    content/     site.ts  home.ts  solutions.ts  advantage.ts  contact.ts  nav.ts
    lib/         cn.ts  motion.ts  useReveal.ts  enquirySchema.ts
```

**All client-facing copy lives in `src/content/*.ts`, typed.** A wording change is one
file, never a hunt through JSX. This matters: the contract allows up to ten revisions.

## 3. Routes and navigation

The architecture document lists nav as `Solutions | Industries | The AscendRev Advantage
| Leadership` but specifies only four pages, and two of those nav items are sections
inside other pages. As written, the nav mixes pages and anchors without telling the user
which is which, and "Leadership" and "The AscendRev Advantage" both point at the same
page.

**Resolved as:**

| Label | Route | Note |
|---|---|---|
| Solutions | `/solutions` | page |
| Industries | `/#industries` | homepage section, scroll-linked |
| Advantage | `/advantage` | contains the Leadership block at `#leadership` |
| Contact | `/contact` | |

Global CTA button, top right, all pages: **Request Outsourcing Blueprint** → `/contact`.
Mobile: full-screen sheet nav, focus trapped, `Esc` closes, CTA pinned at the bottom.

`/privacy` and `/terms` are built from the two documents already prepared and sitting in
`requirements/`. The footer in the client's document links to both, so they must exist
before launch or the footer ships broken.

## 4. Page specs

### 4.1 Homepage `/`

1. **Hero** — navy full-bleed. H1 "Lower Costs. Higher Efficiencies. Accelerate Revenue."
   Subheadline per §7 rewrite. Primary CTA "Build Your Dedicated Team", secondary
   "Run a Cost-Savings Analysis". Both → `/contact`, the secondary passing a query param
   that preselects the analysis intent.
2. **Trust band** — directly below the fold, on navy, hairline-separated. Credential
   line, subject to §7.
3. **Pillars** — off-white. "Stop Burning Capital on Local Turnover." Three items in a
   hairline-divided row, deliberately not cards. Icon, heading, one paragraph.
4. **Industries** `#industries` — navy. Tabbed, five groups per the source document.
   Tabs are real buttons with `role="tab"`, arrow-key navigable, animated underline.
   Panels crossfade. Under reduced motion the underline jumps and panels swap instantly.
   Falls back to a stacked accordion below 768px.
5. **Closing band** — "Ready to Turn Operations Into a Profit Center?" CTA "Schedule Your
   Growth Briefing".

### 4.2 Solutions `/solutions`

1. **Hero** — compact navy. "The Infrastructure Behind Fast-Growing North American
   Enterprises."
2. **Service grid** — the eight functions, verbatim from the source. Flat cards,
   `auto-fit minmax(300px, 1fr)`, 60ms stagger. This is the one legitimate card grid.
3. **"No Warm Bodies"** — off-white, two-column. Hiring standard and screening. Copy
   softened per §7 (the "psychological resilience evaluations" line).
4. **Closing band.**

### 4.3 Advantage `/advantage`

1. **Hero** — compact navy.
2. **Leadership** `#leadership` — the founder block. Portrait left, narrative right.
   Career record presented as a labelled list. **Attribution is explicit**: these are
   Rio Vidal's personal achievements, not the company's. See §7, item 1.
3. **Infrastructure** — the Philippine operations block. **Blocked pending §7, item 3.**
   Until resolved, renders as `ImagePlaceholder` plus copy written in commitment tense.
4. **Closing band.**

### 4.4 Contact `/contact`

Split layout: left is "What to Expect" (the one permitted numbered sequence), right is
the form. Stacks on mobile with the form first, because the form is the purpose.

Fields per the source document: first name, last name, corporate email, company website,
annual revenue, primary bottleneck (multi-select), headcount needed, budget, message.

**Departure — the form is split into two steps.** Step one: name, corporate email,
company, bottleneck. Step two: revenue, headcount, budget. Step one submits on its own.
This was recommended to the client in the requirements checklist and is built this way
unless they say otherwise. Asking for budget up front loses a large share of visitors,
and a partial lead is worth more than a lost one. A progress indicator shows both steps,
and step two can be skipped.

## 5. Component contracts

- **Reveal** — wraps children, applies the scroll reveal. Renders children *visible* by
  default; the hidden-then-shown state is applied only after hydration and only when
  motion is permitted. Takes `delay`, `as`.
- **Stagger** — orchestrates children with a 60ms cascade, capped at 8.
- **ImagePlaceholder** — during the build, every unsupplied image slot renders a bordered
  block stating what belongs there, the aspect ratio, and the minimum resolution. It is
  visible, labelled, and impossible to ship by accident: a build-time check fails the
  production build if any placeholder remains. Non-negotiable, because the alternative is
  launching with grey boxes.
- **Button** — variants `primary` (green), `secondary` (outline on navy), `ghost`.
  Disabled and pending states are real states, not opacity alone.
- **Field** — label above input, always visible. Helper text persistent. Error below,
  `role="alert"`, `aria-describedby` wired.

## 6. The enquiry form

Static export has no server. Data goes to `public/api/enquiry.php`, deployed alongside
the site on the client's own cPanel host.

Why not Formspree or similar: the form collects personal information from people in
Canada. Routing it through a third-party processor adds a party to the client's PIPEDA
obligations and puts their leads in someone else's database. Their own host costs nothing
extra and keeps the data theirs.

The handler must:

- accept POST only, reject everything else;
- validate every field server-side against the same rules as the client (never trust the
  browser), and reject unknown fields rather than passing them through;
- reject free email domains at submit time, matching the stated micro-copy;
- carry a CSRF-resistant token and a honeypot field, and rate-limit by IP;
- deliver to **at least two recipients**, per the recommendation already made;
- append to a local CSV so an enquiry survives a mail failure;
- return JSON, never echo user input back into HTML;
- never log the full submission body anywhere web-reachable.

Recipient addresses come from environment configuration at deploy, not from source.

**Open blocker:** the destination address is unconfirmed, and the address in the client's
document is on the wrong domain. See §7, item 2.

## 7. Content risk register

Zelarion builds the pages; AscendRev owns the claims. These items are flagged in writing
before they are published. Numbered for reference in client correspondence.

**1 — Company achievements that belong to a person, not the company.**
The document has the site saying "we" about "CAD$1B+ in generated B2B sales", the
American Express 100M Dollar Club, a dual President's Award, and Lean Six Sigma
certification. AscendRev Outsourcing Services Corp. was registered on 11 September 2026.
A company that is days old cannot have generated a billion dollars.

These appear to be Rio Vidal's personal career achievements, and as *his* they are
genuinely impressive and specific. Attributed to the company they are a false
representation, and in Canada that is not only a credibility problem: the Competition Act
(ss. 52 and 74.01) prohibits materially false or misleading representations made to
promote a business, and it is judged on the general impression created, not on a literal
reading of each sentence.

**Resolution, pending client confirmation:** attribute to the founder by name.
"Our founder has closed deals from $500K to $35M CAD across Canada and Australia, and
generated over CAD$1B in B2B revenue over his career." Same facts, more specific, and
correct. This is stronger copy, not weaker.

**2 — The contact email is on the wrong domain.**
The document's footer specifies `rio.vidal@ascendrev.ca`. The client's actual domain is
`ascend-rev.ca`, with the hyphen. `ascendrev.ca` does not resolve. Published as written,
every address on the site is wrong and every reply to an enquiry bounces.

**Must be confirmed before build completion.** It also affects the form recipients (§6)
and the structured data (§8).

**3 — Facilities that do not exist yet.**
The document describes "premium and enterprise-grade facilities", "biometric security,
100% backup power, high-speed fiber redundancy", and offices "in premier business
districts", and calls for photographs of them. The client has asked Zelarion to source
images, and suggested taking them from image search.

Two separate problems. Using photographs found online is copyright infringement, and
these are commercial pages, which removes any fair-dealing argument. Using photographs of
*someone else's* offices to represent your own is a misrepresentation to prospective
clients, and it is the specific thing a burned buyer checks.

**Resolution, pending client confirmation:** one of three. Photograph the actual
workspace, whatever it currently is. Or license stock properly and caption it as
representative. Or write the section in commitment tense and drop the photographs until
there is something real to show. Zelarion's recommendation is the third for launch and
the first as soon as space is occupied. The section is built either way; only the assets
and tense change.

**4 — Third-party marks and named institutions.**
"American Express 100M Dollar Club", "Harvard Business Impact", and "Lean Six Sigma" are
other organisations' names and marks. Referring to a genuine award or completed programme
is normally fine; implying endorsement, partnership, or accreditation is not. Zelarion
needs confirmation each is real and held, and the wording stays factual: what was
awarded, by whom, when.

**5 — The 30% to 50% savings claim.**
A specific comparative number invites "compared to what?" Under the Competition Act,
performance claims must rest on adequate and proper testing made before the claim. Add a
basis in the copy, such as against fully loaded local salary at a stated headcount, or
change it to a range described as typical.

**6 — "Psychological resilience evaluations".**
Describing psychological testing of staff raises employment and privacy questions in the
Philippines under the Data Privacy Act, and reads poorly to a Canadian buyer who will
wonder what is being done to the people serving their account. Recommend rewording to
the screening that actually happens.

**7 — The form collects personal information from people in Canada.**
Handled in §6. Requires the privacy policy live at launch, a consent line at the point of
collection, and a stated retention period. The trust micro-copy "Data handled under
executive compliance" means nothing legally; replace it with a plain sentence and a link
to the policy.

**Nothing in items 1 through 6 is published until the client confirms in writing.** Until
then the affected copy renders from `src/content/*.ts` with a `pendingApproval: true`
flag, and the production build fails if any flagged string is still set.

## 8. SEO, metadata, and analytics

Per-page title and description, canonical URLs on `https://ascend-rev.ca`, OpenGraph and
Twitter cards, `sitemap.xml` and `robots.txt` generated at build.
`Organization` and `ProfessionalService` JSON-LD, with `areaServed` Canada — accurate
values only, and no `aggregateRating` without real reviews. No analytics in v1; if added
later it must be cookieless and named in the privacy policy.

## 9. Quality gates

The production build fails if any of these fail. They are checks, not aspirations.

1. `tsc --noEmit` clean, `eslint` clean.
2. No `ImagePlaceholder` in the output.
3. No `pendingApproval: true` content in the output.
4. Every `<img>` has non-empty `alt`, explicit dimensions.
5. Automated axe-core pass on all four routes, zero critical or serious violations.
6. Lighthouse: performance ≥ 95, accessibility 100, best practices ≥ 95, SEO 100.
7. Total JS ≤ 120KB gzipped on the heaviest route.
8. Renders correctly at 375, 768, 1024, 1440, and in landscape.
9. Full page renders with JavaScript disabled.
10. `prefers-reduced-motion: reduce` honoured on every animation.
11. No string matching `ascendrev.ca` without the hyphen anywhere in the output.

## 10. Build order

1. Scaffold, tokens, fonts, layout primitives, Header and Footer. ← **this pass**
2. Content files with the real copy, flagged where §7 applies.
3. Homepage sections.
4. Solutions and Advantage.
5. Contact, form, PHP handler.
6. Legal pages, metadata, quality gates.
7. Real assets, client review, launch.
