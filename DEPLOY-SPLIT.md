# Split deployment: pages on Vercel, handler on Render

**Preview only.** Production is a single static export uploaded to AscendRev's
own cPanel account, per `SPEC.md` §1 and `DEPLOY.md`. This split exists so the
client can open the site at any hour without a laptop and a tunnel staying
awake, and still submit the form.

```
Vercel    static pages from `out/`          cannot run PHP
Render    Docker: Apache + PHP              runs the enquiry handler
```

On cPanel both halves sit on one host, the form posts to a relative path, and
none of the cross-origin machinery below applies.

## The one thing that makes this work

Splitting them means the browser posts **cross-origin**, from a `vercel.app`
page to an `onrender.com` endpoint. Two pieces have to line up or every
submission fails while the page looks perfectly healthy.

**The form must know the absolute endpoint.** Set at build time on Vercel:

```
NEXT_PUBLIC_ENQUIRY_ENDPOINT = https://ascendrev-api.onrender.com/api/enquiry.php
```

Unset, it falls back to `/api/enquiry.php`, which on Vercel is a 404.

**The handler must allow the Vercel origin.** Set on Render:

```
ASCENDREV_ALLOWED_HOSTS = ascend-rev.ca,www.ascend-rev.ca,ascendrev-web.vercel.app
```

This is the **Vercel** hostname, not Render's. The browser sends the origin of
the page the form is on. Getting this backwards is the most likely way to spend
an hour on a form that returns 403 with no visible cause.

The handler echoes back only the one origin that passed the allow-list, never a
wildcard, because this endpoint receives names, work addresses and business
detail.

## Vercel, the pages

**New Project**, import `github.com/Zelarion/AscendRev_web`, branch `main`.
Framework detects as Next.js; leave the build command alone.

Under **Environment Variables**, add `NEXT_PUBLIC_ENQUIRY_ENDPOINT` with the
Render URL above. It is read at build time and baked into the bundle, so a
change requires a redeploy, not just a save.

Nothing secret goes to Vercel. It serves static files only.

## Render, the handler

Follow `RENDER.md`. The service is named `ascendrev-api` and is created from
`render.yaml` as a Docker web service, because Render has no native PHP runtime
and its static hosting is a CDN.

The image serves the whole site, not only the handler. That is deliberate: it
costs nothing, it gives a fallback URL where the form is same-origin, and it
keeps the health check simple.

## Verifying, in order

Do these before sending the link to anyone.

**1. The handler answers.**

```bash
curl -i -X OPTIONS https://ascendrev-api.onrender.com/api/enquiry.php \
  -H "Origin: https://ascendrev-web.vercel.app"
```

Expect `204`, plus `Access-Control-Allow-Origin` echoing that exact origin and
`Vary: Origin`.

**2. A wrong origin is refused.**

```bash
curl -i -X OPTIONS https://ascendrev-api.onrender.com/api/enquiry.php \
  -H "Origin: https://evil.example"
```

Expect `403` and **no** allow header. If an allow header appears here, stop:
the allow-list is not being read.

**3. The page points at the right place.** Open the Vercel contact page, view
source or the network tab, and confirm the form posts to the Render URL rather
than to a relative path.

**4. Submit it in a browser.** Not curl. Curl ignores CORS entirely, so it
will pass even when a real browser is blocked. This is the only test that
proves the whole path.

Expect `200` and `{"ok":true,"mailed":true,"recorded":true}`, and an email.

## What differs from production, and why it matters

| | cPanel (production) | This split |
|---|---|---|
| Form endpoint | relative, same origin | absolute, cross-origin |
| CORS | not involved | required on every response |
| Mail | host's own `mail()` | SMTP, since the image has no MTA |
| Lead CSV | survives, it is the safety net | wiped on every deploy |
| Rate limit | 5/hour, real per-visitor | raised, everyone shares one proxy IP |

The CSV difference is the one to keep in mind. On cPanel it exists precisely so
a lead survives a mail failure. On Render the filesystem is ephemeral, so the
emailed copy is the record of truth and the CSV is a convenience.

## When the review ends

Delete both services, delete the Gmail App Password, and deploy the real thing
to cPanel following `DEPLOY.md`. There, `NEXT_PUBLIC_ENQUIRY_ENDPOINT` stays
unset and `ASCENDREV_RATE_LIMIT_MAX` stays unset, so both fall back to the
production defaults.

A stale copy of a client's site on a domain they do not control is a problem
you find out about later.
