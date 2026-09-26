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
  new-logo.png
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

Before changing `public_html/`, make a backup of the current contents and keep a
copy of the existing holding page outside the document root. Do not delete or
overwrite existing files until that backup is confirmed. Preserve the existing
`.well-known/` and `cgi-bin/` directories; they are part of the cPanel setup and
are not part of this static export.

The cPanel document root configuration is kept one level above `public_html/` in
`ascendrev-enquiry.config.php`. It must never be committed to the repository or
included in the deployment zip. Upload or edit it only in the account-level
location outside the document root.

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
2. **Verify the HTTPS redirect is enabled and keep it enabled.** cPanel reports
   the SSL certificate as Active, and an HTTP browser check must redirect to
   HTTPS. Do not uncomment or disable the redirect during routine publishing.
3. Confirm the hidden `.htaccess` was extracted. In File Manager, enable
   Settings → Show Hidden Files (dotfiles) before inspecting it.
4. Confirm the preserved `.well-known/`, `cgi-bin/`, and holding-page backup are
   still available, and that no pre-existing file was removed without a backup.
5. Load every route in a browser: `/`, `/solutions/`, `/advantage/`, `/contact/`,
   `/privacy/`, `/terms/`, and a made-up URL to confirm the 404 page appears.
6. Check it on a phone, not just a narrow browser window.
7. Test the enquiry handler with a safe no-send `GET` or unsupported-method
   request first. It should return its explicit method response without sending
   mail. Then submit one controlled enquiry and verify outbound SMTP delivery
   and inbox placement for both configured recipients.

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

## Enquiry handler configuration

No environment file of any kind lives in this repository, including a template.
The runtime config is applied through cPanel account configuration instead. The
static export contains `public/api/enquiry.php`; the handler reads the following
keys from the account-level config:

`public/api/enquiry.php` (SPEC.md §6) reads its configuration from the
environment on the cPanel host. The document-root config file is
`ascendrev-enquiry.config.php`, stored one level above `public_html/` and kept
out of the repository and deployment zip:

| Variable | Purpose |
|---|---|
| `ASCENDREV_ENQUIRY_TO` | Two exact recipient addresses for enquiry delivery |
| `ASCENDREV_SMTP_HOST` | `smtp.gmail.com` |
| `ASCENDREV_SMTP_PORT` | `587` |
| `ASCENDREV_SMTP_USER` | Authenticated Workspace Gmail identity |
| `ASCENDREV_SMTP_PASS` | Workspace Gmail app password; never commit or print the value |
| `ASCENDREV_ENQUIRY_FROM` | Sender identity; must align with the authenticated SMTP identity |
| `ASCENDREV_ALLOWED_HOSTS` | `ascend-rev.ca,www.ascend-rev.ca` |

Values are set at deploy time and never written down here, in a ticket, or in
chat. SMTP uses STARTTLS on port 587. There is no cPanel `mail()` fallback. The
credential was accepted by Google locally; after cPanel setup, outbound SMTP
connectivity and recipient inbox placement must still be smoke-checked.

cPanel PHP Selector confirms `ascend-rev.ca` uses PHP 8.2 and has the `openssl`
and `sockets` extensions available. Gmail SMTP fits the requested setup; no
SendGrid or other API alternative is needed.

Storage defaults outside `public_html/`. Keep enquiry records and runtime
secrets out of the public document root and out of the deployment archive.

## Remaining static-site items

- `public/logo.svg`. The header currently uses the client's supplied `new-logo.png`. The
  scalable version is a Zelarion deliverable on this engagement.
- `sitemap.xml` and `robots.txt` (SPEC.md §8), generated in a later pass.
