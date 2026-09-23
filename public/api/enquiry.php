<?php
/**
 * AscendRev enquiry handler (SPEC.md §6).
 *
 * The site is a static export with no Node runtime, so this file is the only
 * server-side code that ships. It is the authority on validation: the browser
 * is a convenience, never a source of truth, and every rule in
 * `src/lib/enquirySchema.ts` is re-checked here against the same limits and
 * the same domain lists.
 *
 * Contract with the client (`ContactEnquiryForm.tsx`):
 *   POST multipart/form-data, `Accept: application/json`.
 *   Array fields arrive as repeated keys, so `primaryBottleneck` is read
 *   through `$_POST` as an array.
 *   The form treats any 2xx as success and does not parse the body, so the
 *   status code carries the meaning and the JSON is for operators and future
 *   clients.
 *
 * Two things this file deliberately does not do. It never echoes a submitted
 * value back into HTML, because the only safe way to render attacker-supplied
 * text is not to. And it never writes a full submission to anywhere reachable
 * over the web; the CSV lives outside the document root.
 */

declare(strict_types=1);

/* ---------------------------------------------------------------------------
 * Configuration
 *
 * Recipients and storage come from the environment at deploy time, never from
 * source (SPEC.md §6). On cPanel these are set in the Apache/PHP environment
 * or in a config file placed ABOVE public_html, which is why the fallback path
 * climbs out of the document root rather than sitting beside this file.
 * ------------------------------------------------------------------------ */

/** Reads an env var, falling back to a value from an out-of-root config file. */
function config(string $key, string $default = ''): string
{
    $fromEnv = getenv($key);
    if (is_string($fromEnv) && $fromEnv !== '') {
        return $fromEnv;
    }

    static $file = null;
    if ($file === null) {
        $file = [];
        // One level above the document root, so it is never web-reachable even
        // if .htaccess is lost. See DEPLOY.md.
        $path = dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__) . '/ascendrev-enquiry.config.php';
        if (is_readable($path)) {
            $loaded = require $path;
            if (is_array($loaded)) {
                $file = $loaded;
            }
        }
    }

    return isset($file[$key]) && is_string($file[$key]) ? $file[$key] : $default;
}

/**
 * At least two recipients, so no lead depends on a single mailbox
 * (SPEC.md §6). These defaults are the addresses the client confirmed in
 * writing; the deploy environment should still set them explicitly.
 */
$RECIPIENTS = array_values(array_filter(array_map(
    'trim',
    explode(',', config('ASCENDREV_ENQUIRY_TO', 'rio.vidal@ascend-rev.ca,ralph.tomines@ascend-rev.ca'))
)));

/** Envelope sender. Must be ON the sending domain or SPF will fail. */
$MAIL_FROM = config('ASCENDREV_ENQUIRY_FROM', 'website@ascend-rev.ca');

/**
 * Where submissions and rate-limit state live. Defaults outside the document
 * root. If that is not writable the handler still delivers mail and says so in
 * the log rather than failing the visitor.
 */
$STORAGE_DIR = config(
    'ASCENDREV_ENQUIRY_STORAGE',
    dirname($_SERVER['DOCUMENT_ROOT'] ?? __DIR__) . '/ascendrev-enquiries'
);

/**
 * Optional SMTP transport.
 *
 * On cPanel, `mail()` hands off to the host's local MTA and is the right
 * answer: no credentials to store, no second service to depend on. But a
 * machine with no local MTA — a Windows laptop running a demo, for instance —
 * cannot deliver that way at all.
 *
 * So SMTP is used only when a host is configured, and `mail()` remains the
 * default. Production behaviour is unchanged by the presence of this code.
 *
 * The password is read from the environment or the out-of-root config file and
 * is never written to a log, never returned in a response, and never placed in
 * a header.
 */
$SMTP_HOST   = config('ASCENDREV_SMTP_HOST', '');
$SMTP_PORT   = (int) (config('ASCENDREV_SMTP_PORT', '587') ?: 587);
$SMTP_USER   = config('ASCENDREV_SMTP_USER', '');
$SMTP_PASS   = config('ASCENDREV_SMTP_PASS', '');

/** Hosts allowed to submit. Origin/Referer must match one of these. */
$ALLOWED_HOSTS = array_values(array_filter(array_map(
    'trim',
    explode(',', config('ASCENDREV_ALLOWED_HOSTS', 'ascend-rev.ca,www.ascend-rev.ca,localhost'))
)));

/**
 * Rate limit: submissions per IP per window.
 *
 * Five an hour is right for production, where every visitor arrives with their
 * own address. It is wrong behind a proxy or a tunnel that rewrites the source
 * address, because then every visitor shares one bucket — measured during the
 * review build, where a submission from the public tunnel and one from
 * localhost produced an identical IP hash. Configurable for that case only;
 * the default is unchanged and deployment should not set it.
 */
$RATE_LIMIT_MAX = max(1, (int) (config('ASCENDREV_RATE_LIMIT_MAX', '5') ?: 5));
const RATE_LIMIT_WINDOW_SECONDS = 3600;

/** How long an identical submission is treated as a duplicate, not a new lead. */
const DEDUPE_WINDOW_SECONDS = 900;

/* ---------------------------------------------------------------------------
 * Vocabularies — must match src/content/contact.ts exactly.
 * ------------------------------------------------------------------------ */

const BOTTLENECK_VALUES = ['outbound', 'inbound', 'customer-support', 'help-desk', 'after-hours'];
const REVENUE_VALUES    = ['under-10m', '10m-to-50m', '50m-to-250m', '250m-plus'];
const HEADCOUNT_VALUES  = ['5-to-10', '11-to-15', '16-to-50', 'over-50'];

/** Must match FREE_MAILBOX_DOMAINS in src/lib/enquirySchema.ts. */
const FREE_MAILBOX_DOMAINS = [
    'aim.com', 'aol.com', 'bell.net', 'btinternet.com', 'cogeco.ca', 'comcast.net',
    'eastlink.ca', 'fastmail.com', 'gmail.com', 'gmx.com', 'gmx.net', 'googlemail.com',
    'hotmail.ca', 'hotmail.co.uk', 'hotmail.com', 'icloud.com', 'live.ca', 'live.com',
    'mac.com', 'mail.com', 'me.com', 'msn.com', 'outlook.ca', 'outlook.com', 'pm.me',
    'proton.me', 'protonmail.com', 'rogers.com', 'shaw.ca', 'sympatico.ca', 'telus.net',
    'videotron.ca', 'yahoo.ca', 'yahoo.co.uk', 'yahoo.com', 'yandex.com', 'ymail.com',
    'zoho.com',
];

/** Must match DISPOSABLE_MAILBOX_DOMAINS in src/lib/enquirySchema.ts. */
const DISPOSABLE_MAILBOX_DOMAINS = [
    '10minutemail.com', 'dispostable.com', 'guerrillamail.com', 'mailinator.com',
    'sharklasers.com', 'temp-mail.org', 'throwawaymail.com', 'trashmail.com', 'yopmail.com',
];

/** Characters that cannot belong in a name. Mirrors the client rule exactly. */
const FORBIDDEN_NAME_CHARACTERS = '0123456789@<>{}[]\\/|_=+*#$%^~`';

/** The complete set of accepted field names. Anything else is rejected. */
const ALLOWED_FIELDS = [
    'firstName', 'lastName', 'corporateEmail', 'company', 'primaryBottleneck',
    'annualRevenue', 'headcount', 'budget', 'message',
    'referralSource', 'formToken', 'idempotencyKey',
];

/* ---------------------------------------------------------------------------
 * Response helpers
 * ------------------------------------------------------------------------ */

/**
 * Ends the request with JSON. No submitted value is ever placed in the body,
 * so there is nothing for a caller to reflect back into a page.
 */
function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Operational logging only. Never the submission body — an address and a
 * reason are enough to diagnose a problem and are not a copy of someone's
 * personal data sitting in a log file.
 */
function logLine(string $storageDir, string $message): void
{
    if (!is_dir($storageDir)) {
        return;
    }
    @file_put_contents(
        $storageDir . '/enquiry.log',
        sprintf("%s  %s\n", gmdate('c'), $message),
        FILE_APPEND | LOCK_EX
    );
}

/* ---------------------------------------------------------------------------
 * Gate 1 — method. Fail closed: anything that is not POST is refused.
 * ------------------------------------------------------------------------ */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

/* ---------------------------------------------------------------------------
 * Gate 2 — origin.
 *
 * A static export cannot issue a per-session CSRF token, because there is no
 * server to issue one at page render. Checking that the request came from our
 * own origin is the strongest control available here, and it is checked
 * strictly: a missing Origin AND a missing Referer is a rejection, not a pass.
 * ------------------------------------------------------------------------ */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$sourceHost = '';

if ($origin !== '') {
    $sourceHost = (string) parse_url($origin, PHP_URL_HOST);
} elseif ($referer !== '') {
    $sourceHost = (string) parse_url($referer, PHP_URL_HOST);
}

if ($sourceHost === '' || !in_array(strtolower($sourceHost), array_map('strtolower', $ALLOWED_HOSTS), true)) {
    respond(403, ['ok' => false, 'error' => 'forbidden_origin']);
}

/* ---------------------------------------------------------------------------
 * Gate 3 — rate limit, per IP.
 * ------------------------------------------------------------------------ */

if (!is_dir($STORAGE_DIR)) {
    @mkdir($STORAGE_DIR, 0750, true);
}

$clientIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateFile = $STORAGE_DIR . '/rate-' . hash('sha256', $clientIp) . '.json';

$now = time();
$hits = [];
if (is_readable($rateFile)) {
    $decoded = json_decode((string) @file_get_contents($rateFile), true);
    if (is_array($decoded)) {
        $hits = array_values(array_filter(
            $decoded,
            static fn($t): bool => is_int($t) && ($now - $t) < RATE_LIMIT_WINDOW_SECONDS
        ));
    }
}

if (count($hits) >= $RATE_LIMIT_MAX) {
    logLine($STORAGE_DIR, 'rate_limited ip_hash=' . substr(hash('sha256', $clientIp), 0, 12));
    header('Retry-After: ' . RATE_LIMIT_WINDOW_SECONDS);
    respond(429, ['ok' => false, 'error' => 'rate_limited']);
}

/* ---------------------------------------------------------------------------
 * Gate 4 — unknown fields.
 *
 * Rejected rather than ignored (SPEC.md §6). Silently dropping an unexpected
 * field hides both a client bug and a probe.
 * ------------------------------------------------------------------------ */

foreach (array_keys($_POST) as $key) {
    if (!in_array($key, ALLOWED_FIELDS, true)) {
        respond(422, ['ok' => false, 'error' => 'unknown_field']);
    }
}

/* ---------------------------------------------------------------------------
 * Gate 5 — honeypot.
 *
 * `referralSource` is rendered visually hidden with tabindex="-1" and
 * autocomplete="off". A person never fills it in. A bot filling every input
 * always does. Answered with 200 on purpose: a bot that is told it failed
 * learns something, a bot that is thanked does not.
 * ------------------------------------------------------------------------ */

if (trim((string) ($_POST['referralSource'] ?? '')) !== '') {
    logLine($STORAGE_DIR, 'honeypot_tripped ip_hash=' . substr(hash('sha256', $clientIp), 0, 12));
    respond(200, ['ok' => true]);
}

/* ---------------------------------------------------------------------------
 * Validation
 * ------------------------------------------------------------------------ */

/** Reads a scalar field as a trimmed string, whatever the browser sent. */
function field(string $name): string
{
    $raw = $_POST[$name] ?? '';
    return is_string($raw) ? trim($raw) : '';
}

/** Names are checked for characters that cannot belong in one, not against a
 *  whitelist of letters — a whitelist rejects Garcia-Lopez and O'Brien too. */
function nameIsValid(string $value): bool
{
    if ($value === '' || mb_strlen($value) > 60) {
        return false;
    }
    foreach (str_split(FORBIDDEN_NAME_CHARACTERS) as $character) {
        if (str_contains($value, $character)) {
            return false;
        }
    }
    return true;
}

$errors = [];

$firstName = field('firstName');
if (!nameIsValid($firstName)) {
    $errors[] = 'firstName';
}

$lastName = field('lastName');
if (!nameIsValid($lastName)) {
    $errors[] = 'lastName';
}

$corporateEmail = field('corporateEmail');
$emailDomain = '';
$separator = strrpos($corporateEmail, '@');
if ($separator !== false) {
    $emailDomain = strtolower(trim(substr($corporateEmail, $separator + 1)));
}

if (
    $corporateEmail === ''
    || mb_strlen($corporateEmail) > 254
    || !filter_var($corporateEmail, FILTER_VALIDATE_EMAIL)
    || $emailDomain === ''
    || in_array($emailDomain, DISPOSABLE_MAILBOX_DOMAINS, true)
    || in_array($emailDomain, FREE_MAILBOX_DOMAINS, true)
) {
    $errors[] = 'corporateEmail';
}

// Header injection: an address containing CR or LF can forge extra headers.
// FILTER_VALIDATE_EMAIL rejects these, but the check is explicit because this
// value is later placed in a Reply-To.
if (preg_match('/[\r\n]/', $corporateEmail) === 1) {
    $errors[] = 'corporateEmail';
}

$company = field('company');
if (
    $company === ''
    || mb_strlen($company) > 240
    || !filter_var($company, FILTER_VALIDATE_URL)
) {
    $errors[] = 'company';
}

$bottleneckRaw = $_POST['primaryBottleneck'] ?? [];
$bottleneck = is_array($bottleneckRaw) ? $bottleneckRaw : [$bottleneckRaw];
$bottleneck = array_values(array_unique(array_filter(
    array_map(static fn($v): string => is_string($v) ? trim($v) : '', $bottleneck),
    static fn(string $v): bool => $v !== ''
)));

if (
    count($bottleneck) < 1
    || count($bottleneck) > count(BOTTLENECK_VALUES)
    || array_diff($bottleneck, BOTTLENECK_VALUES) !== []
) {
    $errors[] = 'primaryBottleneck';
}

/**
 * Step two is optional: the form offers a Skip control and step one submits on
 * its own. So these are validated only when present. Present-but-wrong is
 * still a rejection — fail closed on an unrecognised value.
 */
$annualRevenue = field('annualRevenue');
if ($annualRevenue !== '' && !in_array($annualRevenue, REVENUE_VALUES, true)) {
    $errors[] = 'annualRevenue';
}

$headcount = field('headcount');
if ($headcount !== '' && !in_array($headcount, HEADCOUNT_VALUES, true)) {
    $errors[] = 'headcount';
}

$budget = field('budget');
if (mb_strlen($budget) > 120) {
    $errors[] = 'budget';
}

$message = field('message');
if (mb_strlen($message) > 2000 || ($message !== '' && mb_strlen($message) < 10)) {
    $errors[] = 'message';
}

if ($errors !== []) {
    logLine($STORAGE_DIR, 'validation_failed fields=' . implode(',', $errors));
    respond(422, ['ok' => false, 'error' => 'validation_failed', 'fields' => $errors]);
}

/* ---------------------------------------------------------------------------
 * Duplicate suppression.
 *
 * A double-clicked button, a retried request on a flaky connection, or a
 * refresh must not produce two leads and two emails. The key is derived from
 * the submission itself rather than from a client-supplied id, because a
 * client that retries generates a fresh id and would defeat the check.
 * ------------------------------------------------------------------------ */

/**
 * The browser generates an idempotency key once per intent to send, and keeps
 * it across retries. When it is present it is authoritative, because it
 * survives the case a content hash cannot: a visitor who edits one word and
 * resends after a timeout is retrying the same intent, not filing a new lead.
 *
 * Length- and charset-constrained before use, because it becomes part of a
 * filename. Anything unexpected falls back to the content hash rather than
 * being trusted.
 */
$clientKey = field('idempotencyKey');
$useClientKey = $clientKey !== ''
    && strlen($clientKey) <= 64
    && preg_match('/^[A-Za-z0-9._-]+$/', $clientKey) === 1;

$submissionKey = $useClientKey
    ? hash('sha256', 'client:' . $clientKey)
    : hash('sha256', implode("\x1f", [
        strtolower($corporateEmail),
        $firstName,
        $lastName,
        $company,
        implode(',', $bottleneck),
        $annualRevenue,
        $headcount,
        $budget,
        $message,
    ]));

$dedupeFile = $STORAGE_DIR . '/dedupe-' . $submissionKey . '.txt';

/**
 * The claim is made with an exclusive create rather than "check, then write".
 * Two requests arriving at the same instant — a double-click, or a client that
 * retries before the first response lands — would both pass a check-then-write
 * and both send an email. `fopen` in 'x' mode can only succeed for one of
 * them, so the side effects below run in the winner alone.
 */
$claim = @fopen($dedupeFile, 'x');

if ($claim === false) {
    $seenAt = (int) @file_get_contents($dedupeFile);

    if ($seenAt > 0 && ($now - $seenAt) < DEDUPE_WINDOW_SECONDS) {
        // Reported as success. The visitor's intent was satisfied the first
        // time, and telling them it failed would invite a third attempt.
        logLine($STORAGE_DIR, 'duplicate_suppressed key=' . substr($submissionKey, 0, 12));
        respond(200, ['ok' => true, 'duplicate' => true]);
    }

    // The marker is older than the window, so this is a genuine new intent
    // that happens to hash the same. Take the marker over and continue.
    @file_put_contents($dedupeFile, (string) $now, LOCK_EX);
} else {
    fwrite($claim, (string) $now);
    fclose($claim);
}

/* ---------------------------------------------------------------------------
 * Persist first, then send.
 *
 * The CSV is written before the mail attempt on purpose (SPEC.md §6): if the
 * host's mail service is down, the lead still exists on disk. A lead that
 * only ever lived in an SMTP conversation is a lead that can be lost silently.
 * ------------------------------------------------------------------------ */

$submittedAt = gmdate('c');
$csvPath = $STORAGE_DIR . '/enquiries.csv';
$csvIsNew = !file_exists($csvPath);

$row = [
    $submittedAt,
    $firstName,
    $lastName,
    $corporateEmail,
    $company,
    implode('|', $bottleneck),
    $annualRevenue,
    $headcount,
    $budget,
    $message,
    substr(hash('sha256', $clientIp), 0, 16),
];

$csvWritten = false;
$handle = @fopen($csvPath, 'a');
if ($handle !== false) {
    if (flock($handle, LOCK_EX)) {
        if ($csvIsNew) {
            fputcsv($handle, [
                'submitted_at_utc', 'first_name', 'last_name', 'corporate_email',
                'company_url', 'primary_bottleneck', 'annual_revenue', 'headcount',
                'budget', 'message', 'ip_hash',
            ]);
        }
        fputcsv($handle, $row);
        fflush($handle);
        flock($handle, LOCK_UN);
        $csvWritten = true;
    }
    fclose($handle);
}

if (!$csvWritten) {
    logLine($STORAGE_DIR, 'csv_write_failed path=' . basename($csvPath));
}

/* ---------------------------------------------------------------------------
 * Mail.
 *
 * Plain text, built entirely from values already validated above. Header
 * values are re-checked for CR and LF even so, because a header injection is
 * the one mistake in this file that would matter beyond this site.
 * ------------------------------------------------------------------------ */

/** Strips anything that could break out of a header value. */
function headerSafe(string $value): string
{
    return trim(str_replace(["\r", "\n", "\0"], '', $value));
}

$bottleneckLabels = [
    'outbound'         => 'Outbound',
    'inbound'          => 'Inbound',
    'customer-support' => 'Customer support',
    'help-desk'        => 'Help desk',
    'after-hours'      => 'After hours',
];

$lines = [
    'A new enquiry was submitted on ascend-rev.ca.',
    '',
    'Name             : ' . $firstName . ' ' . $lastName,
    'Work email       : ' . $corporateEmail,
    'Company          : ' . $company,
    'Primary need     : ' . implode(', ', array_map(
        static fn(string $v): string => $bottleneckLabels[$v] ?? $v,
        $bottleneck
    )),
    'Annual revenue   : ' . ($annualRevenue !== '' ? $annualRevenue : 'not provided'),
    'Headcount        : ' . ($headcount !== '' ? $headcount : 'not provided'),
    'Budget           : ' . ($budget !== '' ? $budget : 'not provided'),
    '',
    'Message:',
    $message !== '' ? $message : '(none)',
    '',
    '---',
    'Submitted ' . $submittedAt . ' UTC',
    $csvWritten ? 'Also recorded in enquiries.csv' : 'WARNING: could not be written to enquiries.csv',
];

$subject = headerSafe(sprintf(
    '[AscendRev] Enquiry from %s %s at %s',
    $firstName,
    $lastName,
    $company
));

/* ---------------------------------------------------------------------------
 * HTML body.
 *
 * Built with nested tables and inline styles, not because that is good HTML
 * but because it is the only markup Outlook's rendering engine handles
 * predictably. A plain-text alternative is sent alongside it, so a client that
 * cannot or will not render HTML still shows a readable enquiry rather than a
 * wall of markup.
 *
 * Every value inserted below goes through htmlspecialchars. These values have
 * already been validated, but an enquiry is attacker-controlled text arriving
 * in someone's inbox, and escaping at the point of output is the only habit
 * that survives a later change to the validation.
 */

/** Escapes for HTML output. */
function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** One label/value row. Empty values render as a muted placeholder. */
function row(string $label, string $value, bool $isLink = false): string
{
    $shown = $value !== ''
        ? ($isLink
            ? '<a href="' . e($value) . '" style="color:#0F1B33;text-decoration:underline;">' . e($value) . '</a>'
            : e($value))
        : '<span style="color:#9aa3b2;">Not provided</span>';

    return '<tr>'
        . '<td style="padding:11px 0;border-bottom:1px solid #e9ecf1;font:600 12px/16px Arial,Helvetica,sans-serif;'
        . 'color:#6b7484;text-transform:uppercase;letter-spacing:.05em;width:150px;vertical-align:top;">'
        . e($label) . '</td>'
        . '<td style="padding:11px 0;border-bottom:1px solid #e9ecf1;font:400 15px/22px Arial,Helvetica,sans-serif;'
        . 'color:#111827;vertical-align:top;">' . $shown . '</td>'
        . '</tr>';
}

$revenueLabels = [
    'under-10m'    => 'Under $10M',
    '10m-to-50m'   => '$10M to $50M',
    '50m-to-250m'  => '$50M to $250M',
    '250m-plus'    => '$250M or more',
];
$headcountLabels = [
    '5-to-10'   => '5 to 10',
    '11-to-15'  => '11 to 15',
    '16-to-50'  => '16 to 50',
    'over-50'   => 'Over 50',
];

$needList = implode(', ', array_map(
    static fn(string $v): string => $bottleneckLabels[$v] ?? $v,
    $bottleneck
));

$html = '<!DOCTYPE html><html><head><meta charset="utf-8">'
    . '<meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>New enquiry</title></head>'
    . '<body style="margin:0;padding:0;background:#eef1f5;">'

    // Preheader: the grey line inboxes show beside the subject. Hidden in the
    // body itself, which is why it carries the zero-height styling.
    . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">'
    . e($firstName . ' ' . $lastName) . ' at ' . e($company) . ' &mdash; ' . e($needList)
    . '</div>'

    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef1f5;padding:28px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,27,51,.10);">'

    // Header band, brand navy, with the logo embedded by Content-ID so it
    // displays without the recipient clicking "show images".
    . '<tr><td style="background:#0F1B33;padding:26px 32px;">'
    // 200px wide from a 400x200 source, so it stays sharp on a retina screen.
    // The white halo is baked into the PNG rather than applied with CSS,
    // because Outlook discards gradients and the navy wordmark would then sit
    // invisibly on this navy band.
    . '<img src="cid:ascendrev-logo" width="200" height="100" alt="AscendRev"'
    . ' style="display:block;border:0;width:200px;height:auto;">'
    . '</td></tr>'

    // The gold and green rule from the site, carried across so the email is
    // recognisably the same brand as the page the enquiry came from.
    . '<tr><td style="font-size:0;line-height:0;">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
    . '<td width="74" style="background:#267455;height:3px;font-size:0;line-height:0;">&nbsp;</td>'
    . '<td style="background:#EBCB89;height:3px;font-size:0;line-height:0;">&nbsp;</td>'
    . '</tr></table></td></tr>'

    . '<tr><td style="padding:30px 32px 8px;">'
    . '<p style="margin:0 0 4px;font:600 11px/16px Arial,Helvetica,sans-serif;color:#1E5E46;text-transform:uppercase;letter-spacing:.14em;">New enquiry</p>'
    . '<h1 style="margin:0;font:400 26px/32px Georgia,\'Times New Roman\',serif;color:#0F1B33;">'
    . e($firstName . ' ' . $lastName) . '</h1>'
    . '<p style="margin:6px 0 0;font:400 15px/22px Arial,Helvetica,sans-serif;color:#4B5563;">'
    . e($company) . '</p>'
    . '</td></tr>'

    . '<tr><td style="padding:14px 32px 4px;">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
    . row('Work email', $corporateEmail)
    . row('Company', $company, true)
    . row('Primary need', $needList)
    . row('Annual revenue', $annualRevenue !== '' ? ($revenueLabels[$annualRevenue] ?? $annualRevenue) : '')
    . row('Headcount', $headcount !== '' ? ($headcountLabels[$headcount] ?? $headcount) : '')
    . row('Budget', $budget)
    . '</table></td></tr>';

if ($message !== '') {
    $html .= '<tr><td style="padding:22px 32px 0;">'
        . '<p style="margin:0 0 8px;font:600 12px/16px Arial,Helvetica,sans-serif;color:#6b7484;text-transform:uppercase;letter-spacing:.05em;">Message</p>'
        . '<div style="background:#f6f8fa;border-left:3px solid #EBCB89;padding:14px 16px;border-radius:0 4px 4px 0;'
        . 'font:400 15px/23px Arial,Helvetica,sans-serif;color:#111827;white-space:pre-wrap;">'
        . e($message) . '</div></td></tr>';
}

$html .= '<tr><td style="padding:26px 32px 4px;">'
    . '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    . '<td style="background:#1E5E46;border-radius:6px;">'
    . '<a href="mailto:' . e($corporateEmail) . '?subject=' . rawurlencode('Re: your enquiry to AscendRev')
    . '" style="display:inline-block;padding:13px 26px;font:600 14px/18px Arial,Helvetica,sans-serif;'
    . 'color:#ffffff;text-decoration:none;">Reply to ' . e($firstName) . '</a>'
    . '</td></tr></table>'
    . '<p style="margin:12px 0 0;font:400 12px/18px Arial,Helvetica,sans-serif;color:#6b7484;">'
    . 'Replying to this email also reaches them directly.</p>'
    . '</td></tr>'

    . '<tr><td style="padding:24px 32px 28px;">'
    . '<hr style="border:0;border-top:1px solid #e9ecf1;margin:0 0 14px;">'
    . '<p style="margin:0;font:400 12px/18px Arial,Helvetica,sans-serif;color:#8a93a3;">'
    . 'Submitted ' . e($submittedAt) . ' UTC via ascend-rev.ca<br>'
    . ($csvWritten
        ? 'Also recorded in enquiries.csv'
        : '<span style="color:#B42318;font-weight:bold;">Warning: could not be written to enquiries.csv</span>')
    . '</p></td></tr>'

    . '</table></td></tr></table></body></html>';

/* ---------------------------------------------------------------------------
 * MIME assembly.
 *
 * multipart/related wraps a multipart/alternative (plain text + HTML) and the
 * logo. "related" rather than "mixed" is what tells the client the image
 * belongs to the HTML rather than being a file the recipient should download,
 * which is why it appears in the layout and not as an attachment.
 * ------------------------------------------------------------------------ */

$boundaryRelated = 'rel_' . bin2hex(random_bytes(12));
$boundaryAlt     = 'alt_' . bin2hex(random_bytes(12));

$mime = '--' . $boundaryRelated . "\r\n"
    . 'Content-Type: multipart/alternative; boundary="' . $boundaryAlt . '"' . "\r\n\r\n"

    . '--' . $boundaryAlt . "\r\n"
    . 'Content-Type: text/plain; charset=utf-8' . "\r\n"
    . 'Content-Transfer-Encoding: 8bit' . "\r\n\r\n"
    . implode("\n", $lines) . "\r\n\r\n"

    . '--' . $boundaryAlt . "\r\n"
    . 'Content-Type: text/html; charset=utf-8' . "\r\n"
    . 'Content-Transfer-Encoding: 8bit' . "\r\n\r\n"
    . $html . "\r\n\r\n"

    . '--' . $boundaryAlt . '--' . "\r\n\r\n";

$logoPath = __DIR__ . '/email-logo.png';
if (is_readable($logoPath)) {
    $logoData = @file_get_contents($logoPath);
    if ($logoData !== false) {
        $mime .= '--' . $boundaryRelated . "\r\n"
            . 'Content-Type: image/png; name="ascendrev-logo.png"' . "\r\n"
            . 'Content-Transfer-Encoding: base64' . "\r\n"
            . 'Content-ID: <ascendrev-logo>' . "\r\n"
            . 'Content-Disposition: inline; filename="ascendrev-logo.png"' . "\r\n\r\n"
            . chunk_split(base64_encode($logoData), 76, "\r\n") . "\r\n";
    }
}

$mime .= '--' . $boundaryRelated . '--' . "\r\n";

$headers = implode("\r\n", [
    'From: AscendRev Website <' . headerSafe($MAIL_FROM) . '>',
    'Reply-To: ' . headerSafe($firstName . ' ' . $lastName) . ' <' . headerSafe($corporateEmail) . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/related; boundary="' . $boundaryRelated . '"',
    'X-Mailer: ascend-rev.ca',
]);

/**
 * Minimal SMTP submission over STARTTLS with AUTH LOGIN.
 *
 * Deliberately dependency-free: the site ships no Composer vendor tree, and
 * pulling one in for a single send would be a new supply chain on the client's
 * host. Returns true only when the server has accepted the message with a 250
 * to the final dot, so a partial conversation never counts as delivered.
 */
function smtpSend(
    string $host,
    int $port,
    string $user,
    string $pass,
    string $from,
    string $to,
    string $subject,
    string $body,
    string $headers
): bool {
    $socket = @stream_socket_client(
        sprintf('tcp://%s:%d', $host, $port),
        $errno,
        $errstr,
        20,
        STREAM_CLIENT_CONNECT
    );
    if ($socket === false) {
        return false;
    }
    stream_set_timeout($socket, 20);

    /** Reads a full multiline reply. A line matching "NNN " ends it; "NNN-" continues. */
    $read = static function () use ($socket): string {
        $out = '';
        while (($line = fgets($socket, 1024)) !== false) {
            $out .= $line;
            if (preg_match('/^\d{3} /', $line) === 1) {
                break;
            }
        }
        return $out;
    };
    $expect = static function (string $reply, string $code): bool {
        return str_starts_with(trim($reply), $code);
    };
    $write = static function (string $line) use ($socket): void {
        fwrite($socket, $line . "\r\n");
    };

    $ok = $expect($read(), '220');

    if ($ok) {
        $write('EHLO ascend-rev.ca');
        $ok = $expect($read(), '250');
    }
    if ($ok) {
        $write('STARTTLS');
        $ok = $expect($read(), '220');
    }
    if ($ok) {
        $ok = (bool) @stream_socket_enable_crypto(
            $socket,
            true,
            STREAM_CRYPTO_METHOD_TLS_CLIENT
        );
    }
    if ($ok) {
        // EHLO again: the capability list before and after TLS are different
        // sessions as far as the server is concerned.
        $write('EHLO ascend-rev.ca');
        $ok = $expect($read(), '250');
    }
    if ($ok && $user !== '') {
        $write('AUTH LOGIN');
        $ok = $expect($read(), '334');
        if ($ok) {
            $write(base64_encode($user));
            $ok = $expect($read(), '334');
        }
        if ($ok) {
            $write(base64_encode($pass));
            $ok = $expect($read(), '235');
        }
    }
    if ($ok) {
        $write('MAIL FROM:<' . $from . '>');
        $ok = $expect($read(), '250');
    }
    if ($ok) {
        $write('RCPT TO:<' . $to . '>');
        $ok = $expect($read(), '250');
    }
    if ($ok) {
        $write('DATA');
        $ok = $expect($read(), '354');
    }
    if ($ok) {
        // Dot-stuffing: a line consisting of a single "." would otherwise end
        // the message early.
        // Normalise to CRLF exactly once. The body may already be CRLF
        // (MIME) or LF (plain text); collapsing first makes both safe.
        $normalised = str_replace("
", "
", $body);
        $normalised = str_replace("
", "
", $normalised);
        // Dot-stuffing: a line of a single "." would end the message early.
        $payload = preg_replace('/^\./m', '..', $normalised) ?? $normalised;
        $write(
            $headers . "\r\n"
            . 'To: ' . $to . "\r\n"
            . 'Subject: ' . $subject . "\r\n"
            . 'Date: ' . gmdate('r') . "\r\n"
            . "\r\n"
            . str_replace("\n", "\r\n", $payload) . "\r\n."
        );
        $ok = $expect($read(), '250');
    }

    $write('QUIT');
    fclose($socket);

    return $ok;
}

$mailDelivered = false;

foreach ($RECIPIENTS as $recipient) {
    $to = headerSafe($recipient);
    if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
        continue;
    }

    if ($SMTP_HOST !== '') {
        if (smtpSend($SMTP_HOST, $SMTP_PORT, $SMTP_USER, $SMTP_PASS, headerSafe($MAIL_FROM), $to, $subject, $mime, $headers)) {
            $mailDelivered = true;
        }
        continue;
    }

    if (@mail($to, $subject, $mime, $headers, '-f' . headerSafe($MAIL_FROM))) {
        $mailDelivered = true;
    }
}

if (!$mailDelivered) {
    logLine($STORAGE_DIR, 'mail_failed recipients=' . count($RECIPIENTS) . ' csv=' . ($csvWritten ? 'ok' : 'failed'));
}

/* ---------------------------------------------------------------------------
 * Outcome.
 *
 * Success requires that the lead was captured SOMEWHERE. If neither the mail
 * nor the CSV succeeded, the submission is gone and the visitor must be told,
 * so they can reach out another way rather than waiting for a reply that is
 * never coming.
 * ------------------------------------------------------------------------ */

$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);

if (!$mailDelivered && !$csvWritten) {
    respond(500, ['ok' => false, 'error' => 'not_recorded']);
}

respond(200, ['ok' => true, 'mailed' => $mailDelivered, 'recorded' => $csvWritten]);
