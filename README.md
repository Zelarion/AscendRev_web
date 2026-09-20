# AscendRev Corp. — Website

Corporate informational site for AscendRev Outsourcing Services Corp. Built by
Zelarion. Read `PRODUCT.md`, `DESIGN.md`, and `SPEC.md` in this directory before
making changes — they are the authoritative spec and this README does not repeat
them.

## Stack

Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v4 (CSS-first `@theme`
in `src/app/globals.css`), `motion`, `@phosphor-icons/react`, `react-hook-form` +
`zod`. Static export (`output: 'export'`) — no Node server at runtime. Deploys to
shared cPanel hosting at `ascend-rev.ca` (with the hyphen — see `SPEC.md` §7 item 2).

## Commands

```bash
npm install       # install dependencies
npm run dev       # local dev server
npm run build     # static export to out/
npm run lint      # eslint
npm run typecheck # tsc --noEmit
```

## Project structure

```
src/
  app/          routes, layout, globals.css (all design tokens live here)
  components/   layout/ ui/ sections/ — presentational, read tokens, never raw hex
  content/      typed copy — every client-facing string lives here, not in JSX
  lib/          cn(), motion helpers, form schema
```

`src/content/*.ts` is the single place wording changes happen — the contract
allows up to ten revisions, and every one of them should be a content-file diff,
never a hunt through JSX (SPEC.md §2).

## Known open items

These are not bugs in this codebase — they are unresolved client-side facts
tracked in `SPEC.md` §7 (content risk register). Nothing they affect ships until
the client confirms in writing:

- The contact email domain is unconfirmed (§7 item 2) — `src/content/site.ts`
  exports `contactEmail: null` rather than a guessed address.
- Founder career-achievement claims need attribution to the individual, not the
  company (§7 item 1).
- Facility photography cannot be sourced from image search (§7 item 3) — the
  infrastructure section ships as a placeholder in commitment tense until real
  assets exist.

## Deploy

Static export only. `npm run build` produces `out/`; that directory (plus
`public/api/enquiry.php`, copied in at build) is what gets uploaded to the
client's cPanel host. There is no server-side render step and no database.
