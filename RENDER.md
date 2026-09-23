# Deploying the review environment to Render

**Preview only.** Production is a static export uploaded to AscendRev's own
cPanel account, per `SPEC.md` §1 and `DEPLOY.md`. Nothing here changes that,
and the client's site is not hosted on Render.

This exists to solve one problem: a preview that depends on a laptop staying
awake and a tunnel staying up is not something you can hand to a client in
another timezone.

## Why Docker rather than a static site

Render's Static Sites are CDN-backed with no runtime, and Render has no native
PHP runtime. The enquiry handler is PHP. On any static host the form returns
404 on submit and every enquiry is lost silently.

A Docker web service runs real Apache and real PHP, which is what the client's
cPanel account runs. That means the reviewer sees the actual `.htaccess`
behaviour, the real custom 404, and a working enquiry form. The preview tells
the truth about production instead of approximating it.

## What gets built

```
stage 1   node:22-alpine     npm ci, npm run build  ->  out/
stage 2   php:8.2-apache     out/ -> /var/www/html
                             mod_rewrite, headers, deflate, expires enabled
                             AllowOverride All so .htaccess is honoured
                             storage at /var/www/ascendrev-enquiries
```

`out/` is byte-identical to what would be uploaded to cPanel. `AllowOverride`
matters: without it Apache ignores `.htaccess` entirely and the custom 404,
the caching rules and the security headers all silently do nothing.

## Setting it up

### 1. Push the branch

The blueprint reads from `main`. These files must be committed:
`Dockerfile`, `docker-entrypoint.sh`, `.dockerignore`, `render.yaml`.

### 2. Create the service

Render dashboard, **New**, **Blueprint**, point it at
`github.com/Zelarion/AscendRev_web`, select `main`. Render reads `render.yaml`
and creates a web service called `ascendrev-preview`.

Region is set to Singapore, which is the closest to Manila. Calgary is far
from every Render region, so expect a little latency there either way.

### 3. Set the secrets

Every variable marked `sync: false` in `render.yaml` is deliberately not in the
file, so no credential is ever committed. Set these by hand under
**Environment**:

| Variable | Value |
|---|---|
| `ASCENDREV_ENQUIRY_TO` | A review mailbox, **not** the client's real addresses |
| `ASCENDREV_ENQUIRY_FROM` | The Gmail account used for SMTP, or a verified alias |
| `ASCENDREV_ALLOWED_HOSTS` | Must include `ascendrev-preview.onrender.com` |
| `ASCENDREV_SMTP_USER` | The Gmail address |
| `ASCENDREV_SMTP_PASS` | A Gmail **App Password**, 16 characters, spaces removed |

The last one requires 2-Step Verification on that Google account. Generate it
at `myaccount.google.com/apppasswords` and delete it when the review is over.

**`ASCENDREV_ALLOWED_HOSTS` is the one people forget.** The handler rejects any
request whose Origin or Referer is not on that list, which is what stands in
for a CSRF token on a site with no server to issue one. Leave the Render
hostname off it and every submission returns 403 while the page itself looks
perfectly fine.

### 4. Deploy and verify

Do not trust a green build. Check:

```
GET  /                      200
GET  /contact/              200
GET  /nonexistent/          404   proves .htaccess is being read
GET  /api/enquiry.php       405   method gate
POST /api/enquiry.php       403   when Origin is not allow-listed
```

Then submit the form from the Render URL in a browser and confirm the email
arrives. A 200 with `{"ok":true,"mailed":true}` is the proof.

## Things that will bite

**The free plan sleeps.** It spins down after inactivity and takes close to a
minute to wake. To a client clicking a link that is a broken site. The
blueprint sets `starter` for this reason. Drop the service when the review ends
rather than downgrading it.

**The filesystem is ephemeral.** Every deploy wipes
`/var/www/ascendrev-enquiries`, so the CSV is a convenience here and the
emailed copy is the record of truth. That is the opposite of the cPanel
arrangement, where the CSV exists precisely so a lead survives a mail failure.
Attach a persistent disk if the CSV needs to survive, though for a review it
does not.

**Rate limiting counts everyone as one visitor.** Render sits behind a proxy,
so PHP sees the same source address for every request. The blueprint raises the
limit to 100 for that reason. **Deployment to cPanel must not set this
variable**, because there the default of 5 an hour is correct.

**`mail()` cannot work in this image.** There is no local mail server, so SMTP
is mandatory on Render. On cPanel it is the other way round: leave SMTP unset
and the host's own mail system handles delivery.

## Running it locally first

Worth doing before pushing, since it catches a broken Dockerfile in two minutes
instead of after a Render build:

```bash
docker build -t ascendrev-preview .
docker run --rm -p 8080:80 \
  -e ASCENDREV_ALLOWED_HOSTS="localhost,127.0.0.1" \
  -e ASCENDREV_ENQUIRY_TO="you@example.com" \
  ascendrev-preview
```

Then open `http://localhost:8080`. Without SMTP variables the form will record
to CSV and report `mailed:false`, which is expected and still proves the whole
path works.

## When the review is finished

Delete the Render service, delete the Gmail App Password, and deploy the real
thing to cPanel following `DEPLOY.md`. Leaving a preview running after launch
invites someone to bookmark the wrong URL, and a stale copy of a client's site
on a domain they do not control is a problem you find out about later.
