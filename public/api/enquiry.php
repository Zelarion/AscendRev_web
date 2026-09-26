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
$RECIPIENTS = array_map(
    'trim',
    explode(',', config('ASCENDREV_ENQUIRY_TO', 'rio.vidal@ascend-rev.ca,ralph.tomines@ascend-rev.ca'))
);

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
 * Google Workspace SMTP transport.
 *
 * cPanel must submit through the configured Google Workspace account; do not
 * fall back to the host MTA when authenticated SMTP is unavailable.
 *
 * The password is read from the environment or the out-of-root config file and
 * is never written to a log, never returned in a response, and never placed in
 * a header.
 */
$SMTP_HOST   = config('ASCENDREV_SMTP_HOST', 'smtp.gmail.com');
$SMTP_PORT   = (int) (config('ASCENDREV_SMTP_PORT', '587') ?: 587);
$SMTP_USER   = config('ASCENDREV_SMTP_USER', '');
$SMTP_PASS   = config('ASCENDREV_SMTP_PASS', '');

/** Envelope sender. Defaults to the authenticated Google Workspace identity. */
$MAIL_FROM = config('ASCENDREV_ENQUIRY_FROM', $SMTP_USER);

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
 * Vocabularies — must match src/lib/enquirySchema.ts exactly.
 * ------------------------------------------------------------------------ */

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

/** Characters a phone number may contain. Mirrors PHONE_CHARACTERS_PATTERN in src/lib/enquirySchema.ts. */
const PHONE_ALLOWED_PATTERN = '/^[0-9 ()+.-]+$/';
const PHONE_REQUIRED_MESSAGE = 'Enter the best number to call so we can reach you directly.';
const PHONE_TOO_LONG_MESSAGE = 'That is longer than 32 characters. Check it for a paste that went wrong.';
const PHONE_CHARACTERS_MESSAGE = 'A phone number can only contain digits, spaces, and + ( ) - . Remove any letters or other characters.';
const PHONE_DIGIT_COUNT_MESSAGE = 'Enter exactly 10 digits. Phone numbers with fewer or more digits cannot be accepted.';

/** The complete set of accepted field names. Anything else is rejected. */
const ALLOWED_FIELDS = [
    'individualName', 'businessEmail', 'entityName', 'bestNumberToCall', 'comments',
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
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    // 204 means "no content", so it must not carry one. Sending a body with it
    // makes some clients treat the response as malformed.
    if ($status === 204) {
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
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
 * Gate 1 — origin.
 *
 * Checked before the method, because a cross-origin browser request may arrive
 * as an OPTIONS preflight that must be answered rather than refused.
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

$originAllowed = $sourceHost !== ''
    && in_array(strtolower($sourceHost), array_map('strtolower', $ALLOWED_HOSTS), true);

/**
 * Cross-origin support, for the split deployment where the pages are served
 * from one host and this handler from another.
 *
 * The allow-list is reused rather than duplicated, and the header echoes the
 * one origin that passed it. A wildcard is never sent: this endpoint receives
 * names, work addresses and business detail, and `*` would let any site on the
 * internet post to it from a visitor's browser.
 *
 * `Vary: Origin` is not optional. Without it a shared cache can serve one
 * origin's allow header to a different origin.
 */
if ($origin !== '' && $originAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

/**
 * Preflight. The form posts FormData with only safelisted headers, so most
 * browsers treat it as a simple request and never send OPTIONS. This is here
 * so that adding a custom header later does not silently break submissions
 * from the browser while continuing to work from curl.
 */
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    if (!$originAllowed) {
        respond(403, ['ok' => false, 'error' => 'forbidden_origin']);
    }
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Accept, Content-Type');
    header('Access-Control-Max-Age: 600');
    respond(204, []);
}

if (!$originAllowed) {
    respond(403, ['ok' => false, 'error' => 'forbidden_origin']);
}

/* ---------------------------------------------------------------------------
 * Gate 2 — method. Fail closed: anything that is not POST is refused.
 * ------------------------------------------------------------------------ */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
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
    logLine($STORAGE_DIR, 'rate_limited');
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
    logLine($STORAGE_DIR, 'honeypot_tripped');
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
    if ($value === '' || mb_strlen($value) > 120) {
        return false;
    }
    foreach (str_split(FORBIDDEN_NAME_CHARACTERS) as $character) {
        if (str_contains($value, $character)) {
            return false;
        }
    }
    return true;
}

/** Returns the same field message as the zod schema, or null when valid. */
function phoneValidationMessage(string $value): ?string
{
    if ($value === '') {
        return PHONE_REQUIRED_MESSAGE;
    }
    if (mb_strlen($value) > 32) {
        return PHONE_TOO_LONG_MESSAGE;
    }
    if (preg_match(PHONE_ALLOWED_PATTERN, $value) !== 1) {
        return PHONE_CHARACTERS_MESSAGE;
    }
    $digits = preg_replace('/[^0-9]/', '', $value);
    if (!is_string($digits) || strlen($digits) !== 10) {
        return PHONE_DIGIT_COUNT_MESSAGE;
    }
    return null;
}

$errors = [];

$individualName = field('individualName');
if (!nameIsValid($individualName)) {
    $errors[] = 'individualName';
}

$businessEmail = field('businessEmail');
$emailDomain = '';
$separator = strrpos($businessEmail, '@');
if ($separator !== false) {
    $emailDomain = strtolower(trim(substr($businessEmail, $separator + 1)));
}

if (
    $businessEmail === ''
    || mb_strlen($businessEmail) > 254
    || !filter_var($businessEmail, FILTER_VALIDATE_EMAIL)
    || $emailDomain === ''
    || in_array($emailDomain, DISPOSABLE_MAILBOX_DOMAINS, true)
    || in_array($emailDomain, FREE_MAILBOX_DOMAINS, true)
) {
    $errors[] = 'businessEmail';
}

// Header injection: an address containing CR or LF can forge extra headers.
// FILTER_VALIDATE_EMAIL rejects these, but the check is explicit because this
// value is later placed in a Reply-To.
if (preg_match('/[\r\n]/', $businessEmail) === 1) {
    $errors[] = 'businessEmail';
}

$entityName = field('entityName');
if ($entityName === '' || mb_strlen($entityName) > 240) {
    $errors[] = 'entityName';
}

$bestNumberToCall = field('bestNumberToCall');
$phoneValidationMessage = phoneValidationMessage($bestNumberToCall);
if ($phoneValidationMessage !== null) {
    $errors[] = 'bestNumberToCall';
}

/** Optional, so validated only for its upper bound. */
$comments = field('comments');
if (mb_strlen($comments) > 200) {
    $errors[] = 'comments';
}

if ($errors !== []) {
    logLine($STORAGE_DIR, 'validation_failed field_count=' . count($errors));
    respond(422, [
        'ok' => false,
        'error' => 'validation_failed',
        'fields' => $errors,
        'messages' => $phoneValidationMessage === null
            ? []
            : ['bestNumberToCall' => $phoneValidationMessage],
    ]);
}

/* ---------------------------------------------------------------------------
 * Idempotent submission claim.
 *
 * The per-key lock serialises duplicate requests for the full persist/send
 * sequence. The OS releases it if PHP exits unexpectedly, so a later retry
 * can resume from the durable CSV row and per-recipient delivery checkpoints.
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
        strtolower($businessEmail),
        $individualName,
        $entityName,
        $bestNumberToCall,
        $comments,
    ]));

/* ---------------------------------------------------------------------------
 * Durable row and delivery state.
 *
 * The CSV row is atomically replaced under a shared writer lock. Its
 * submission_key makes retries idempotent; the state file stores only hashes
 * and SMTP-250 checkpoints, never submission fields or recipient addresses.
 * ------------------------------------------------------------------------ */

const CSV_HEADER = [
    'submitted_at_utc', 'individual_name', 'business_email', 'entity_name',
    'best_number_to_call', 'comments', 'ip_hash', 'submission_key',
];

/** Releases the per-submission lock before any response path exits. */
function releaseSubmissionLock($handle): void
{
    if (is_resource($handle)) {
        @flock($handle, LOCK_UN);
        fclose($handle);
    }
}

$submissionLockPath = $STORAGE_DIR . '/submission-' . $submissionKey . '.lock';
$submissionLock = @fopen($submissionLockPath, 'c');
if ($submissionLock === false || !flock($submissionLock, LOCK_EX)) {
    releaseSubmissionLock($submissionLock);
    logLine($STORAGE_DIR, 'submission_lock_failed');
    respond(503, ['ok' => false, 'error' => 'submission_busy']);
}

$csvPath = $STORAGE_DIR . '/enquiries.csv';
$deliveryStatePath = $STORAGE_DIR . '/delivery-' . $submissionKey . '.json';

/** Writes bytes to a same-directory temporary file, then atomically replaces the target. */
function atomicWriteFile(string $path, string $contents): bool
{
    $temporaryPath = $path . '.' . bin2hex(random_bytes(8)) . '.tmp';
    $handle = @fopen($temporaryPath, 'xb');
    if ($handle === false) {
        return false;
    }
    @chmod($temporaryPath, 0600);

    $offset = 0;
    $length = strlen($contents);
    $ok = true;
    while ($offset < $length) {
        $written = @fwrite($handle, substr($contents, $offset));
        if ($written === false || $written === 0) {
            $ok = false;
            break;
        }
        $offset += $written;
    }
    if ($ok) {
        $ok = @fflush($handle);
        if ($ok && function_exists('fsync')) {
            $ok = @fsync($handle);
        }
    }
    fclose($handle);

    if (!$ok || !@rename($temporaryPath, $path)) {
        @unlink($temporaryPath);
        return false;
    }
    return true;
}

/** True when the file has the schema this handler writes. */
function csvHeaderMatches(string $path, array $expectedHeader): bool
{
    if (!file_exists($path) || @filesize($path) === 0) {
        return true;
    }
    $handle = @fopen($path, 'r');
    if ($handle === false) {
        return false;
    }
    $firstLine = fgetcsv($handle);
    fclose($handle);
    return is_array($firstLine) && $firstLine === $expectedHeader;
}

/** Preserves an old-schema CSV instead of silently mixing rows with different columns. */
function rotateStaleCsv(string $path, string $storageDir): bool
{
    $modifiedAt = @filemtime($path);
    $stamp = gmdate('Y-m-d\THis\Z', $modifiedAt !== false ? $modifiedAt : time());
    $archivePath = $storageDir . '/enquiries-' . $stamp . '.csv';
    $suffix = 2;
    while (file_exists($archivePath)) {
        $archivePath = $storageDir . '/enquiries-' . $stamp . '-' . $suffix . '.csv';
        $suffix++;
    }
    return @rename($path, $archivePath);
}

/** Flushes a CSV file, syncing file contents when the PHP runtime supports it. */
function syncFile($handle): bool
{
    return @fflush($handle) && (!function_exists('fsync') || @fsync($handle));
}

/**
 * Ensures one row exists for this submission key and returns the persisted row.
 * Caller holds enquiries.csv.lock. Rewriting through a temporary file means a
 * process death cannot leave a partially appended lead that a retry duplicates.
 */
function persistCsvRow(string $path, string $storageDir, array $header, array $newRow, string $submissionKey): array
{
    if (!csvHeaderMatches($path, $header) && !rotateStaleCsv($path, $storageDir)) {
        return ['ok' => false, 'row' => null];
    }

    $rows = [];
    if (file_exists($path) && @filesize($path) > 0) {
        $input = @fopen($path, 'r');
        if ($input === false || fgetcsv($input) !== $header) {
            if ($input !== false) {
                fclose($input);
            }
            return ['ok' => false, 'row' => null];
        }
        while (($existingRow = fgetcsv($input)) !== false) {
            if (count($existingRow) !== count($header)) {
                fclose($input);
                return ['ok' => false, 'row' => null];
            }
            if (($existingRow[7] ?? null) === $submissionKey) {
                fclose($input);
                return ['ok' => true, 'row' => $existingRow];
            }
            $rows[] = $existingRow;
        }
        fclose($input);
    }

    $temporaryPath = $path . '.' . bin2hex(random_bytes(8)) . '.tmp';
    $output = @fopen($temporaryPath, 'xb');
    if ($output === false) {
        return ['ok' => false, 'row' => null];
    }
    @chmod($temporaryPath, 0600);
    $ok = fputcsv($output, $header) !== false;
    foreach ($rows as $existingRow) {
        if (!$ok || fputcsv($output, $existingRow) === false) {
            $ok = false;
            break;
        }
    }
    if ($ok && fputcsv($output, $newRow) === false) {
        $ok = false;
    }
    if ($ok) {
        $ok = syncFile($output);
    }
    fclose($output);

    if (!$ok || !@rename($temporaryPath, $path)) {
        @unlink($temporaryPath);
        return ['ok' => false, 'row' => null];
    }
    return ['ok' => true, 'row' => $newRow];
}

/** Stable hash of the fields whose exact contents will be sent to recipients. */
function enquiryPayloadHash(array $values): string
{
    return hash('sha256', implode("\x1f", $values));
}

$csvLockPath = $STORAGE_DIR . '/enquiries.csv.lock';
$csvLock = @fopen($csvLockPath, 'c');
$csvWritten = false;
$persistedRow = null;

if ($csvLock !== false && flock($csvLock, LOCK_EX)) {
    $submittedAt = gmdate('c');
    $row = [
        $submittedAt,
        $individualName,
        $businessEmail,
        $entityName,
        $bestNumberToCall,
        $comments,
        substr(hash('sha256', $clientIp), 0, 16),
        $submissionKey,
    ];
    $csvResult = persistCsvRow($csvPath, $STORAGE_DIR, CSV_HEADER, $row, $submissionKey);
    $csvWritten = $csvResult['ok'];
    $persistedRow = $csvResult['row'];
    flock($csvLock, LOCK_UN);
}
if ($csvLock !== false) {
    fclose($csvLock);
}

if (!$csvWritten || !is_array($persistedRow)) {
    logLine($STORAGE_DIR, 'csv_write_failed');
    releaseSubmissionLock($submissionLock);
    respond(500, ['ok' => false, 'error' => 'not_recorded']);
}

$persistedValues = [
    (string) $persistedRow[1],
    (string) $persistedRow[2],
    (string) $persistedRow[3],
    (string) $persistedRow[4],
    (string) $persistedRow[5],
];
$payloadHash = enquiryPayloadHash($persistedValues);
if (!hash_equals($payloadHash, enquiryPayloadHash([
    $individualName,
    $businessEmail,
    $entityName,
    $bestNumberToCall,
    $comments,
]))) {
    logLine($STORAGE_DIR, 'submission_payload_mismatch');
    releaseSubmissionLock($submissionLock);
    respond(409, ['ok' => false, 'error' => 'idempotency_key_conflict', 'recorded' => true]);
}

// Continue retries from the original row so pending recipients never receive edited content.
$submittedAt = (string) $persistedRow[0];
$individualName = $persistedValues[0];
$businessEmail = $persistedValues[1];
$entityName = $persistedValues[2];
$bestNumberToCall = $persistedValues[3];
$comments = $persistedValues[4];

if (file_exists($deliveryStatePath)) {
    $deliveryState = json_decode((string) @file_get_contents($deliveryStatePath), true);
    if (!is_array($deliveryState)) {
        logLine($STORAGE_DIR, 'delivery_state_invalid');
        releaseSubmissionLock($submissionLock);
        respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true]);
    }
} else {
    $deliveryState = null;
}

$validatedRecipients = array_map('headerSafe', $RECIPIENTS);
$recipientsValid = count($validatedRecipients) >= 2
    && count($validatedRecipients) === count($RECIPIENTS)
    && count(array_unique(array_map('strtolower', $validatedRecipients))) === count($validatedRecipients)
    && !in_array('', $validatedRecipients, true);
foreach ($validatedRecipients as $recipient) {
    if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        $recipientsValid = false;
        break;
    }
}

if (!$recipientsValid) {
    logLine($STORAGE_DIR, 'recipient_config_invalid count=' . count($RECIPIENTS) . ' csv=ok');
    releaseSubmissionLock($submissionLock);
    respond(500, ['ok' => false, 'error' => 'recipient_configuration_invalid', 'recorded' => true]);
}

$requiredRecipientIds = array_map(
    static fn(string $recipient): string => hash('sha256', strtolower($recipient)),
    $validatedRecipients
);
$sortedRequiredRecipientIds = $requiredRecipientIds;
sort($sortedRequiredRecipientIds, SORT_STRING);

if ($deliveryState === null) {
    $deliveryState = [
        'version' => 1,
        'payload_hash' => $payloadHash,
        'required' => $requiredRecipientIds,
        'accepted' => [],
    ];
    $stateJson = json_encode($deliveryState, JSON_UNESCAPED_SLASHES);
    if (!is_string($stateJson) || !atomicWriteFile($deliveryStatePath, $stateJson)) {
        logLine($STORAGE_DIR, 'delivery_state_write_failed');
        releaseSubmissionLock($submissionLock);
        respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true]);
    }
} else {
    $storedRequired = $deliveryState['required'] ?? null;
    $storedAccepted = $deliveryState['accepted'] ?? null;
    if (
        ($deliveryState['version'] ?? null) !== 1
        || !is_string($deliveryState['payload_hash'] ?? null)
        || !hash_equals($payloadHash, $deliveryState['payload_hash'])
        || !is_array($storedRequired)
        || count($storedRequired) !== count($requiredRecipientIds)
        || !is_array($storedAccepted)
    ) {
        logLine($STORAGE_DIR, 'delivery_state_invalid');
        releaseSubmissionLock($submissionLock);
        respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true]);
    }
    foreach ($storedRequired as $requiredId) {
        if (!is_string($requiredId) || preg_match('/^[a-f0-9]{64}$/', $requiredId) !== 1) {
            logLine($STORAGE_DIR, 'delivery_state_invalid');
            releaseSubmissionLock($submissionLock);
            respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true]);
        }
    }
    $storedRequired = array_values($storedRequired);
    sort($storedRequired, SORT_STRING);
    if ($storedRequired !== $sortedRequiredRecipientIds) {
        logLine($STORAGE_DIR, 'recipient_set_changed');
        releaseSubmissionLock($submissionLock);
        respond(409, ['ok' => false, 'error' => 'recipient_configuration_changed', 'recorded' => true]);
    }
    foreach ($storedAccepted as $acceptedId) {
        if (
            !is_string($acceptedId)
            || preg_match('/^[a-f0-9]{64}$/', $acceptedId) !== 1
            || !in_array($acceptedId, $requiredRecipientIds, true)
        ) {
            logLine($STORAGE_DIR, 'delivery_state_invalid');
            releaseSubmissionLock($submissionLock);
            respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true]);
        }
    }
    $deliveryState['required'] = $requiredRecipientIds;
    $deliveryState['accepted'] = array_values(array_unique($storedAccepted));
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

$lines = [
    'A new enquiry was submitted on ascend-rev.ca.',
    '',
    'Name             : ' . $individualName,
    'Business email   : ' . $businessEmail,
    'Entity           : ' . $entityName,
    'Phone            : ' . $bestNumberToCall,
    '',
    'Comments:',
    $comments !== '' ? $comments : '(none)',
    '',
    '---',
    'Submitted ' . $submittedAt . ' UTC',
    $csvWritten ? 'Also recorded in enquiries.csv' : 'WARNING: could not be written to enquiries.csv',
];

$subject = headerSafe(sprintf(
    '[AscendRev] Enquiry from %s at %s',
    $individualName,
    $entityName
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

$html = '<!DOCTYPE html><html><head><meta charset="utf-8">'
    . '<meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>New enquiry</title></head>'
    . '<body style="margin:0;padding:0;background:#eef1f5;">'

    // Preheader: the grey line inboxes show beside the subject. Hidden in the
    // body itself, which is why it carries the zero-height styling.
    . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">'
    . e($individualName) . ' at ' . e($entityName)
    . '</div>'

    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef1f5;padding:28px 12px;">'
    . '<tr><td align="center">'
    . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,27,51,.10);">'

    // Header band, white. The wordmark is navy, so white is the background the
    // logo was drawn for and it needs no treatment behind it. The logo is
    // embedded by Content-ID rather than hotlinked, so it displays without the
    // recipient clicking "show images".
    //
    // The 230px-wide logo remains sharp on a retina screen.
    . '<tr><td style="background:#ffffff;padding:24px 32px 20px;">'
    . '<img src="cid:ascendrev-logo" width="230" height="77" alt="AscendRev"'
    . ' style="display:block;border:0;width:230px;height:auto;">'
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
    . e($individualName) . '</h1>'
    . '<p style="margin:6px 0 0;font:400 15px/22px Arial,Helvetica,sans-serif;color:#4B5563;">'
    . e($entityName) . '</p>'
    . '</td></tr>'

    . '<tr><td style="padding:14px 32px 4px;">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
    . row('Business email', $businessEmail)
    . row('Entity name', $entityName)
    . row('Phone', $bestNumberToCall)
    . '</table></td></tr>';

if ($comments !== '') {
    $html .= '<tr><td style="padding:22px 32px 0;">'
        . '<p style="margin:0 0 8px;font:600 12px/16px Arial,Helvetica,sans-serif;color:#6b7484;text-transform:uppercase;letter-spacing:.05em;">Comments</p>'
        . '<div style="background:#f6f8fa;border-left:3px solid #EBCB89;padding:14px 16px;border-radius:0 4px 4px 0;'
        . 'font:400 15px/23px Arial,Helvetica,sans-serif;color:#111827;white-space:pre-wrap;">'
        . e($comments) . '</div></td></tr>';
}

$html .= '<tr><td style="padding:26px 32px 4px;">'
    . '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
    . '<td style="background:#1E5E46;border-radius:6px;">'
    . '<a href="mailto:' . e($businessEmail) . '?subject=' . rawurlencode('Re: your enquiry to AscendRev')
    . '" style="display:inline-block;padding:13px 26px;font:600 14px/18px Arial,Helvetica,sans-serif;'
    . 'color:#ffffff;text-decoration:none;">Reply to ' . e($individualName) . '</a>'
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

$logoPath = dirname(__DIR__) . '/new-logo.png';
if (is_readable($logoPath)) {
    $logoData = @file_get_contents($logoPath);
    if ($logoData !== false) {
        $mime .= '--' . $boundaryRelated . "\r\n"
            . 'Content-Type: image/png; name="new-logo.png"' . "\r\n"
            . 'Content-Transfer-Encoding: base64' . "\r\n"
            . 'Content-ID: <ascendrev-logo>' . "\r\n"
            . 'Content-Disposition: inline; filename="new-logo.png"' . "\r\n\r\n"
            . chunk_split(base64_encode($logoData), 76, "\r\n") . "\r\n";
    }
}

$mime .= '--' . $boundaryRelated . '--' . "\r\n";

$headers = implode("\r\n", [
    'From: AscendRev Website <' . headerSafe($MAIL_FROM) . '>',
    'Reply-To: ' . headerSafe($individualName) . ' <' . headerSafe($businessEmail) . '>',
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
    array $recipients,
    string $subject,
    string $body,
    string $headers
): bool {
    if (
        $host === '' ||
        $user === '' ||
        $pass === '' ||
        $from === '' ||
        $recipients === []
    ) {
        return false;
    }

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
    if ($ok) {
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
    foreach ($recipients as $recipient) {
        if (!$ok) {
            break;
        }
        $write('RCPT TO:<' . $recipient . '>');
        $ok = $expect($read(), '250');
    }
    if ($ok) {
        $write('DATA');
        $ok = $expect($read(), '354');
    }
    if ($ok) {
        // Normalise to CRLF exactly once. The body may already be CRLF
        // (MIME) or LF (plain text); collapsing first makes both safe.
        $normalised = preg_replace("/\r\n?|\n/", "\n", $body) ?? $body;
        // Dot-stuffing: a line of a single "." would end the message early.
        $payload = preg_replace('/^\./m', '..', $normalised) ?? $normalised;
        $payload = str_replace("\n", "\r\n", $payload);
        $write(
            $headers . "\r\n"
            . 'To: ' . implode(', ', $recipients) . "\r\n"
            . 'Subject: ' . $subject . "\r\n"
            . 'Date: ' . gmdate('r') . "\r\n"
            . "\r\n"
            . $payload . "\r\n."
        );
        $ok = $expect($read(), '250');
    }

    $write('QUIT');
    fclose($socket);

    return $ok;
}

$from = headerSafe($MAIL_FROM);
$fromValid = (bool) filter_var($from, FILTER_VALIDATE_EMAIL);
$checkpointFailed = false;

// SMTP and local state cannot commit atomically: a crash after remote 250 but
// before this checkpoint can make a retry send that recipient again.
foreach ($validatedRecipients as $index => $recipient) {
    $recipientId = $requiredRecipientIds[$index];
    if (in_array($recipientId, $deliveryState['accepted'], true)) {
        continue;
    }
    if (!$fromValid) {
        continue;
    }

    // Use one SMTP transaction per recipient so a rejected RCPT does not block another.
    $recipientAccepted = smtpSend(
        $SMTP_HOST,
        $SMTP_PORT,
        $SMTP_USER,
        $SMTP_PASS,
        $from,
        [$recipient],
        $subject,
        $mime,
        $headers
    );
    if (!$recipientAccepted) {
        continue;
    }

    $deliveryState['accepted'][] = $recipientId;
    $deliveryState['accepted'] = array_values(array_unique($deliveryState['accepted']));
    $stateJson = json_encode($deliveryState, JSON_UNESCAPED_SLASHES);
    if (!is_string($stateJson) || !atomicWriteFile($deliveryStatePath, $stateJson)) {
        $checkpointFailed = true;
        break;
    }
}

$acceptedRecipientCount = count(array_intersect($requiredRecipientIds, $deliveryState['accepted']));
$mailDelivered = !$checkpointFailed && $acceptedRecipientCount === count($requiredRecipientIds);

if (!$mailDelivered) {
    logLine(
        $STORAGE_DIR,
        'mail_delivery_incomplete accepted=' . $acceptedRecipientCount
            . ' required=' . count($requiredRecipientIds)
            . ' checkpoint=' . ($checkpointFailed ? 'failed' : 'ok')
    );
}

/* ---------------------------------------------------------------------------
 * Outcome.
 *
 * The browser treats every 2xx as success. Do not return one until the durable
 * row and each configured recipient's SMTP DATA 250 are checkpointed.
 * ------------------------------------------------------------------------ */

$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);

releaseSubmissionLock($submissionLock);

if (!$csvWritten) {
    respond(500, ['ok' => false, 'error' => 'not_recorded']);
}
if (!$mailDelivered) {
    respond(503, ['ok' => false, 'error' => 'delivery_incomplete', 'recorded' => true]);
}

respond(200, ['ok' => true, 'mailed' => true, 'recorded' => true]);
