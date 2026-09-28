# AscendRev Visual Refresh: Reference Study and Implementation Plan

**Prepared:** 28 September 2026
**Scope:** Visual system and homepage sections below the existing hero. This document records the research and the implementation plan before code changes.

## Constraints from the brief

- Keep the current homepage hero composition, message, and media.
- Use Equity Connect Advisory for cues about positioning, organization, and page-wide consistency; use Native Teams as the typography reference.
- Use no more than two font families and add no UI or animation dependencies.
- Keep every AscendRev navigation destination reachable without compressing long labels beside the CTA.
- Use AscendRev’s supplied photography. Do not reuse the reference sites’ words, images, logos, or distinctive artwork.
- Make layouts intentional at laptop widths as well as large monitors and phones.
- Do not deploy to cPanel/production. Prepare and verify changes for the user’s preview deployment, then push the reviewed web-repository changes to `main`.

## Research method and limits

I inspected both reference pages in the browser on 28 September 2026, including their visible section order and navigation. I reviewed the served stylesheet declarations for the font families. The observations below describe the pages as served at that time; they are not claims about either company’s private brand guidelines. Firecrawl was not callable in this environment, so no Firecrawl extraction was used. I did not download or reuse either reference’s images or other design assets.

## Reference findings

### Equity Connect Advisory

Source: [equityconnectadvisory.com](https://equityconnectadvisory.com/)

- Its header gives the primary links room and separates the “Book a Call” action from navigation.
- The page alternates between a darkened photographic opening, light editorial split sections, a dark comparison, capability groups, a three-step process, team/audience proof, testimonials, a growth visual, and a closing CTA.
- Repeated section headings and short explanatory copy make the long page scannable. The layouts vary by purpose—comparison, capability list, process, and testimonial—rather than repeating one card grid.
- The observed CSS declares Avenir Next with sans-serif fallbacks. The useful lesson is typographic consistency and hierarchy, not a requirement to copy that font.

### Native Teams — Global Payroll Services

Sources: [page](https://nativeteams.com/global-payroll-services), [served stylesheet](https://nativeteams.com/_next/static/chunks/34rcb__c_bl2j.css), [served stylesheet](https://nativeteams.com/_next/static/chunks/3gdtmyh2sexcz.css)

- Its header groups secondary destinations into menus and keeps account/sales actions separate. This pattern handles a long destination list without shrinking all labels into one crowded row.
- The page moves from a direct hero and proof strip into alternating feature explanations, a four-step accordion, differentiators, testimonial/support content, and a closing CTA.
- The served CSS declares Rubik as a variable font across weights. The observed visual uses weight and size contrast for hierarchy. The page also has Inter/system font declarations; this project will use at most two families.
- Its charcoal/pink palette, wording, illustrations, and branded treatments are not part of AscendRev’s design direction.

## AscendRev baseline

The current homepage already has a clear sequence: hero, facilities gallery, three advantage pillars, revenue-impact questions, Rio Vidal’s career metrics, and a closing CTA. Its gallery and client-supplied office/team photographs are useful proof assets. The weaker point is the transition from those assets into repeated white card treatments; the current tokens also resolve display, body, and mono font roles to Times New Roman, so the site lacks the typography contrast described by its own older design notes.

An earlier working copy used inline navigation from 84rem upward and a complete menu sheet below that breakpoint. At ordinary laptop widths, the available row is limited by both the wordmark region and the separate CTA. Browser inspection at 1900px showed the last link nearly touching the CTA. Following Rio’s latest direction, desktop tabs begin at 68rem / 1088px; phone and tablet widths through 1024px keep the hamburger sheet (which remains active below the 1088px desktop breakpoint). The desktop row keeps HOME, OUR DIFFERENCE, OUR VALUES, CONTACT, and the CTA separate. PROBLEM-SOLUTION FRAMEWORK, CAPABILITIES, and REVENUE IMPACT are grouped under the keyboard-accessible “Solutions” dropdown, keeping all seven original destinations available without crowding the CTA.

## Decisions and implementation plan

> **Superseded for the follow-up visual enhancement:** The initial notes below predate Rio's later direction to use selected original atmospheric artwork and add a new section to an existing page. Follow `REDESIGN-ENHANCEMENT-2026-09-28.md` for the current scope, including the section/background limits and copy-preservation audit. The original research observations remain useful as reference analysis.

1. **Typography:** use Newsreader for display headings and Rubik for body/UI text. That is two families; it keeps the existing editorial headline character while adopting the Native Teams reference’s readable, rounded sans. Self-host the Rubik variable font under its SIL Open Font License and add its attribution to the existing font license record. Avoid remote font requests and package changes.
2. **Hero boundary:** preserve the current working-copy hero, including the previously approved tagline treatment. This refresh adds no further changes to `HeroSection.tsx` or `HeroMedia.tsx`; it changes the shared site type tokens so the new font system is consistent.
3. **Section rhythm:** retain the current Gallery → Advantage → Revenue Impact → Career Proof → CTA sequence and existing copy. Use the gallery as the distinctive photographic feature; avoid inserting another stock-like or generated workplace scene.
4. **Career proof:** restyle the existing attributed career metrics as one restrained, dark navy proof band with a clean four-column editorial layout that collapses to two columns and then one on narrow screens. Use hairline separators rather than nested cards, preserving each value and its attribution.
5. **Navigation:** keep the hamburger sheet below 68rem / 1088px, including phone/tablet widths through 1024px; show desktop tabs from 68rem / 1088px upward. Keep HOME, OUR DIFFERENCE, OUR VALUES, CONTACT, and the CTA separate in the row; group Problem-Solution Framework, Capabilities, and Revenue Impact under a keyboard-accessible SOLUTIONS dropdown.
6. **Imagery and dependencies:** retain the seven supplied facility photographs and current gallery behavior. No generated background is needed for this pass: the client’s real facility/team assets already carry the visual story, and another large backdrop would compete with them. Build any decorative proof-band treatment with CSS; add no dependency.

## Additional client-supplied portrait check

The latest Rio portrait download (`c65506f9-941e-4512-aa13-c32314492957.jpg`) is already the asset at `public/images/rio-vidal-portrait.jpg`: both are 781×721 and have the same SHA-256 (`24B73108FE47E8468AD07275C75732DEF847E27AF06FE77F5BF9C12F957BA01F`). `LeadershipBlock.tsx` already renders that asset with `object-contain`, so the requested portrait is present without a duplicate or a second crop.

## Client feedback checklist from the supplied screenshots

This checklist maps the specific page requests in Rio’s screenshots to the implementation. “Complete” means present in the local build; public-link preview and hosting-dependent mail delivery are called out separately below.

- [x] **Local production verification:** `npm run build`, `npm run typecheck`, `npx eslint src`, and `git diff --cached --check` passed. The production export was served in connected Chrome and reviewed at 375px, 768px, 1366px, and 1920px; no horizontal overflow appeared at those widths. The 375px and 768px screenshots show the hamburger; desktop tabs and CTA are visible at 1366px and 1920px. The SOLUTIONS menu opened to the exact PROBLEM-SOLUTION FRAMEWORK, CAPABILITIES, and REVENUE IMPACT routes, and Escape closed it. At 768px, the mobile sheet opened with all seven requested destinations plus the CTA, then closed. At 1024px the hamburger remains; at 1088px desktop tabs begin and the CTA clears the row. All seven gallery items appeared in the accessibility tree; Secure Personal Storage opened in a full-image lightbox with controls and closed. Home, solutions, capabilities, and Rio profile text were checked. The export contains the OG metadata/image, favicon, `llms.txt`, robots, sitemap, and font files; source makes no Google Fonts request and uses Newsreader/Rubik.
- [x] **Navigation:** use HOME, PROBLEM-SOLUTION FRAMEWORK, CAPABILITIES, REVENUE IMPACT, OUR DIFFERENCE, OUR VALUES, CONTACT; keep destination copy/section descriptions intact. Keep the hamburger sheet below 68rem / 1088px (including phone/tablet widths through 1024px). From 1088px, keep HOME, OUR DIFFERENCE, OUR VALUES, CONTACT, and the CTA separate in the desktop row; group PROBLEM-SOLUTION FRAMEWORK, CAPABILITIES, and REVENUE IMPACT under the SOLUTIONS dropdown. Legal links remain in the footer.
- [x] **Hero:** retain the working-copy hero and its “SCALABLE TEAMS. REAL IMPACT.” identity. The redesign adds no hero rewrite.
- [x] **Problem-Solution Framework:** use the requested navigation label and show the complete revenue-funnel illustration without a fixed-height crop.
- [x] **Capabilities:** include Generate Demand, Convert More Opportunities, Serve More Customers, Grow Existing Revenue, and Strengthen Cash Flow with the corresponding colored, original icon treatments; omit the screenshot-highlighted “DEDICATED TEAMS, SHAPED AROUND YOUR NEEDS” line.
- [x] **Revenue Impact / GEO:** retain the home-page anchor, use North American positioning in visible copy, and keep structured `areaServed` at Canada because the project source of truth confirms Canada only.
- [x] **Facilities Gallery:** label it Facilities Overview, provide the all-photos view, keep the seven supplied facility images in consistent cards, include Flexible Operations and Secure Personal Storage, and preserve the gallery’s existing lightbox controls.
- [x] **Our Difference:** show Rio’s latest supplied full portrait, his name, “Co-Founder and President,” and the requested prior organizations below his name; attribute career proof to Rio.
- [x] **Our Values:** use the supplied meeting photo once at the top of the page and show the three values below it.
- [x] **Laptop/mobile image sizing:** cards use bounded responsive layouts and the Secure Personal Storage portrait preserves its whole frame. The local production export was captured at 375px, 768px, 1366px, and 1920px; no horizontal overflow appeared at any target width.
- [x] **Social preview and SEO/GEO setup:** reference the new logo/icon OG preview image; include page metadata, canonical URLs, organization JSON-LD, `robots.txt`, sitemap, and `llms.txt`.
- [ ] **Shared-link preview:** after the preview deployment, validate how the new OG image renders in the intended messaging apps and refresh their caches where needed. Local code cannot clear third-party preview caches.
- [ ] **Contact form email delivery:** verify an end-to-end submission after the hosting provider resolves ticket `MPL-356622` (SMTP delivery on port 587). A successful local build cannot verify the host’s outbound mail policy.
- [ ] **Preview deployment:** deploy this reviewed `main` build to the preview host, then check at 375px, 768px, 1366px, and 1920px and exercise the contact form with a controlled test recipient.

## Files and order

1. Update this note if implementation findings change a decision.
2. Update the shared font loading and font-role tokens in `src/app/layout.tsx` and `src/app/globals.css`; update `FONT-LICENSES.md` and add the self-hosted Rubik font asset.
3. Restyle `src/components/sections/home/CareerStatsSection.tsx` as the proof band.
4. Set the desktop-nav breakpoint to 68rem / 1088px and group the three solution destinations in the dropdown in `src/app/globals.css` and `src/components/layout/Header.tsx`; keep the hamburger sheet below that breakpoint and desktop tabs visible from laptop widths.
5. Run the production build and review the rendered homepage and navigation at 375px, 768px, 1366px, and 1920px. Confirm there is no horizontal overflow, the hero content/media remain intact, the gallery still works, and only the two intended font families are used.
6. Review the complete staged diff, exclude private configuration/backup material, commit only the reviewed web-site work, and push `main`. Do not deploy the live site.

## Falsification checklist

- [x] The current working-copy hero is preserved; this refresh adds no hero structure, copy, or media changes.
- [x] The latest client-supplied Rio portrait is byte-identical to the existing site asset and is already displayed on the leadership section.
- [x] No reference-site image, copy, logo, or distinctive component has been copied.
- [x] Exactly two font families or fewer are requested by the site; local font files load without a third-party request.
- [x] All navigation destinations and the CTA remain reachable at representative laptop and mobile widths; the header does not wrap or collide with the CTA. The 768px sheet exposes all seven full labels; desktop shows tabs plus separate CTA at 1088px, 1366px, and 1920px, with all grouped links in the SOLUTIONS dropdown.
- [x] The metrics remain attributed to Rio Vidal and preserve the approved values and labels.
- [x] Gallery images keep their intended subject framing and the lightbox controls work in the local production export.
- [x] Build succeeds and browser inspection finds no horizontal overflow at 375px, 768px, 1366px, and 1920px.
- [x] Git staging excludes `ascendrev-enquiry.config.php.prelaunch-backup`, the nine unreferenced images, the three unrelated MP4s, and all unrelated Zelarion-root files.

Staging note: nine unreferenced images and three MP4s are intentionally excluded from staging.
