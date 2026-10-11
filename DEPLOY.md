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
  404/  solutions/  capabilities/  advantage/  values/  contact/  privacy/  terms/
  robots.txt  sitemap.xml
  _next/static/        <- JS, CSS, fonts, all fingerprinted
  new-logo.png
```

`src/app/robots.ts` and `src/app/sitemap.ts` generate `robots.txt` and
`sitemap.xml` in `out/` with every build. They are included in each deployment.

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
5. Load every route in a browser: `/`, `/solutions/`, `/capabilities/`,
   `/advantage/`, `/values/`, `/contact/`, `/privacy/`, `/terms/`, and a made-up
   URL to confirm the 404 page appears.
6. Check it on a phone, not just a narrow browser window.
7. Test the enquiry handler with a safe no-send `GET` or unsupported-method
   request first. It should return its explicit method response without sending
   mail. Then submit one controlled enquiry and verify outbound SMTP delivery
   and inbox placement for both configured recipients.

## Search indexing and social previews after deployment

1. Open `https://ascend-rev.ca/robots.txt` and
   `https://ascend-rev.ca/sitemap.xml`; confirm both load and the sitemap lists
   only the eight public routes above.
2. In Google Search Console, verify the domain if needed, submit
   `https://ascend-rev.ca/sitemap.xml`, then use URL Inspection to request a
   recrawl of the home page and any newly changed public pages. Google controls
   crawl timing and inclusion.
3. In Bing Webmaster Tools, verify the site if needed and submit the same
   sitemap URL. Resubmit after future URL or sitemap changes.
4. For a changed link card, use Meta's Sharing Debugger to refresh the cached
   URL and inspect the new title, description, and image. WhatsApp can retain
   previously fetched cards; after the refresh, send the link in a new chat and
   make sure link previews are enabled in the sender's WhatsApp settings.
5. Optional: configure IndexNow in Bing Webmaster Tools. The site owner must
   create the key, publish its verification file at the site root, and submit
   URLs using that key. Keep the key private and out of Git and public page
   source. This build does not submit URLs to search engines automatically.
6. Optional: validate the Organization/ProfessionalService JSON-LD with
   Google's Rich Results Test or Schema Markup Validator after upload. Structured
   data helps crawlers understand the business; it does not guarantee a rich
   result or AI citation. The included `llms.txt` is an emerging convention,
   not a ranking control.

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

### Delivery retry cron

The handler answers the visitor as soon as the enquiry is saved to
`enquiries.csv` and its delivery-state file, then sends the email in the
background over one SMTP session. If that attempt does not reach both
recipients (Gmail slow or refusing a connection, one mailbox rejecting), nothing
is lost: the row is on disk and a cron job finishes the delivery. Without the
cron job, a failed first attempt is never retried.

In cPanel, open **Cron Jobs**, add a job that runs every five minutes, and use
this command, replacing `ACCOUNT` with the cPanel account's home directory name:

```
*/5 * * * * /usr/local/bin/php /home/ACCOUNT/public_html/api/enquiry.php retry >/dev/null 2>&1
```

- The binary must be the PHP **CLI**, version 8.2. php-cgi (which some cPanel
  wrappers such as `/usr/local/bin/ea-php82` resolve to) drops the `retry`
  argument, so the job would run and silently do nothing. If
  `/usr/local/bin/php` is not 8.2 on this host, use the 8.2 CLI directly:
  `/opt/cpanel/ea-php82/root/usr/bin/php` on EasyApache, or
  `/opt/alt/php82/usr/bin/php` on CloudLinux. The host can confirm which.
- **Check it is running.** Every run rewrites `ascendrev-enquiries/retry-heartbeat`
  above `public_html/`. Ten minutes after adding the job, its modified time in
  File Manager should be within the last five minutes. If it is missing or
  stale, the command path is wrong.
- `retry` only works from the command line. Requesting the same URL in a browser
  still behaves as the normal form endpoint.
- Each unfinished submission is retried with a growing wait (2, 4, 8 minutes and
  so on, capped at one hour). Only recipients that have not yet received the
  email are sent it, so nobody gets a duplicate. After 8 attempts in total (the
  first one is the web request) the submission is marked abandoned and the log
  records `delivery_abandoned attempts=8`; the lead is still in `enquiries.csv`
  for a person to follow up.
- A submission whose web request is still delivering is skipped and picked up on
  a later run, so the cron job and a live request never send at the same time.
- Watch `ascendrev-enquiries/enquiry.log` above `public_html/`. `delivery_attempt`
  lines show how many recipients were reached and how long the attempt took.
  `smtp_failed stage=... code=... enhanced=...` names the step that failed and
  the server's reply code, for example `stage=auth code=535` for a rejected
  app password. The log never contains the password, the username, recipient
  addresses or anything the visitor typed.
- `ASCENDREV_SMTP_CAFILE` and `ASCENDREV_RETRY_MIN_AGE_SECONDS` exist for the
  local test harness in `tests/enquiry/` only. Do not set them on the host.

## Careers application handler

`public/api/careers.php` takes job applications (a form plus a resume) and works
like the enquiry handler: it saves the application first, shows the applicant
Rio's thank-you message, then emails the recruiting mailbox in the background
with the resume attached and a reference such as `AR-3F9A1C`. It shares its code with the enquiry handler
through `public/api/lib/handler-core.php`.

**Upload the whole `api/` folder, including `api/lib/` and its hidden
`.htaccess`.** `careers.php` and `enquiry.php` both stop working without
`public_html/api/lib/handler-core.php`. `lib/.htaccess` (`Require all denied`)
keeps the shared code from being served; turn on "Show Hidden Files" in File
Manager to confirm it arrived. `public_html/api/.user.ini` (upload limits, see
below) is hidden too.

### Config keys

Add to `ascendrev-enquiry.config.php`, one level above `public_html/`, next to the
existing keys. Values are never written down in this repository.

| Key | Purpose |
|---|---|
| `ASCENDREV_CAREERS_TO` | Required. The recruiting mailbox. One address is enough; several can be comma separated. Empty means applications are saved but not emailed, and the form answers 500 until it is set. |
| `ASCENDREV_CAREERS_STORAGE` | Optional. Defaults to `ascendrev-applications/` above `public_html/`. |
| `ASCENDREV_CAREERS_RATE_LIMIT_MAX` | Optional. Applications per IP per hour, default 5. Leave unset on cPanel. |
| `ASCENDREV_CAREERS_RETENTION_DAYS` | Optional. Days before `purge` deletes an application and its resume, default 365. |

SMTP settings, the sender (`ASCENDREV_ENQUIRY_FROM`) and `ASCENDREV_ALLOWED_HOSTS`
are shared with the enquiry form and need no new keys. The applicant gets no
automatic acknowledgment email: the thank-you screen is the confirmation.

### Where applications are kept

`ascendrev-applications/` above `public_html/`, created by the handler with
owner-only permissions:

- `applications.csv`: one row per application (answers, no resume)
- `resumes/<64 hex characters>.pdf` or `.docx`: the uploaded resume, named by the
  submission key, never by anything the applicant typed
- `careers.log`: codes and counts only, never names, addresses or file names
- `delivery-*.json`, `submission-*.lock`, `rate-*.json`, `retry-heartbeat`: bookkeeping

Resumes are PDF or DOCX up to 5 MB, checked by content, not by file name. Legacy
`.doc` files are refused. This folder holds personal data: keep it out of the
deployment zip and out of backups that leave the account.

### Cron jobs

Two jobs, using the same PHP 8.2 **CLI** binary as the enquiry retry job (see
"Delivery retry cron" above for why php-cgi will not work). Replace `ACCOUNT`:

```
*/5 * * * * /usr/local/bin/php /home/ACCOUNT/public_html/api/careers.php retry >/dev/null 2>&1
17 3 * * * /usr/local/bin/php /home/ACCOUNT/public_html/api/careers.php purge >/dev/null 2>&1
```

- `retry` finishes any email a web request could not send, with the same backoff
  and 8-attempt limit as enquiries. Its heartbeat is
  `ascendrev-applications/retry-heartbeat`; ten minutes after adding the job its
  modified time should be recent.
- `purge` deletes applications older than the retention period (the CSV row, the
  resume and the delivery bookkeeping) for data-privacy retention. It prints only
  counts, for example `purge removed_rows=2 removed_resumes=2 ...`. It never
  prints a name. Run `php careers.php purge` by hand once after setting
  `ASCENDREV_CAREERS_RETENTION_DAYS` to confirm it reports what you expect before
  trusting the schedule.

### Upload size check

Many cPanel hosts default `upload_max_filesize` to 2M, which is below the 5 MB
resume limit; a larger file would then fail with a 413 even though it is within
the stated limit. `public_html/api/.user.ini` raises it to 8M (with
`post_max_size` 10M) on hosts that read `.user.ini`. If a 4 MB file still fails,
set the same two values in cPanel, **MultiPHP INI Editor**, for `ascend-rev.ca`.
(Do not use `php_value` in `.htaccess`: on hosts that run PHP as CGI or LSAPI it
returns a 500 for the whole site.)

To verify, submit the live form with a real 4 MB PDF. It must be accepted and the
email must arrive with the PDF attached. A 5 MB file is the largest accepted; a
6 MB one must be refused with the "file too large" message. `.user.ini` changes
can take a few minutes to take effect.

## Remaining static-site items

- `public/logo.svg`. The header currently uses the client's supplied `new-logo.png`. The
  scalable version is a Zelarion deliverable on this engagement.
