# Website Change Blocker

## Approval gate

Treat the website's current copy, content, imagery, typography, and page structure as locked. Change only the exact item Sir Rio specifically requests.

- A screenshot or message with a direct request from Sir Rio authorizes only the named text or highlighted layout issue.
- Meeting notes and their action items are reference material, not authorization to implement every listed task.
- Do not infer new copy, rewrite adjacent content, swap imagery, remove social links, or reflow other sections from general guidance alone.
- Sir Rio specifically approved a sitewide heading/body type hierarchy pass and spacing fixes on the reviewed pages on 2026-09-26. Preserve all existing website copy; this approval covers presentation only.
- Sir Rio's team asked on 2026-10-07 to change the footer office line from "Alabang Office: Alabang Town Centre, Ayala Alabang, Manila Philippines" to "Office locations in Alabang, Cebu and Pampanga Philippines". Only that footer line changed (`site.philippinesOfficesLine`). Not changed, pending confirmation: the Alabang Town Centre sentence in `InfrastructureBlock.tsx`, and JSON-LD still lists only the Alabang office because no Cebu or Pampanga address has been provided.
- If a proposed edit reaches beyond Sir Rio's explicit request, stop that edit, record it here under **Blocked pending confirmation**, and ask for Sir Rio's specific approval before proceeding.

## Non-visible search metadata (founder-approved 2026-10-03)

Zelarion's founder approved changing search and sharing metadata without a
separate client sign-off, because it is SEO work Zelarion is responsible for
and no visible page copy changes. This covers page titles (browser tab, Google
result, link previews), meta descriptions, JSON-LD structured data, icons,
`llms.txt`, and the www-to-bare-domain redirect.

It does not cover any text a visitor reads on the page. Headings, body copy,
buttons, alt text and labels stay locked. Rio's displayed role ("Founder") and
adding Ralph to the site are visible changes and still need Sir Rio's approval.

## Careers section (requested by Sir Rio, 10 October 2026)

Sir Rio asked by chat for a Careers section: open roles posted on the site, advertised on
Facebook, applicants submit a resume and answer five screening questions, applications go
to his mailbox. That request authorizes the new `/careers/` page, one page per open role, a
CAREERS navigation item, and the application form. His five questions are used word for
word. All other careers copy (role summaries, responsibilities, requirements, hiring steps,
FAQ, consent text, 12-month retention) is a DRAFT built only from his message and from facts
already on the site, and must be approved by Sir Rio in the preview before deployment.
Existing pages are unchanged apart from the navigation item.

## Blocked pending confirmation

- Other meeting-note action items without a matching direct request from Sir Rio.

Remove an item from this list only after Sir Rio specifically approves that change.
