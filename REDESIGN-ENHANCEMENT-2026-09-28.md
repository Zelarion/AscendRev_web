# AscendRev Visual Enhancement: Research and Delivery Checklist

**Prepared:** 28 September 2026
**Purpose:** Continue the visual refresh with deliberate dropdown behavior, section art direction, and restrained motion. This is a working checklist; completion boxes are only checked after verification.

## Client intent captured

- Open the desktop **Solutions** menu on hover and make its hover, focus, and selected states feel considered and premium.
- Keep hamburger navigation on mobile and tablet; laptop/desktop retain visible tabs and may group links when needed.
- Preserve the approved home hero, the existing two-family Newsreader/Rubik typography, Rio's approved copy, and the AscendRev brand palette.
- Do not alter existing live-page wording, claims, descriptions, routes, or page structure unless a user/Rio request directly authorizes that exact change. New wording is allowed inside a clearly new section.
- Improve visual pacing through a small number of selected atmospheric treatments; avoid decorating every section. Keep quiet long-form legal pages and image-led sections calm.
- Add a new section to an existing page (no new route) so the enhancement is visibly additive; preserve the home hero and every existing section's copy.
- Create original assets for sections that benefit from atmospheric art, including transparent decorative artwork where useful. Treat supplied ECA/Native Teams screenshots as design references only; do not reuse their copy, logos, or artwork.
- Use intentional, smooth motion with the already-installed GSAP and Lenis setup. Respect reduced-motion settings; no new dependencies or scroll hijacking.
- Preserve the approved Difference scroll-story and contact-form feedback motion. Add a restrained contact-section scroll entrance without changing its content or submission behavior.
- Extend the existing branded route loader into a first-load asset gate: load the current page's `<img>` elements (including the home gallery), CSS background images, image posters, and web fonts before revealing the page. Keep observing DOM, image-source, stylesheet, class, and inline-style changes until assets settle and the page is stable; cap the wait so a failed asset cannot trap the visitor.
- Build a custom AscendRev SVG motion mark that references the repository's transparent logo asset and animates a few path strokes/nodes. Keep the output inline/local, dependency-free, and compatible with the site's reduced-motion preference. Use the emilkowalski and LottieFiles motion guidance as craft references; read Nakkas' SVG workflow, but do not install a separate runtime when the SVG can be authored and verified directly.

## Reference observations

The supplied ECA screenshots show three useful composition patterns: a light ecosystem section with quiet network/map texture and a clear text-image split; a dark outcomes section with a substantial architectural image; and a light process section with a subtle network field behind a small set of cards. The Native Teams screenshot shows a desktop menu opened beside its trigger as a spacious, high-contrast panel, with clear active-trigger and row states. These are structural cues only; AscendRev uses its own palette, words, marks, and assets.

Earlier live-page research and source notes are recorded in `REDESIGN-RESEARCH-2026-09-28.md`. The current application already includes local Newsreader/Rubik fonts, a responsive mobile sheet, and a reduced-motion-aware GSAP/Lenis provider. Reuse these foundations rather than adding libraries or broadening copy claims.

## Research and design decisions

## Live-copy audit result

- No Rio email or supplied screenshot found in this task's available references authorizes the wording `Founder-led execution | Decades of frontline sales leadership | Dedicated teams`. It was introduced in repository commit `113e83c`; the currently published homepage uses the credential line below, so the code was restored to match the live site:
  `Harvard Certificate in Leadership Excellence - Harvard Business Impact Enterprise | Lean Six Sigma Certified | 100M Dollar Club Recognition | 2X President's Club Award`
- The rendered live-site comparison found four additional differences, all restored to the exact live wording: `Up to 50% Lower Operating Costs`; the Revenue Engine paragraph ending `—backed by more than CAD $1B in generated sales revenue.`; career narrative range `10K to $35M`; and stat label `$10K–$35M CAD Deal Sizes`.
- No other visible body-copy differences were found across the eight audited routes. The new Operating Model section is the only added visible wording and takes its service names from the existing capabilities catalog.
- Static caching is already configured in `public/.htaccess`: HTML is revalidated while static images, fonts, styles, and scripts use a one-year immutable cache. A live HEAD request confirmed the loader logo receives `Cache-Control: public, max-age=31536000, immutable`; no service worker is needed for repeat-visit caching.

1. Keep the working home hero unchanged. Preserve factual copy and the current service/page destinations.
2. Implement a desktop menu that opens when the pointer enters the Solutions control, stays open while the pointer is within the trigger/panel, and closes after leaving with a small grace period. Keep click toggle, keyboard focus/activation, outside-click close, Escape-to-close with focus return, active-route styling, and touch/mobile behavior.
3. Build the menu panel with the existing navy, steel, and gold tokens: a light surface and navy text for clear contrast against the dark header, a fine steel border, restrained gold top/active/focus markers, and a compact shadow. This follows the reference's spacious light-panel composition while retaining AscendRev's own visual language. Avoid introducing a third typeface, excessive blur, or color-only state.
4. Generate a small set of original, copy-safe atmospheric assets: (a) a pale network/territory texture for light sections, (b) a deep navy outcomes texture for dark sections, and (c) a transparent route/node accent. Use them as low-contrast layers so text contrast and supplied photos remain primary.
5. Apply the assets to a few anchor sections only: home Industries and Career Stats, one Solutions section, Capabilities, one Difference section, and the Contact introduction. Leave Values and long-form legal pages on their existing visual treatments.
6. Add a new three-part home section after the revenue-impact section and before Career Stats, using grounded service language and a newly generated transparent illustration. Do not edit existing copy or section order around it.
7. Use existing reveal/stagger primitives or small CSS transitions for entrance/interaction. No layout-size animation, scroll hijack, autoplay decoration, or animation that ignores reduced motion.
8. Keep the existing Difference progress story and contact-submit states intact. Add the contact form entrance with the shared reveal primitive, and make the global loader wait for all page images/background images plus fonts, capped at eight seconds, with a 350ms minimum display and reduced-motion-safe exit.
9. Verify a first load and at least one client-side route change, including a page with a full gallery; confirm all image requests settle before the overlay exits and a failed asset reaches the timeout/error fallback. Check browser cache headers separately from the animation code.

## Acceptance checklist

- [x] The desktop Solutions control has pointer-enter/leave handlers, keyboard focus opening, delayed close, and an inset hover target that keeps the menu open while entering its panel. Focus and pointer code was reviewed; the browser controller did not expose a hover-only action for physical pointer-travel verification.
- [x] Click toggles Solutions; Escape closes and returns focus; clicking outside closes; Tab reaches the submenu destinations. The existing mobile sheet and its breakpoint were not modified.
- [x] The menu uses the existing palette, clear light-panel contrast, a gold active edge, keyboard focus ring, selected route styling, and icon movement.
- [x] The main marketing flow now has a few purposeful image/textured sections; the home hero remains unchanged, and Values/legal pages keep their existing treatments.
- [x] The home hero, current published copy, Newsreader/Rubik typography, and brand palette remain intact.
- [x] The live-copy audit found four source/live mismatches and restored the source to the exact current published wording. The new section's wording is limited to the new home section and service names from the existing capabilities catalog.
- [x] A new section is visibly added to the existing home page; no new route is created.
- [x] Background art is limited to selected anchor sections rather than added to every page/section; Values and legal pages keep their existing visual treatment.
- [x] Generated assets are original, copy-safe, optimized, inspected, and present in the repository paths used by the app. Transparent accents retain alpha.
- [x] The Difference scroll-story still advances between milestones on scroll; the contact submit component is unchanged, the contact page adds a restrained form reveal, and the global logo loader watches page images/backgrounds/posters/fonts and hydration-time DOM/style changes, with an 8-second cap and reduced-motion-safe exit.
- [x] Existing GSAP/Lenis behavior is reused; new motion respects reduced-motion and does not hijack scrolling. The custom SVG uses no new runtime dependency.
- [x] Browser cache behavior is confirmed from `public/.htaccess` and a live loader-logo response; static assets are cached for one year and HTML revalidates. No service worker is needed.
- [x] Production build, typecheck, full `src` ESLint, and diff checks pass. (`npm run lint` itself cannot traverse a restricted `.gstack/` directory, so `npx eslint src` was run directly and passed.)
- [ ] Browser review covers 375, 768, 1024, 1087, 1088, 1366, and 1920 CSS pixels; no horizontal overflow, clipped content, menu collision, or unreadable text. The provided browser controller did not offer viewport emulation; the live local review was at 1904×900 and the 68rem navigation breakpoint was verified in source.
- [ ] Hover-only movement between trigger and panel, mobile/tablet hardware layout, and a forced reduced-motion browser session are still unverified interactively. Click, Tab, Escape, outside-click, desktop rendering, first-load/route loader, Difference scroll story, and contact form rendering were exercised.
- [x] The explicit website staging allowlist excludes unrelated downloaded photos, preview files, and videos; the parent Zelarion repository stays outside the website commit.

## Verification record

- The production static export rendered the boot loader before the page heading. Chrome showed the branded loader on the first page load, then revealed Home after the image/font wait; internal navigation to Difference and Contact showed the route loader and then revealed each page.
- The asset observer continues to collect new DOM images and picture sources, CSS backgrounds, video posters, and font readiness while the page settles; the wait resolves after assets settle and 180ms without relevant DOM changes, or at the 8-second cap.
- The Advantage story showed milestone 01, then advanced to milestone 02 while scrolling. Contact form fields and existing copy rendered; the live submit action was not triggered.
- Click opened the Solutions menu; Tab entered its first submenu link; Escape closed the menu and returned focus to the trigger; clicking outside also closed it. Pointer behavior is confirmed from its handlers but was not simulated by the browser controller.
- `npx eslint src`, `npm run typecheck`, `npm run build`, and `git diff --check` passed. The build exported all 13 static pages.
- Failed-image timeout behavior is covered by the 8-second `Promise.race` code path but was not forced in the browser. The head-bootstrap now fails open at 10 seconds, including when hydration does not complete; asset-scan errors are caught and also release the page.

## Implementation order and falsification

1. Generate and inspect the three requested original artworks; confirm the transparent asset has alpha and all assets are web-sized.
2. Implement the desktop Solutions dropdown and its interaction states without altering the existing mobile breakpoint.
3. Add/reuse a small atmospheric background component and apply it to route-specific sections without changing factual content or the approved home hero.
4. Review the route map and rendered pages against the acceptance checklist; remove any art layer that makes text/photo contrast worse or makes the page feel busy. Keep existing live copy unchanged and check new copy against the approved service scope.
5. Run lint, typecheck, production build, and responsive browser review. Test hover, click, focus, Escape, outside click, mobile sheet, and reduced motion.
6. Verify first-load asset gating, route transitions, loader failure timeout, contact form entry, Difference scroll story, and prefers-reduced-motion before the full build.
7. Inspect the final Git diff and asset list. Stage only reviewed web changes; do not deploy the public site. Push the reviewed change to the site's `main` branch as previously authorized, then report exactly what still needs the user's preview deployment.

## Additive section and storytelling follow-up

**Scope:** Update the Home operating-model section shown by the user; restore the Advantage profile's sticky scroll-story behavior; add one new, clearly separated section to each of `/capabilities`, `/values`, and `/contact`; replace the preloader's linear progress treatment with a continuous branded network animation. Do not edit existing visible wording, existing section order, the contact form behavior, or routes.

### Page-specific intent

- **Home:** Keep the existing operating-model heading, three business-area names, and service labels. Recompose them as connected cards, with restrained motion and a compact band reusing existing brand CTA copy.
- **Advantage:** Preserve the founder profile and three story milestones; make the profile stay pinned while the story column advances, then release naturally at the section end.
- **Capabilities:** Add a visual synthesis of existing capability groups without changing current copy or CTA. Preserve the first three capability cards as-is; center the final two as a balanced second row, and tighten the spacing from the card number to its icon/title to match the user's compact left-side reference.
- **Values:** Add a short editorial close that draws only from the three approved value statements; keep all current value copy verbatim.
- **Contact:** Add a concise enquiry-preparation section aligned with the current form fields; do not change submission, validation, or success/error behavior.
- **Preloader:** Remove the linear loading bar; keep the custom neural/network SVG animation looping. Hard fail open no later than 10 seconds after loader activation, including when a page image never responds or the client bundle does not hydrate.

### Build order and falsification

1. Generate and analyze a distinct design reference for each new section; reuse the already generated Home reference only for the operating-model redesign.
2. Append sections to the existing route components, one route per file boundary; repair the Advantage sticky ancestor separately. Keep animation client-only, visible by default, and reduced-motion-safe.
3. Compare extracted existing copy before/after, then test the Home connector and entry motion, Advantage pinned profile/progress/release, the new route sections at desktop and mobile widths, reduced motion, and Contact form functionality.
4. Run lint, then typecheck and build sequentially, and `git diff --check`. Review route and asset diffs; stage only intentional tracked files and leave unrelated untracked media untouched.

### Acceptance checklist

- [x] Home shows the existing three operating areas as connected cards with intentional motion and an existing-copy CTA band.
- [x] The Advantage profile stays pinned during the milestone story while scrolling.
- [x] `/capabilities`, `/values`, and `/contact` each gain one relevant additive section; existing visible words and form behavior stay unchanged.
- [x] Capability cards keep the first row unchanged, center the two-card second row, and bring the number closer to the icon/title row.
- [x] The loader has no linear progress bar; its branded network motion loops, and a hard 10-second fail-open clears the cover if loading or hydration stalls. The scanner failure path is caught and fails open.
- [x] Production build, TypeScript, source ESLint, and `git diff --check` pass. Responsive browser checks are recorded below; reduced-motion behavior remains unverified.

## Known limits

Reference pages express their own identities; no attempt will be made to reproduce their exact visual assets. Shared-link cache refresh and live-host behavior are external checks and are not validated by local rendering. The viewport-specific browser pass recorded below supersedes the earlier source-only responsive review.

## 2026-09-28 final facilities and asset-resolution follow-up

### Completed in this pass

- [x] The home facilities section has one `Facilities Overview` heading; `View all photos` sits immediately below it.
- [x] The full photo grid has a centered maximum width, balanced three-card rows, and a centered final card at desktop and laptop widths. The scroll-story gallery remains available.
- [x] Portrait campus photographs retain their full frame inside consistent cards; the photo itself is centered and legible instead of stretched or cropped. Advantage-page portrait evidence now uses the original aspect ratio and `object-contain` without a hazy duplicate backdrop.
- [x] Capabilities keeps the five existing capability groups in the top section and uses a distinct, non-repeating enquiry-preparation section below.

### Ultra-HD source-photo checklist

- [ ] Request the original camera exports from Sir Rio (or the photographer) for every factual campus/office photo, ideally 3840px or larger on the long edge. The current supplied originals cannot honestly be described as Ultra HD, and interpolation or generative reconstruction would not restore verified fine detail.
- [ ] Replace each current photo only after receiving the matching original: Home facilities (`ascendrev-campus.webp` 1672×941; `hallway1.jpg` 1206×1608; `ascendrev-training-room.jpg` 1206×664; `ascendrev-boardroom.png` 900×1125; `office4.jpg` 1672×941; `ascendrev-flexible-operations.jpg` 1448×1086; `ascendrev-secure-personal-storage.jpg` 1536×2048), Advantage facilities (`outside1-location-e91e155f.png` 941×1672; `office2.jpg` 900×1600; `hallway2.jpg` 1206×1608), and the other current editorial photos (`ascendrev-sales-dashboard-team.png` 1090×724; `ascendrev-screening-interview.png` 1066×721; `ascendrev-corporate-values-team.png` 1081×723; `rio-vidal-portrait.jpg` 781×721; `solutions-hero.webp` 960×540; `solutions-revenue-funnel.png` 726×754).
- [x] Keep supplied factual photos at their genuine aspect ratios and preserve all details. Brand artwork/background files are separate illustrative assets and remain rendered at their source dimensions.

The working folder now has enough free storage for the local development preview and sequential final checks.

## 2026-09-28 responsive header and scroll verification

- [x] Tested the shared header at CSS layout widths of 255, 360, 410, 767, 1013, 1354, 1908, and 2548px. The document width matched the available layout width at every sample; the mobile tagline appears once, and tablet/desktop artwork carries its integrated tagline without a separate overlay.
- [x] Visually reviewed the header at 255px, 360px, 767px, 1354px, 1908px, and 2548px. The logo lockup remains within the header at narrow mobile, tablet, laptop, desktop, and large-monitor sizes.
- [x] With the pointer outside the facility photo cards, advanced through frames 01–07 one frame per scroll. A downward scroll exited from 07; the next upward scroll re-entered at 07; another upward scroll moved to 06; a downward scroll returned to 07.
- [x] At the values-page footer, the header hid after downward motion and reappeared after an upward scroll of about 88px.
- [x] `npx eslint src`, `npm run typecheck`, `npm run build` (with the configured `NODE_PATH` needed by the external `.next` junction), and `git diff --check` passed. The broad `npm run lint` traversal could not read `.gstack` due to Windows access permissions, so lint was run directly over `src`.
