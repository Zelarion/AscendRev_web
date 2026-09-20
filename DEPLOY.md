# DEPLOY.md — publishing to cPanel

The site is a static export: plain HTML, CSS, JavaScript and fonts. No Node
process runs on the server. Node is available on the hosting plan and stays
unused, kept as headroom for later work.

## Build

```bash
npm ci        # first time, or whenever package-lock.json changes
npm run build
```

Output lands in `out/`. It is git-ignored on purpose — it is a build artifact,
rebuilt from source in seconds, and committing it means every change shows up
twice in the diff.

Before uploading, confirm the build passed its own gates:

```bash
npm run typecheck    # must exit 0
npm run lint         # must be clean
```

## What gets uploaded

Everything **inside** `out/`, not the folder itself. Into `public_html/` on the
cPanel account for `ascend-rev.ca`.

```
out/
  .htaccess            <- easy to miss, see below
  index.html
  404.html
  404/  solutions/  advantage/  contact/  privacy/  terms/
  _next/static/        <- JS, CSS, fonts, all fingerprinted
  logo.png
```

### The two things that go wrong

**1. `.htaccess` is hidden.** cPanel's File Manager does not show dotfiles until
you turn them on: Settings, top right, tick "Show Hidden Files (dotfiles)". If
you drag `out/` across without that, `.htaccess` is silently left behind. The
site still works, because routing does not depend on it, but you lose the custom
404, caching and the security headers.

**2. Uploading the folder instead of its contents.** If `public_html/` ends up
containing an `out` folder, the site lives at `ascend-rev.ca/out/` and the root
shows a cPanel default page.

The fastest reliable method: zip the *contents* of `out/`, upload the single zip
through File Manager, then use Extract. Far quicker than dragging several hundred
small files, and nothing is dropped partway.

## Why URLs have a trailing slash

The build emits `out/privacy/index.html` rather than `out/privacy.html`. Apache
resolves a directory to its `index.html` with no configuration, so `/privacy/`
works on any cPanel account out of the box.

Flat files would need `MultiViews` or a mod_rewrite rule, which means routing
would depend on `.htaccess` surviving. It does not, this way. Canonical URLs in
the page metadata carry the same trailing slash, so the advertised URL is exactly
the one served, with no redirect in between.

## After the first upload

1. **Check AutoSSL has issued a certificate.** cPanel, SSL/TLS Status. It is free
   and automatic. Do not buy the RapidSSL upsell.
2. **Then enable the HTTPS redirect.** Open `.htaccess` and remove the leading
   `# ` from the four lines in the HTTPS block. It ships disabled deliberately:
   forcing HTTPS before a certificate exists redirects every visitor to an
   address the server cannot answer, which takes the whole site down.
3. Load every route in a browser: `/`, `/solutions/`, `/advantage/`, `/contact/`,
   `/privacy/`, `/terms/`, and a made-up URL to confirm the 404 page appears.
4. Check it on a phone, not just a narrow browser window.

## Publishing an update

Rebuild, upload, done. Page HTML is served with `must-revalidate`, so visitors
get new content on their next request. Everything under `_next/static/` is
fingerprinted, so a changed file arrives under a new name and can be cached
permanently without anyone seeing a stale version.

## Local preview of the exact production output

```bash
npm run build
cd out && python -m http.server 8099
```

Then open `http://127.0.0.1:8099/`. This serves the real exported files with
directory-index resolution, which is how Apache behaves, so routing problems show
up here rather than after upload.

## Configuration the enquiry handler needs

No environment file of any kind lives in this repository, including a template.
The variables are listed here by name instead, so there is never a file in the
tree that a careless copy or rename can turn into a real one.

`public/api/enquiry.php` (SPEC.md §6) reads its configuration from the
environment on the cPanel host, set through cPanel rather than from any file
committed here:

| Variable | Purpose |
|---|---|
| `ENQUIRY_RECIPIENT_1` | First address enquiries are delivered to |
| `ENQUIRY_RECIPIENT_2` | Second address, so one failed mailbox never loses a lead |
| `ENQUIRY_CSRF_SECRET` | Signing secret for the form's anti-forgery token |

Values are set at deploy time and never written down here, in a ticket, or in
chat. Both recipient addresses are an open blocker: see SPEC.md §7 item 2, the
address in the client's brief is on a domain that does not resolve.

## Not yet in place

- `public/api/enquiry.php`, the enquiry form handler (SPEC.md §6). Recipient
  addresses are an open blocker, see SPEC.md §7 item 2.
- `public/logo.svg`. The header currently uses the client's supplied PNG. The
  scalable version is a Zelarion deliverable on this engagement.
- `sitemap.xml` and `robots.txt` (SPEC.md §8), generated in a later pass.
