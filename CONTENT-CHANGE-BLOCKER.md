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

## Careers section (requested by Sir Rio, 10 October 2026; exact copy by email, 11 October 2026)

Sir Rio's email "Career Section in our website" (11 October 2026) gives the exact content
and says "No other details / content." The site carries only that:

- A CAREERS tab; the page heading "Careers" and the line "Join our team, grow your career,
  and build your future with us."
- "Ready to grow with us?" as a section heading at the site's subtitle size, followed only
  by the job postings (title, Location, Posted, one line from the posting).
- Each posting's page is his job description document word for word (first posting:
  "Web Career_ Outbound Sales Representative.docx"), with an "Apply for this Job" button.
- The apply screen: attach resume, his four questions in his wording, a Submit button, and
  his automatic response "Thank you for applying. We'll review and reach out when there's
  a right fit." Applications and resumes go to rio.vidal@ascend-rev.ca.

Added by Zelarion for function and law, to confirm with Sir Rio: full name, email and
mobile fields (needed to reply to the applicant), answer options for the years questions,
a Data Privacy Act consent checkbox with 12-month retention, file-type and size messages,
and the posted date (11 Oct 2026, the day the posting went up). Nothing else may be added
to the careers pages without his approval.

Rio's wording edits, 11 October 2026 (chat):

- The role is titled **"Outbound Sales Representatives"** (plural), and his opening line is
  "We are looking for high-performing Outbound Sales Representatives who know how to create
  opportunities, build relationships and move prospects toward a sale." Applied everywhere the
  title or that line appears: the job card, the posting page (heading, About the Role line, page
  title), the apply screen, the structured data and `llms.txt`. By his mark-up of the card, the
  card **title** is underlined and the sentence is not. The URL slug stays singular (contract with `api/careers.php`), and the
  notification email to Rio still names the role in the singular because each email is one applicant.
- The job card's apply control is the **briefcase icon** (top right, also on phones) with the word
  "Apply" under it, instead of a button. Rio asked for it in chat after seeing the icon on desktop;
  Ver confirmed it replaces the button and should be a small animated interaction, not a generic
  button. It opens the apply screen directly. The posting page keeps his "Apply for this Job" button.

## Blocked pending confirmation

- Other meeting-note action items without a matching direct request from Sir Rio.

Remove an item from this list only after Sir Rio specifically approves that change.
