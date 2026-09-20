# PRODUCT.md — AscendRev Corp. Website

## What this is

A four-page corporate informational website for AscendRev Outsourcing Services Corp., a
Calgary-based outsourcing and offshoring company that places dedicated front-office and
back-office teams (sales, support, help desk) with North American businesses, executed
from the Philippines.

Built by Zelarion under a fixed-price website development and services agreement.

**Register: brand.** This site *is* the product. There is no application behind it. Its
only job is to make a skeptical Canadian operations executive believe a young company is
credible enough to book a call with.

## Who it is for

**Primary reader.** A VP of Operations or a founder at a Canadian company with 20 to 500
staff, in construction, energy, logistics, fintech, or professional services. They are
considering offshoring a function they currently staff locally at high cost.

**The scene.** It is 8am in Calgary. They are at a desk with two monitors, coffee going
cold, and they have been forwarded this link by someone on their team. They have been
burned by an offshore vendor before, or they know someone who has. They are scanning for
reasons to disqualify, not reasons to buy. If they stay, they will forward the page to a
CFO who will read it on a phone.

This forces every major decision: light mode (daylight office, printed and forwarded),
high information density (they want specifics, not atmosphere), zero playfulness, and
credibility carried by precision rather than by decoration.

**Secondary reader.** A prospective Philippine employee checking whether the company is
real before applying.

## What the reader must be able to do

1. Understand within eight seconds what AscendRev does and who it is for.
2. Find the specific function they want to outsource, named plainly.
3. Satisfy themselves that a real, accountable human in Canada is behind it.
4. Submit an enquiry without friction.

## Success

A qualified enquiry from a Canadian company, with a corporate email address and a named
bottleneck. Volume is not the metric; one real lead beats fifty tyre-kickers.

## Constraints

- **Static export.** Deploys to shared cPanel hosting at `ascend-rev.ca`. No Node server
  at runtime, no API routes, no database. Node is available on the host as future
  headroom but is deliberately unused for v1.
- **Performance budget.** Must be fast on Canadian mobile networks. Target LCP under 2.0s
  on 4G, CLS under 0.1, total JS under 120KB gzipped.
- **Accessibility.** WCAG 2.2 AA. Non-negotiable: the client sells to enterprises and
  government-adjacent sectors that ask about it.
- **PIPEDA.** The enquiry form collects personal information from people in Canada.
  Form data goes to infrastructure the client controls, never a third-party form service.
- **Content ownership.** AscendRev writes the claims. Zelarion builds the pages. Where a
  claim carries legal risk, Zelarion raises it in writing and does not publish it without
  written confirmation. See `SPEC.md` "Content risk register".

## Brand

Colours are derived from the client's supplied logo, which is the instruction on record:
deep navy `#192B51`, steel blue `#326292`, forest green `#1E5E46`. No external brand
guide exists. Zelarion is producing the scalable logo as part of this engagement.

Voice: plain, specific, unhurried. Numbers where numbers are real. This company is two
weeks old and is selling to people who will assume it is not. Overclaiming is the failure
mode; precision is the antidote.

## Explicitly out of scope for v1

Blog, careers portal, client login, CRM integration, live chat, multi-language, CMS.
