# AscendRev final website changes

Local implementation checklist for the requested final pass. Production hosting is outside this checklist; BRC Host and cPanel are off-limits.

## Homepage and navigation

- [x] **Home hero:** set “People. Process. Performance.” to the same responsive size and tracking as “SCALABLE TEAMS. REAL IMPACT.”
- [ ] **Facilities gallery:** photo retouch is waiting for an externally generated edit; use the prompt in `docs/design-references/screening-process-imagegen-prompt.md` and return the edited campus photo. The current gallery image has not been altered.
- [x] **Revenue Impact placement:** removed its separate navigation destination and moved the problem/solution section from Home to Solutions.
- [x] **Solutions section order:** removed “The Core Behind Revenue Acceleration” and its funnel image from the route. “Extend Capability. Accelerate Growth.” now leads the moved capability overview.
- [x] **Capabilities page:** moved the nine service cards to Capabilities and placed the Revenue Impact problem/solution section on Solutions.
- [x] **Capabilities image and copy:** added Rio’s AI-enabled copy and cropped the supplied latest-download image for the section; no generated office-tower image is used there.

## Team, difference, contact, and values

- [x] **Screening process:** created a hand-built visual reference and prompt, then made the hiring sequence scroll-led and added “Job Offer” as step seven. Native scroll remains in control; all steps stay in the document for mobile and reduced-motion use.
- [x] **Global split-section layout:** aligned split images left and copy right, stacked image first on narrow screens, and documented the rule in `AGENTS.md`.
- [x] **Our Difference:** tightened the space above Rio’s profile and LinkedIn and brought the operations standard into the leadership story with a link to the detailed commitments.
- [x] **Contact:** moved Rio Vidal’s email, phone, and Calgary head-office details beside “What to Expect” at the top of the page. The hero link now opens the three-step explanation, and the duplicate form link in the story panel is removed.
- [x] **Contact form:** left-aligned the consent copy and policy link.
- [x] **Our Values:** moved the image to the left, stacked the three values in the right column, and added restrained scroll-linked emphasis. Card headings now use the value names alone; the corner numbers remain.
- [x] **Legal pages:** audited Privacy and Terms against source code and official Canadian/Alberta guidance; corrected only statements that did not match and recorded hosting-only checks that remain unverified in `docs/legal-pages-review.md`.

## Verification

- [ ] Check the changed pages at 390×844 (phone), 768×1024 (tablet), 1366×768 (laptop), 1440×900 (desktop), and 1920×1080 (wide desktop); confirm no horizontal overflow or clipped navigation. The available in-app browser review stayed at its default desktop viewport and did not expose device-size controls.
- [x] Confirm all moved sections and internal links resolve to the intended route, and no Revenue Impact nav item remains. The changed routes loaded locally, and the home, footer, and Solutions navigation point to the intended pages.
- [x] Confirm page copy is present in the exported HTML, and the changed scroll emphasis uses reduced-motion-aware styles.
- [x] `npm run typecheck`, targeted ESLint, `npm run build`, route HTTP checks, browser content review, and `git diff --check` passed. Full lint was blocked because `eslint .` cannot read the protected `.gstack` directory.
- [x] Recorded the build and verification lessons in the project memory log.
- [ ] Production storage path, TLS enforcement, SMTP delivery, and hosting permissions remain unverified. Per the user's instruction, BRC Host and cPanel were not accessed; no live enquiry was submitted.
