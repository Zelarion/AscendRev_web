<?php
/**
 * Shared core for the AscendRev PHP handlers (enquiry.php, careers.php).
 *
 * Everything here is generic: configuration lookup, the request gates, the
 * durable-write helpers, the per-recipient delivery state, the SMTP client and
 * the cron outbox sweep. What is specific to one form (its fields, its CSV
 * columns, its email) stays in the entry script, which hands those in as data
 * or as a callable.
 *
 * An entry script must define HANDLER_LOG_FILE before requiring this file. The
 * guard below makes a direct request for this URL return nothing at all rather
 * than run half a handler; lib/.htaccess denies the URL on top of that.
 */

declare(strict_types=1);

if (!defined('HANDLER_LOG_FILE')) {
    return;
}

/** Submissions per IP are counted over this window. */
const RATE_LIMIT_WINDOW_SECONDS = 3600;

/**
 * Delivery attempts (the web request counts as the first) before a submission is
 * given up on. Bounded so a permanently rejected recipient cannot be retried
 * forever; the CSV row still holds the lead for a human to follow up.
 */
const MAX_DELIVERY_ATTEMPTS = 8;

/** Retry backoff is 60s doubled per attempt, capped here. */
const RETRY_BACKOFF_CAP_SECONDS = 3600;

/** Must match DISPOSABLE_MAILBOX_DOMAINS in src/lib/enquirySchema.ts. */
const DISPOSABLE_MAILBOX_DOMAINS = [
    '10minutemail.com', 'dispostable.com', 'guerrillamail.com', 'mailinator.com',
    'sharklasers.com', 'temp-mail.org', 'throwawaymail.com', 'trashmail.com', 'yopmail.com',
];

/** Characters that cannot belong in a name. Mirrors the client rule exactly. */
const FORBIDDEN_NAME_CHARACTERS = '0123456789@<>{}[]\\/|_=+*#$%^~`';

/** Characters a phone number may contain. Mirrors PHONE_CHARACTERS_PATTERN in src/lib/enquirySchema.ts. */
const PHONE_ALLOWED_PATTERN = '/^[0-9 ()+.-]+$/';

/* ---------------------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------------------ */

/**
 * The directory that holds private runtime files: one level above public_html.
 * A web request gets it from the document root. The cron retry has no document
 * root, so it derives the same place from this file's own location
 * (public_html/api/enquiry.php). This file sits one directory deeper
 * (public_html/api/lib/), which is why the climb is three levels, not two.
 */
function accountRoot(): string
{
    $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    return $documentRoot !== '' ? dirname($documentRoot) : dirname(__DIR__, 3);
}

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
        $path = accountRoot() . '/ascendrev-enquiry.config.php';
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
 * Google Workspace SMTP transport.
 *
 * cPanel must submit through the configured Google Workspace account; do not
 * fall back to the host MTA when authenticated SMTP is unavailable.
 *
 * The password is read from the environment or the out-of-root config file and
 * is never written to a log, never returned in a response, and never placed in
 * a header.
 */
function smtpSettings(): array
{
    return [
        'host' => config('ASCENDREV_SMTP_HOST', 'smtp.gmail.com'),
        'port' => (int) (config('ASCENDREV_SMTP_PORT', '587') ?: 587),
        'user' => config('ASCENDREV_SMTP_USER', ''),
        'pass' => config('ASCENDREV_SMTP_PASS', ''),
        // Test harness only: a private CA to trust instead of the system store, so
        // the delivery tests can talk STARTTLS to a local fake server with full
        // certificate verification. Unset in production.
        'cafile' => config('ASCENDREV_SMTP_CAFILE', ''),
    ];
}

/**
 * Hosts allowed to submit. Origin/Referer must match one of these.
 *
 * @return string[]
 */
function allowedHosts(): array
{
    return array_values(array_filter(array_map(
        'trim',
        explode(',', config('ASCENDREV_ALLOWED_HOSTS', 'ascend-rev.ca,www.ascend-rev.ca,localhost'))
    )));
}

/* ---------------------------------------------------------------------------
 * Response helpers
 * ------------------------------------------------------------------------ */

/**
 * Emits a JSON response without ending the script, so the caller can hand the
 * response to the browser and keep working. No submitted value is ever placed
 * in the body, so there is nothing for a caller to reflect back into a page.
 */
function sendJson(int $status, array $body): void
{
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    // 204 means "no content", so it must not carry one. Sending a body with it
    // makes some clients treat the response as malformed.
    if ($status === 204) {
        return;
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
}

/** Ends the request with JSON. */
function respond(int $status, array $body): never
{
    sendJson($status, $body);
    exit;
}

/**
 * Operational logging only. Never the submission body : an address and a
 * reason are enough to diagnose a problem and are not a copy of someone's
 * personal data sitting in a log file. Each entry script names its own file in
 * HANDLER_LOG_FILE so two forms sharing a host do not interleave their logs.
 */
function logLine(string $storageDir, string $message): void
{
    if (!is_dir($storageDir)) {
        return;
    }
    @file_put_contents(
        $storageDir . '/' . HANDLER_LOG_FILE,
        sprintf("%s  %s\n", gmdate('c'), $message),
        FILE_APPEND | LOCK_EX
    );
}

/* ---------------------------------------------------------------------------
 * Request gates
 *
 * Each gate answers and ends the request when it refuses; returning means the
 * request may continue to the next one. Order matters and is fixed by the entry
 * script: origin, method, rate limit, unknown fields, honeypot.
 * ------------------------------------------------------------------------ */

/**
 * Gate 1: origin, plus CORS and the OPTIONS preflight.
 *
 * Checked before the method, because a cross-origin browser request may arrive
 * as an OPTIONS preflight that must be answered rather than refused.
 *
 * A static export cannot issue a per-session CSRF token, because there is no
 * server to issue one at page render. Checking that the request came from our
 * own origin is the strongest control available here, and it is checked
 * strictly: a missing Origin AND a missing Referer is a rejection, not a pass.
 *
 * @param string[] $allowedHosts
 */
function gateOrigin(array $allowedHosts): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    $sourceHost = '';

    if ($origin !== '') {
        $sourceHost = (string) parse_url($origin, PHP_URL_HOST);
    } elseif ($referer !== '') {
        $sourceHost = (string) parse_url($referer, PHP_URL_HOST);
    }

    $originAllowed = $sourceHost !== ''
        && in_array(strtolower($sourceHost), array_map('strtolower', $allowedHosts), true);

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
}

/** Gate 2: method. Fail closed: anything that is not POST is refused. */
function gateMethod(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST, OPTIONS');
        respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
    }
}

/** The address the request arrived from, as PHP sees it. */
function clientIp(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Gate 3: rate limit, per IP. Refuses with 429 once the IP has used its budget
 * for the window. Returns the state the caller needs to record a hit later, so
 * a request that fails validation does not spend the visitor's budget.
 *
 * @return array{file: string, hits: int[], now: int}
 */
function gateRateLimit(string $storageDir, int $maxPerWindow): array
{
    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0750, true);
    }

    $rateFile = $storageDir . '/rate-' . hash('sha256', clientIp()) . '.json';

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

    if (count($hits) >= $maxPerWindow) {
        logLine($storageDir, 'rate_limited');
        header('Retry-After: ' . RATE_LIMIT_WINDOW_SECONDS);
        respond(429, ['ok' => false, 'error' => 'rate_limited']);
    }

    return ['file' => $rateFile, 'hits' => $hits, 'now' => $now];
}

/**
 * Gate 4: unknown fields.
 *
 * Rejected rather than ignored (SPEC.md §6). Silently dropping an unexpected
 * field hides both a client bug and a probe.
 *
 * @param string[] $allowedFields
 */
function gateUnknownFields(array $allowedFields): void
{
    foreach (array_keys($_POST) as $key) {
        if (!in_array($key, $allowedFields, true)) {
            respond(422, ['ok' => false, 'error' => 'unknown_field']);
        }
    }
}

/**
 * Gate 5: honeypot.
 *
 * The named field is rendered visually hidden with tabindex="-1" and
 * autocomplete="off". A person never fills it in. A bot filling every input
 * always does. Answered with 200 on purpose: a bot that is told it failed
 * learns something, a bot that is thanked does not.
 */
function gateHoneypot(string $storageDir, string $fieldName): void
{
    if (trim((string) ($_POST[$fieldName] ?? '')) !== '') {
        logLine($storageDir, 'honeypot_tripped');
        respond(200, ['ok' => true]);
    }
}

/**
 * The submission key when the browser sent a usable idempotency key, else null
 * so the caller falls back to a content hash.
 *
 * The browser generates the key once per intent to send, and keeps it across
 * retries. When it is present it is authoritative, because it survives the case
 * a content hash cannot: a visitor who edits one word and resends after a
 * timeout is retrying the same intent, not filing a new lead.
 *
 * Length- and charset-constrained before use, because it becomes part of a
 * filename. Anything unexpected falls back to the content hash rather than
 * being trusted.
 */
function clientSubmissionKey(): ?string
{
    $clientKey = field('idempotencyKey');
    $usable = $clientKey !== ''
        && strlen($clientKey) <= 64
        && preg_match('/^[A-Za-z0-9._-]+$/', $clientKey) === 1;

    return $usable ? hash('sha256', 'client:' . $clientKey) : null;
}

/* ---------------------------------------------------------------------------
 * Validation helpers
 * ------------------------------------------------------------------------ */

/** Reads a scalar field as a trimmed string, whatever the browser sent. */
function field(string $name): string
{
    $raw = $_POST[$name] ?? '';
    return is_string($raw) ? trim($raw) : '';
}

/** Names are checked for characters that cannot belong in one, not against a
 *  whitelist of letters : a whitelist rejects Garcia-Lopez and O'Brien too. */
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

/* ---------------------------------------------------------------------------
 * Durable writes
 * ------------------------------------------------------------------------ */

/** Releases the per-submission lock before any response path exits. */
function releaseSubmissionLock($handle): void
{
    if (is_resource($handle)) {
        @flock($handle, LOCK_UN);
        fclose($handle);
    }
}

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
    // Named after the file being rotated (enquiries.csv -> enquiries-<stamp>.csv).
    $prefix = basename($path, '.csv');
    $archivePath = $storageDir . '/' . $prefix . '-' . $stamp . '.csv';
    $suffix = 2;
    while (file_exists($archivePath)) {
        $archivePath = $storageDir . '/' . $prefix . '-' . $stamp . '-' . $suffix . '.csv';
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
 * $keyColumn is the index of the submission_key column in $header.
 * Caller holds the CSV's lock file. Rewriting through a temporary file means a
 * process death cannot leave a partially appended lead that a retry duplicates.
 */
function persistCsvRow(string $path, string $storageDir, array $header, array $newRow, string $submissionKey, int $keyColumn): array
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
            if (($existingRow[$keyColumn] ?? null) === $submissionKey) {
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

/* ---------------------------------------------------------------------------
 * Delivery state
 *
 * One JSON file per submission, written only by code holding that submission's
 * lock. `version` stays 1: readers ignore keys they do not know, so files
 * written before the retry fields existed still load, with attempts read as 0.
 *
 *   accepted         recipient ids the server has acknowledged with a 250
 *   attempts         delivery attempts made, the web request being the first
 *   last_attempt_at  unix time of the latest attempt, for retry backoff
 *   terminal         absent, or 'abandoned' once attempts ran out
 * ------------------------------------------------------------------------ */

/** Writes the delivery state atomically, so a crash never leaves half a file. */
function writeDeliveryState(string $path, array $state): bool
{
    $json = json_encode($state, JSON_UNESCAPED_SLASHES);
    return is_string($json) && atomicWriteFile($path, $json);
}

/**
 * At least $minimum recipients (two for enquiries, so no lead depends on a
 * single mailbox; careers allows one). Returns the header-safe list, or null
 * when the configuration cannot be trusted.
 */
function validateRecipients(array $recipients, int $minimum = 2): ?array
{
    $validated = array_map('headerSafe', $recipients);
    if (
        count($validated) < $minimum
        || count(array_unique(array_map('strtolower', $validated))) !== count($validated)
        || in_array('', $validated, true)
    ) {
        return null;
    }
    foreach ($validated as $recipient) {
        if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
            return null;
        }
    }
    return $validated;
}

/**
 * Recipients are identified in state by a hash of the address, so the state file
 * holds no address. Ids stay parallel to the recipient list.
 */
function recipientIds(array $recipients): array
{
    return array_map(
        static fn(string $recipient): string => hash('sha256', strtolower($recipient)),
        $recipients
    );
}

/** How many of the required recipients the server has acknowledged. */
function acceptedCount(array $state, array $requiredIds): int
{
    return count(array_intersect($requiredIds, $state['accepted']));
}

/**
 * Validates a loaded state file against this payload and the configured
 * recipients. Returns the normalised state, or a problem: 'invalid' for a file
 * that cannot be trusted, 'recipients_changed' when the configured recipients no
 * longer match the ones the state was created for.
 *
 * @return array{problem: ?string, state: ?array}
 */
function checkDeliveryState(array $state, string $payloadHash, array $requiredIds): array
{
    $invalid = ['problem' => 'invalid', 'state' => null];
    $storedRequired = $state['required'] ?? null;
    $storedAccepted = $state['accepted'] ?? null;

    if (
        ($state['version'] ?? null) !== 1
        || !is_string($state['payload_hash'] ?? null)
        || !hash_equals($payloadHash, $state['payload_hash'])
        || !is_array($storedRequired)
        || count($storedRequired) !== count($requiredIds)
        || !is_array($storedAccepted)
    ) {
        return $invalid;
    }
    // Absent is fine (older files); present must be exactly what this handler
    // writes, so an unrecognised value fails closed rather than passing.
    foreach (['attempts', 'last_attempt_at'] as $counter) {
        if (array_key_exists($counter, $state) && (!is_int($state[$counter]) || $state[$counter] < 0)) {
            return $invalid;
        }
    }
    if (array_key_exists('terminal', $state) && $state['terminal'] !== 'abandoned') {
        return $invalid;
    }
    foreach ($storedRequired as $requiredId) {
        if (!is_string($requiredId) || preg_match('/^[a-f0-9]{64}$/', $requiredId) !== 1) {
            return $invalid;
        }
    }
    $storedRequired = array_values($storedRequired);
    $sortedRequired = $requiredIds;
    sort($storedRequired, SORT_STRING);
    sort($sortedRequired, SORT_STRING);
    if ($storedRequired !== $sortedRequired) {
        return ['problem' => 'recipients_changed', 'state' => null];
    }
    foreach ($storedAccepted as $acceptedId) {
        if (
            !is_string($acceptedId)
            || preg_match('/^[a-f0-9]{64}$/', $acceptedId) !== 1
            || !in_array($acceptedId, $requiredIds, true)
        ) {
            return $invalid;
        }
    }

    $state['required'] = $requiredIds;
    $state['accepted'] = array_values(array_unique($storedAccepted));
    return ['problem' => null, 'state' => $state];
}

/* ---------------------------------------------------------------------------
 * Mail helpers
 * ------------------------------------------------------------------------ */

/** Strips anything that could break out of a header value. */
function headerSafe(string $value): string
{
    return trim(str_replace(["\r", "\n", "\0"], '', $value));
}

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

/* ---------------------------------------------------------------------------
 * SMTP
 * ------------------------------------------------------------------------ */

/**
 * The three-digit SMTP reply code, or 'none' when the server said nothing
 * (connection dropped or timed out), which is itself a diagnosis.
 */
function smtpReplyCode(string $reply): string
{
    return preg_match('/^(\d{3})[ -]/', $reply, $match) === 1 ? $match[1] : 'none';
}

/** The RFC 3463 enhanced status (x.y.z) from a reply, or 'none' when absent. */
function smtpEnhancedCode(string $reply): string
{
    // A multiline reply repeats the enhanced code on every line; the last is the verdict.
    return preg_match_all('/^\d{3}[ -](\d\.\d{1,3}\.\d{1,3})(?=\s|$)/m', $reply, $matches) > 0
        ? end($matches[1])
        : 'none';
}

/**
 * Logs where an SMTP conversation failed. Stage and codes only: the reply text
 * can quote the recipient or the account, so it is never written to the log.
 */
function logSmtpFailure(string $storageDir, string $stage, string $reply, ?int $errno = null): void
{
    logLine($storageDir, sprintf(
        'smtp_failed stage=%s code=%s enhanced=%s%s',
        $stage,
        smtpReplyCode($reply),
        smtpEnhancedCode($reply),
        $errno === null ? '' : ' errno=' . $errno
    ));
}

/**
 * Minimal SMTP submission over STARTTLS with AUTH LOGIN.
 *
 * Deliberately dependency-free: the site ships no Composer vendor tree, and
 * pulling one in for a single send would be a new supply chain on the client's
 * host.
 *
 * One session serves every pending recipient. Connecting, STARTTLS and AUTH
 * cost several round trips each, so paying them once per recipient is what made
 * a submission take over ten seconds. Each recipient still gets its own message
 * and its own transaction, so a rejected address cannot block another.
 *
 * $onAccepted runs immediately after the server's 250 to the final dot, with
 * the recipient id, so the checkpoint is durable before the next recipient is
 * attempted. It returns false to stop the session (checkpoint could not be
 * written). A recipient counts as delivered only through that callback, never
 * from a partial conversation.
 *
 * @param array<string,string> $pending recipient id => address
 */
function smtpDeliver(
    array $smtp,
    string $storageDir,
    string $from,
    array $pending,
    string $subject,
    string $body,
    string $headers,
    callable $onAccepted
): void {
    if ($smtp['host'] === '' || $smtp['user'] === '' || $smtp['pass'] === '' || $from === '' || $pending === []) {
        logLine($storageDir, 'smtp_config_incomplete');
        return;
    }

    // Verification is never relaxed. A cafile only swaps which roots are trusted.
    $context = $smtp['cafile'] === ''
        ? null
        : stream_context_create(['ssl' => [
            'cafile' => $smtp['cafile'],
            'peer_name' => $smtp['host'],
            'verify_peer' => true,
            'verify_peer_name' => true,
        ]]);

    $socket = @stream_socket_client(
        sprintf('tcp://%s:%d', $smtp['host'], $smtp['port']),
        $errno,
        $errstr,
        20,
        STREAM_CLIENT_CONNECT,
        $context
    );
    if ($socket === false) {
        logSmtpFailure($storageDir, 'connect', '', $errno);
        return;
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
    // A fwrite on a TLS stream can accept fewer bytes than it was given. That
    // never mattered for a few kilobytes of text; a message carrying a 5 MB
    // attachment must be written out in full or the server sees a truncated DATA.
    $write = static function (string $line) use ($socket): void {
        $remaining = $line . "\r\n";
        while ($remaining !== '') {
            $written = @fwrite($socket, $remaining);
            if ($written === false || $written === 0) {
                return;
            }
            $remaining = substr($remaining, $written);
        }
    };

    // No reply at all means the connection is gone; there is nothing to RSET.
    $connectionLost = false;
    $step = static function (string $stage, string $code) use ($read, $storageDir, &$connectionLost): bool {
        $reply = $read();
        if (str_starts_with(trim($reply), $code)) {
            return true;
        }
        logSmtpFailure($storageDir, $stage, $reply);
        $connectionLost = smtpReplyCode($reply) === 'none';
        return false;
    };

    $ready = $step('greeting', '220');
    if ($ready) {
        $write('EHLO ascend-rev.ca');
        $ready = $step('ehlo', '250');
    }
    if ($ready) {
        $write('STARTTLS');
        $ready = $step('starttls', '220');
    }
    if ($ready && !@stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
        logSmtpFailure($storageDir, 'tls', '');
        $ready = false;
    }
    if ($ready) {
        // EHLO again: the capability list before and after TLS are different
        // sessions as far as the server is concerned.
        $write('EHLO ascend-rev.ca');
        $ready = $step('ehlo_tls', '250');
    }
    if ($ready) {
        $write('AUTH LOGIN');
        $ready = $step('auth', '334');
    }
    if ($ready) {
        $write(base64_encode($smtp['user']));
        $ready = $step('auth', '334');
    }
    if ($ready) {
        $write(base64_encode($smtp['pass']));
        $ready = $step('auth', '235');
    }

    if ($ready) {
        // Normalise to CRLF exactly once. The body may already be CRLF
        // (MIME) or LF (plain text); collapsing first makes both safe.
        $normalised = preg_replace("/\r\n?|\n/", "\n", $body) ?? $body;
        // Dot-stuffing: a line of a single "." would end the message early.
        $payload = preg_replace('/^\./m', '..', $normalised) ?? $normalised;
        $payload = str_replace("\n", "\r\n", $payload);

        foreach ($pending as $recipientId => $recipient) {
            $write('MAIL FROM:<' . $from . '>');
            $sent = $step('mail_from', '250');
            if ($sent) {
                $write('RCPT TO:<' . $recipient . '>');
                $sent = $step('rcpt', '250');
            }
            if ($sent) {
                $write('DATA');
                $sent = $step('data', '354');
            }
            if ($sent) {
                $write(
                    $headers . "\r\n"
                    . 'To: ' . $recipient . "\r\n"
                    . 'Subject: ' . $subject . "\r\n"
                    . 'Date: ' . gmdate('r') . "\r\n"
                    . "\r\n"
                    . $payload . "\r\n."
                );
                $sent = $step('body', '250');
            }

            if ($sent) {
                if (!$onAccepted((string) $recipientId)) {
                    break;
                }
                continue;
            }
            if ($connectionLost) {
                break;
            }
            // Abandon the failed transaction so the next recipient starts clean.
            $write('RSET');
            if (!$step('rset', '250')) {
                break;
            }
        }
    }

    $write('QUIT');
    fclose($socket);
}

/* ---------------------------------------------------------------------------
 * Delivery attempt
 * ------------------------------------------------------------------------ */

/**
 * One delivery attempt for every recipient not yet acknowledged, over a single
 * SMTP session. Returns true when every required recipient is acknowledged and
 * checkpointed. Caller holds the submission lock.
 *
 * The message is built only when something is still pending, by the caller's
 * $buildMessage($from), so a replay of a finished submission never reads an
 * attachment or renders a template for nothing.
 *
 * @param array<string,string> $recipientsById recipient id => address
 * @param callable(string): array{subject: string, mime: string, headers: string} $buildMessage
 * @param 'background'|'sync'|'retry' $mode where the attempt ran, for the log
 */
function runDeliveryAttempt(
    array $smtp,
    string $storageDir,
    string $statePath,
    array $state,
    array $recipientsById,
    callable $buildMessage,
    string $from,
    string $mode
): bool {
    $started = microtime(true);
    $requiredIds = array_keys($recipientsById);

    // Counted and stored before sending, so an attempt that dies mid-session
    // still spends its share of the budget and cannot be retried forever.
    $state['attempts'] = (int) ($state['attempts'] ?? 0) + 1;
    $state['last_attempt_at'] = time();
    if (!writeDeliveryState($statePath, $state)) {
        logLine($storageDir, 'delivery_state_write_failed');
        return false;
    }

    $pending = array_diff_key($recipientsById, array_flip($state['accepted']));
    $checkpointFailed = false;

    // SMTP and local state cannot commit atomically: a crash after remote 250 but
    // before this checkpoint can make a retry send that recipient again.
    if ($pending !== [] && filter_var($from, FILTER_VALIDATE_EMAIL)) {
        $message = $buildMessage($from);
        smtpDeliver(
            $smtp,
            $storageDir,
            $from,
            $pending,
            $message['subject'],
            $message['mime'],
            $message['headers'],
            static function (string $recipientId) use (&$state, $statePath, &$checkpointFailed): bool {
                $state['accepted'][] = $recipientId;
                $state['accepted'] = array_values(array_unique($state['accepted']));
                if (!writeDeliveryState($statePath, $state)) {
                    $checkpointFailed = true;
                    return false;
                }
                return true;
            }
        );
    }

    $accepted = acceptedCount($state, $requiredIds);
    $complete = !$checkpointFailed && $accepted === count($requiredIds);

    logLine($storageDir, sprintf(
        'delivery_attempt accepted=%d required=%d mode=%s ms=%d%s',
        $accepted,
        count($requiredIds),
        $mode,
        (int) round((microtime(true) - $started) * 1000),
        $checkpointFailed ? ' checkpoint=failed' : ''
    ));

    if (!$complete && $state['attempts'] >= MAX_DELIVERY_ATTEMPTS) {
        // The CSV row still holds the lead; this only stops the automatic retries.
        $state['terminal'] = 'abandoned';
        writeDeliveryState($statePath, $state);
        logLine($storageDir, 'delivery_abandoned attempts=' . $state['attempts']);
    }

    return $complete;
}

/* ---------------------------------------------------------------------------
 * Misc
 * ------------------------------------------------------------------------ */

/**
 * The function that hands a finished response to the web server and frees the
 * visitor's connection while PHP keeps running, or null where there is none
 * (php -S, CLI). LiteSpeed's LSAPI is the production case; FastCGI covers hosts
 * that run PHP-FPM instead.
 */
function finishRequestFunction(): ?string
{
    foreach (['litespeed_finish_request', 'fastcgi_finish_request'] as $function) {
        if (function_exists($function)) {
            return $function;
        }
    }
    return null;
}

/** Records one submission against this IP's hourly budget. */
function recordRateHit(string $rateFile, array $hits, int $now): void
{
    $hits[] = $now;
    @file_put_contents($rateFile, json_encode($hits), LOCK_EX);
}

/* ---------------------------------------------------------------------------
 * Outbox retry
 * ------------------------------------------------------------------------ */

/** Seconds to wait after the given number of attempts: 60s doubling, capped. */
function retryBackoffSeconds(int $attempts): int
{
    return min(60 * (2 ** $attempts), RETRY_BACKOFF_CAP_SECONDS);
}

/** True when the state's accepted set already covers everything required. */
function stateIsComplete(array $state): bool
{
    $required = $state['required'] ?? null;
    $accepted = $state['accepted'] ?? null;
    return is_array($required) && $required !== [] && is_array($accepted)
        && array_diff($required, $accepted) === [];
}

/** The persisted CSV row for a submission key, or null when it cannot be read. */
function findCsvRow(string $path, array $header, int $keyColumn, string $submissionKey): ?array
{
    $input = @fopen($path, 'r');
    if ($input === false) {
        return null;
    }
    $found = null;
    if (fgetcsv($input) === $header) {
        while (($row = fgetcsv($input)) !== false) {
            if (count($row) === count($header) && $row[$keyColumn] === $submissionKey) {
                $found = $row;
                break;
            }
        }
    }
    fclose($input);
    return $found;
}

/**
 * One submission's retry, run while its lock is held.
 *
 * $loadSubmission($submissionKey) is the entry script's half of the job: it finds
 * the persisted row, logs why and returns null when it cannot, and otherwise
 * returns the payload hash of what was persisted plus a message builder for it.
 *
 * @param array<string,string> $recipientsById
 * @param callable(string): ?array{payload_hash: string, build: callable(string): array} $loadSubmission
 * @return string 'attempted' or 'skipped'
 */
function retryLocked(
    string $storageDir,
    string $submissionKey,
    array $recipientsById,
    array $smtp,
    string $from,
    ?int $minAgeOverride,
    callable $loadSubmission
): string {
    $statePath = $storageDir . '/delivery-' . $submissionKey . '.json';
    $state = json_decode((string) @file_get_contents($statePath), true);
    if (!is_array($state)) {
        logLine($storageDir, 'delivery_state_invalid');
        return 'skipped';
    }
    if (($state['terminal'] ?? null) === 'abandoned' || stateIsComplete($state)) {
        return 'skipped';
    }

    // Cheap age check before the CSV is read, so a backlog of not-yet-due
    // submissions costs a stat-sized read each rather than a CSV scan.
    $minAge = $minAgeOverride ?? retryBackoffSeconds((int) ($state['attempts'] ?? 0));
    if (time() - (int) ($state['last_attempt_at'] ?? 0) < $minAge) {
        return 'skipped';
    }

    $submission = $loadSubmission($submissionKey);
    if ($submission === null) {
        return 'skipped';
    }
    $payloadHash = $submission['payload_hash'];
    if (!is_string($state['payload_hash'] ?? null) || !hash_equals($payloadHash, $state['payload_hash'])) {
        logLine($storageDir, 'retry_payload_mismatch');
        return 'skipped';
    }

    $checked = checkDeliveryState($state, $payloadHash, array_keys($recipientsById));
    if ($checked['problem'] !== null) {
        logLine($storageDir, $checked['problem'] === 'recipients_changed' ? 'recipient_set_changed' : 'delivery_state_invalid');
        return 'skipped';
    }

    runDeliveryAttempt(
        $smtp,
        $storageDir,
        $statePath,
        $checked['state'],
        $recipientsById,
        $submission['build'],
        $from,
        'retry'
    );
    return 'attempted';
}

/**
 * Sweeps the outbox once. Returns the process exit code: 0 when the sweep ran,
 * 1 when the configuration prevents any delivery.
 *
 * @param string[] $recipients raw configured recipients
 * @param callable $loadSubmission see retryLocked()
 */
function runRetrySweep(
    string $storageDir,
    array $recipients,
    int $minimumRecipients,
    array $smtp,
    string $mailFrom,
    callable $loadSubmission
): int {
    $validated = validateRecipients($recipients, $minimumRecipients);
    if ($validated === null || !is_dir($storageDir)) {
        logLine($storageDir, 'retry_config_invalid');
        echo "retry_sweep config_invalid\n";
        return 1;
    }
    $recipientsById = array_combine(recipientIds($validated), $validated);
    $from = headerSafe($mailFrom);

    // Test hook: a fixed minimum age replaces the backoff schedule.
    $override = config('ASCENDREV_RETRY_MIN_AGE_SECONDS');
    $minAgeOverride = ctype_digit($override) ? (int) $override : null;

    $counts = ['scanned' => 0, 'attempted' => 0, 'busy' => 0];
    foreach (glob($storageDir . '/delivery-*.json') ?: [] as $statePath) {
        if (preg_match('/delivery-([a-f0-9]{64})\.json$/', $statePath, $match) !== 1) {
            continue;
        }
        $counts['scanned']++;

        $lock = @fopen($storageDir . '/submission-' . $match[1] . '.lock', 'c');
        if ($lock === false) {
            continue;
        }
        // Non-blocking: a held lock means a web request is delivering right now.
        if (!flock($lock, LOCK_EX | LOCK_NB)) {
            fclose($lock);
            $counts['busy']++;
            logLine($storageDir, 'delivery_retry_skipped reason=busy');
            continue;
        }
        $outcome = retryLocked($storageDir, $match[1], $recipientsById, $smtp, $from, $minAgeOverride, $loadSubmission);
        releaseSubmissionLock($lock);
        if ($outcome === 'attempted') {
            $counts['attempted']++;
        }
    }

    // A cron job that never runs looks identical to one with nothing to do. The
    // heartbeat's modified time is the one thing in File Manager that tells
    // them apart, without writing a log line every five minutes.
    @file_put_contents($storageDir . '/retry-heartbeat', gmdate('c') . "\n", LOCK_EX);

    echo sprintf("retry_sweep scanned=%d attempted=%d busy=%d\n", $counts['scanned'], $counts['attempted'], $counts['busy']);
    return 0;
}
