<?php
/**
 * AscendRev careers application handler.
 *
 * Built on the same shared core as enquiry.php (lib/handler-core.php): the same
 * request gates, the same idempotent claim, the same durable row plus delivery
 * state, the same detached SMTP delivery and cron outbox. What differs is the
 * payload. An application carries a resume, so this file also decides whether an
 * uploaded file is what it claims to be, and stores it outside the document root.
 *
 * Contract with the client:
 *   POST multipart/form-data, `Accept: application/json`.
 *   Any 2xx means the application is durable (row and resume are on disk), even
 *   when the email has not gone out yet; cron finishes that. The body carries a
 *   short reference the applicant can quote. No submitted value is ever echoed.
 *
 *   200 ok                       recorded, `reference` in the body
 *   403 forbidden_origin         405 method_not_allowed      429 rate_limited
 *   413 file_too_large           resume over 5 MB, or the request over the PHP limit
 *   415 unsupported_file_type    not a PDF or DOCX by content; `resume` in fields
 *   422 validation_failed        `fields` names what to fix; 422 unknown_field
 *   409 idempotency_key_conflict same key, different content or file
 *   503 delivery_incomplete      recorded, but mail could not be sent in this request
 *
 * Applicant data is personal data. The log holds codes and counts only, the CSV
 * and resumes live outside the document root with owner-only permissions, and
 * `php careers.php purge` removes them after the retention period.
 */

declare(strict_types=1);

/** Names this handler's log file. Must be defined before the shared core loads. */
const HANDLER_LOG_FILE = 'careers.log';

require_once __DIR__ . '/lib/handler-core.php';

/* ---------------------------------------------------------------------------
 * Configuration
 * ------------------------------------------------------------------------ */

/**
 * One recipient is enough here (enquiries need two): the recruiting mailbox is a
 * shared one, and the CSV plus the stored resume remain the record. An empty
 * value fails closed rather than routing applications to a default inbox.
 */
$RECIPIENTS = array_map('trim', explode(',', config('ASCENDREV_CAREERS_TO')));

/** Applications, resumes and rate-limit state. Outside the document root. */
$STORAGE_DIR = config('ASCENDREV_CAREERS_STORAGE', accountRoot() . '/ascendrev-applications');

$SMTP = smtpSettings();

/** Envelope sender. Same authenticated identity the enquiry form sends from. */
$MAIL_FROM = config('ASCENDREV_ENQUIRY_FROM', $SMTP['user']);

$ALLOWED_HOSTS = allowedHosts();

/** Its own budget and its own bucket (a separate storage directory from enquiries). */
$RATE_LIMIT_MAX = max(1, (int) (config('ASCENDREV_CAREERS_RATE_LIMIT_MAX', '5') ?: 5));

/** How long applications and resumes are kept before `purge` deletes them. */
const DEFAULT_RETENTION_DAYS = 365;

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

/**
 * Column order of applications.csv. submission_key is last and is what makes a
 * retry find its own row.
 */
const CSV_HEADER = [
    'submitted_at_utc', 'full_name', 'email', 'phone', 'role', 'outbound_years',
    'cs_years', 'expected_salary', 'site_shift_confirmed', 'source', 'resume_file',
    'ip_hash', 'submission_key',
];
const COL_SUBMITTED_AT = 0;
const COL_FULL_NAME = 1;
const COL_EMAIL = 2;
const COL_PHONE = 3;
const COL_ROLE = 4;
const COL_OUTBOUND_YEARS = 5;
const COL_CS_YEARS = 6;
const COL_EXPECTED_SALARY = 7;
const COL_SITE_SHIFT = 8;
const COL_SOURCE = 9;
const COL_RESUME_FILE = 10;
const COL_SUBMISSION_KEY = 12;

/**
 * The columns that define "the same application" for idempotency: the applicant's
 * own answers, up to and including the site and shift confirmation. Source is
 * analytics, so a retry that arrives with a different utm_source is still the
 * same application.
 */
const HASHED_COLUMNS = [
    COL_FULL_NAME, COL_EMAIL, COL_PHONE, COL_ROLE, COL_OUTBOUND_YEARS, COL_CS_YEARS,
    COL_EXPECTED_SALARY, COL_SITE_SHIFT,
];

/* ---------------------------------------------------------------------------
 * Vocabularies. Anything not listed is rejected (fail closed).
 * ------------------------------------------------------------------------ */

/** One open role. Adding another is one line here; nothing else keys off the list. */
const ROLE_TITLES = [
    'outbound-sales-representative' => 'Outbound Sales Representative',
];

const EXPERIENCE_LABELS = [
    'none' => 'None',
    'lt1' => 'Less than 1 year',
    '1to2' => '1 to 2 years',
    '3to5' => '3 to 5 years',
    '5plus' => 'More than 5 years',
];

/** Accepted resume types: extension => Content-Type sent on the email attachment. */
const RESUME_CONTENT_TYPES = [
    'pdf' => 'application/pdf',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/** The complete set of accepted field names. Anything else is rejected. */
const ALLOWED_FIELDS = [
    'fullName', 'email', 'phone', 'role', 'outboundYears', 'csYears', 'expectedSalary',
    'siteShiftConfirmed', 'source', 'consent', 'website', 'idempotencyKey',
];

/** Monthly expected salary bounds, in PHP. */
const MIN_SALARY = 5000;
const MAX_SALARY = 1000000;

/* ---------------------------------------------------------------------------
 * Cron entry points (CLI only, dispatched before any HTTP gate).
 *
 *   php careers.php retry   finish deliveries a web request could not
 *   php careers.php purge   delete applications past the retention period
 * ------------------------------------------------------------------------ */

if (PHP_SAPI === 'cli' && ($_SERVER['argv'][1] ?? '') === 'retry') {
    exit(runRetrySweep($STORAGE_DIR, $RECIPIENTS, 1, $SMTP, $MAIL_FROM, careersRetryLoader($STORAGE_DIR)));
}

if (PHP_SAPI === 'cli' && ($_SERVER['argv'][1] ?? '') === 'purge') {
    $retention = config('ASCENDREV_CAREERS_RETENTION_DAYS', (string) DEFAULT_RETENTION_DAYS);
    exit(runPurge($STORAGE_DIR, ctype_digit($retention) && (int) $retention > 0 ? (int) $retention : null));
}

/* ---------------------------------------------------------------------------
 * Gates. Same order as enquiry.php; `website` is the honeypot.
 * ------------------------------------------------------------------------ */

gateOrigin($ALLOWED_HOSTS);
gateMethod();
$rate = gateRateLimit($STORAGE_DIR, $RATE_LIMIT_MAX);
$clientIp = clientIp();
rejectOversizedRequest($STORAGE_DIR);
gateUnknownFields(ALLOWED_FIELDS);
rejectUnknownFiles();
gateHoneypot($STORAGE_DIR, 'website');

/* ---------------------------------------------------------------------------
 * Request size and upload helpers
 * ------------------------------------------------------------------------ */

/** Converts a php.ini size such as "10M" to bytes. 0 means unlimited. */
function iniBytes(string $value): int
{
    $value = trim($value);
    $number = (int) $value;
    return match (strtolower(substr($value, -1))) {
        'g' => $number * 1024 ** 3,
        'm' => $number * 1024 ** 2,
        'k' => $number * 1024,
        default => $number,
    };
}

/**
 * When a request is bigger than post_max_size PHP discards the whole body, so
 * $_POST and $_FILES arrive empty and every field would look "missing". Telling
 * the applicant their file was too big is the honest answer, not "fix the form".
 */
function rejectOversizedRequest(string $storageDir): void
{
    $limit = iniBytes((string) ini_get('post_max_size'));
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($limit > 0 && $length > $limit) {
        logLine($storageDir, 'upload_rejected reason=post_max_size');
        respond(413, ['ok' => false, 'error' => 'file_too_large']);
    }
}

/** The only file field is `resume`; anything else is a probe or a client bug. */
function rejectUnknownFiles(): void
{
    foreach (array_keys($_FILES) as $name) {
        if ($name !== 'resume') {
            respond(422, ['ok' => false, 'error' => 'unknown_field']);
        }
    }
}

/**
 * True when the file is a ZIP that is recognisably a Word document: it has a
 * [Content_Types].xml and at least one word/ part. Reads only the central
 * directory, found from the end-of-central-directory record, and caps what it
 * will read, so a hostile archive cannot make this loop or allocate without
 * bound. ZipArchive is deliberately not used: it is an optional extension, and
 * one code path that is tested beats two where the untested one runs in
 * production.
 */
function zipIsWordDocument(string $path, int $size): bool
{
    $handle = @fopen($path, 'rb');
    if ($handle === false) {
        return false;
    }

    $tailLength = min($size, 22 + 65535);
    fseek($handle, $size - $tailLength);
    $tail = (string) fread($handle, $tailLength);

    // The record sits at the end, followed only by its own comment. A comment
    // that happens to contain the signature is skipped by requiring the declared
    // comment length to land exactly on the end of the file.
    $record = null;
    for ($position = strlen($tail) - 22; $position >= 0; $position--) {
        if (substr($tail, $position, 4) !== "PK\x05\x06") {
            continue;
        }
        $fields = unpack('vdisk/vcdDisk/vdiskEntries/ventries/VcdSize/VcdOffset/vcommentLength', substr($tail, $position + 4, 18));
        if (is_array($fields) && $position + 22 + $fields['commentLength'] === strlen($tail)) {
            $record = $fields;
            break;
        }
    }

    if (
        $record === null
        || $record['disk'] !== 0
        || $record['cdDisk'] !== 0
        || $record['entries'] !== $record['diskEntries']
        || $record['cdSize'] === 0
        || $record['cdSize'] > 1048576
        || $record['cdOffset'] + $record['cdSize'] > $size
    ) {
        fclose($handle);
        return false;
    }

    fseek($handle, $record['cdOffset']);
    $directory = (string) fread($handle, $record['cdSize']);
    fclose($handle);
    if (strlen($directory) !== $record['cdSize']) {
        return false;
    }

    $hasContentTypes = false;
    $hasWordPart = false;
    $offset = 0;
    for ($entry = 0; $entry < $record['entries'] && $entry < 10000; $entry++) {
        if (substr($directory, $offset, 4) !== "PK\x01\x02" || $offset + 46 > $record['cdSize']) {
            return false;
        }
        $lengths = unpack('vname/vextra/vcomment', substr($directory, $offset + 28, 6));
        $name = substr($directory, $offset + 46, $lengths['name']);
        $hasContentTypes = $hasContentTypes || $name === '[Content_Types].xml';
        $hasWordPart = $hasWordPart || str_starts_with($name, 'word/');
        $offset += 46 + $lengths['name'] + $lengths['extra'] + $lengths['comment'];
        if ($offset > $record['cdSize']) {
            return false;
        }
    }

    return $hasContentTypes && $hasWordPart;
}

/**
 * Decides what an uploaded file is from its bytes, never from the name or the
 * browser's MIME type, both of which the sender controls. Returns the extension
 * it must carry, or null when it is neither a PDF nor a Word (.docx) document.
 * The legacy .doc format is not accepted.
 */
function detectResumeType(string $path, int $size): ?string
{
    $handle = @fopen($path, 'rb');
    if ($handle === false) {
        return null;
    }
    $head = (string) fread($handle, 5);
    fclose($handle);

    if ($head === '%PDF-') {
        return 'pdf';
    }
    if (str_starts_with($head, "PK\x03\x04")) {
        return zipIsWordDocument($path, $size) ? 'docx' : null;
    }
    return null;
}

/**
 * Examines the `resume` upload. Transport failures and an oversized file answer
 * the request directly; what is left for the caller is one of:
 *   ['state' => 'missing']      nothing was uploaded
 *   ['state' => 'unsupported']  not a PDF or DOCX, or the name does not match the content
 *   ['state' => 'ok', 'tmp' => ..., 'ext' => ..., 'sha256' => ...]
 */
function inspectResumeUpload(string $storageDir): array
{
    $file = $_FILES['resume'] ?? null;
    // resume[] arrives as arrays of names and errors; one file field means one value.
    if (!is_array($file) || !isset($file['error']) || is_array($file['error']) || !is_string($file['tmp_name'] ?? null)) {
        return ['state' => 'missing'];
    }

    $code = (int) $file['error'];
    if ($code !== UPLOAD_ERR_OK) {
        // Logged by code only; the file name is the applicant's own text.
        logLine($storageDir, 'upload_error code=' . $code);
        switch ($code) {
            case UPLOAD_ERR_NO_FILE:
                return ['state' => 'missing'];
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                respond(413, ['ok' => false, 'error' => 'file_too_large']);
            case UPLOAD_ERR_PARTIAL:
                respond(400, ['ok' => false, 'error' => 'upload_incomplete']);
            default:
                // No temp dir, disk full, a blocking extension, or a code this
                // handler does not know: the server cannot take the file.
                respond(500, ['ok' => false, 'error' => 'upload_unavailable']);
        }
    }

    $tmp = $file['tmp_name'];
    if (!is_uploaded_file($tmp)) {
        logLine($storageDir, 'upload_rejected reason=not_uploaded_file');
        respond(400, ['ok' => false, 'error' => 'upload_invalid']);
    }

    $size = (int) @filesize($tmp);
    if ($size > MAX_RESUME_BYTES) {
        logLine($storageDir, 'upload_rejected reason=too_large');
        respond(413, ['ok' => false, 'error' => 'file_too_large']);
    }

    $detected = $size > 0 ? detectResumeType($tmp, $size) : null;
    $extension = strtolower(pathinfo((string) ($file['name'] ?? ''), PATHINFO_EXTENSION));
    $hash = $detected === null || $extension !== $detected ? false : hash_file('sha256', $tmp);
    if ($hash === false) {
        logLine($storageDir, 'upload_rejected reason=unsupported_type');
        return ['state' => 'unsupported'];
    }

    return ['state' => 'ok', 'tmp' => $tmp, 'ext' => $detected, 'sha256' => $hash];
}

/**
 * Copies the upload to resumes/<submission_key>.<ext> and returns that relative
 * path, or null on failure. The name is built from the key and a whitelisted
 * extension, never from anything the applicant typed. Written to a temporary
 * name, synced, then renamed, so a crash leaves either no file or the whole one.
 */
function storeResume(string $storageDir, string $uploadedTmp, string $submissionKey, string $extension): ?string
{
    $directory = $storageDir . '/resumes';
    if (!is_dir($directory) && !@mkdir($directory, 0750, true) && !is_dir($directory)) {
        return null;
    }

    $relative = 'resumes/' . $submissionKey . '.' . $extension;
    $temporary = $storageDir . '/' . $relative . '.' . bin2hex(random_bytes(8)) . '.tmp';

    $input = @fopen($uploadedTmp, 'rb');
    $output = @fopen($temporary, 'xb');
    if ($input === false || $output === false) {
        if (is_resource($input)) {
            fclose($input);
        }
        return null;
    }
    @chmod($temporary, 0600);

    $ok = stream_copy_to_stream($input, $output) !== false && syncFile($output);
    fclose($input);
    fclose($output);

    if (!$ok || !@rename($temporary, $storageDir . '/' . $relative)) {
        @unlink($temporary);
        return null;
    }
    return $relative;
}

/**
 * The absolute path of a stored resume, or null when the CSV value is not the
 * shape this handler writes. The row is data on disk, so it is validated before
 * it is ever turned into a path.
 */
function resumePathFromRow(string $storageDir, string $resumeFile): ?string
{
    if (preg_match('#^resumes/[a-f0-9]{64}\.(pdf|docx)$#', $resumeFile) !== 1) {
        return null;
    }
    return $storageDir . '/' . $resumeFile;
}

/* ---------------------------------------------------------------------------
 * Validation
 * ------------------------------------------------------------------------ */

/**
 * A CSV cell that starts with = + - @ is run as a formula when the file is
 * opened in Excel. Free text from an applicant gets a leading apostrophe, which
 * spreadsheets treat as "this is text". Applied before the value is stored, so
 * the row, the hash and the email all see the same string.
 */
function csvSafe(string $value): string
{
    return preg_match('/^[=+\-@\t\r]/', $value) === 1 ? "'" . $value : $value;
}

/** Valid UTF-8 with no control characters (a newline in a name is a header-injection attempt). */
function plainTextIsValid(string $value): bool
{
    return mb_check_encoding($value, 'UTF-8') && preg_match('/[\x00-\x1f\x7f]/', $value) !== 1;
}

/** Returns the field names that failed. Empty when the applicant's answers are valid. */
function validateAnswers(array $v): array
{
    $errors = [];

    if (
        mb_strlen($v['fullName']) < 2
        || !nameIsValid($v['fullName'])
        || !plainTextIsValid($v['fullName'])
    ) {
        $errors[] = 'fullName';
    }

    $email = $v['email'];
    $separator = strrpos($email, '@');
    $domain = $separator === false ? '' : strtolower(trim(substr($email, $separator + 1)));
    // Free mailboxes are fine here: applicants are individuals. Disposable ones are not.
    if (
        $email === ''
        || mb_strlen($email) > 254
        || preg_match('/[\r\n]/', $email) === 1
        || !filter_var($email, FILTER_VALIDATE_EMAIL)
        || $domain === ''
        || in_array($domain, DISPOSABLE_MAILBOX_DOMAINS, true)
    ) {
        $errors[] = 'email';
    }

    $phone = $v['phone'];
    $digits = preg_replace('/[^0-9]/', '', $phone);
    // 10 to 13 digits covers 09xxxxxxxxx (11), +639xxxxxxxxx (12) and local landlines.
    if (
        $phone === ''
        || mb_strlen($phone) > 32
        || preg_match(PHONE_ALLOWED_PATTERN, $phone) !== 1
        || !is_string($digits)
        || strlen($digits) < 10
        || strlen($digits) > 13
    ) {
        $errors[] = 'phone';
    }

    if (!array_key_exists($v['role'], ROLE_TITLES)) {
        $errors[] = 'role';
    }
    foreach (['outboundYears', 'csYears'] as $name) {
        if (!array_key_exists($v[$name], EXPERIENCE_LABELS)) {
            $errors[] = $name;
        }
    }
    // Digits only and at most 7 of them, so (int) can never overflow or surprise.
    if (
        preg_match('/^[0-9]{1,7}$/', $v['expectedSalary']) !== 1
        || (int) $v['expectedSalary'] < MIN_SALARY
        || (int) $v['expectedSalary'] > MAX_SALARY
    ) {
        $errors[] = 'expectedSalary';
    }

    // The applicant's own tick on "Alabang site, not work from home, night shift".
    if ($v['siteShiftConfirmed'] !== 'yes') {
        $errors[] = 'siteShiftConfirmed';
    }

    if ($v['consent'] !== 'yes') {
        $errors[] = 'consent';
    }

    return array_values(array_unique($errors));
}

/* ---------------------------------------------------------------------------
 * Mail
 * ------------------------------------------------------------------------ */

/**
 * Header text with anything outside printable ASCII wrapped as RFC 2047 encoded
 * words, so an applicant called "Jose Garcia Nunez" with accents reaches the
 * recruiter intact. enquiry.php puts raw UTF-8 in headers; here the name is in
 * the Subject and Reply-To of every message, so it is encoded properly.
 */
function encodeHeaderText(string $value, int $offset): string
{
    $value = headerSafe($value);
    if (preg_match('/^[\x20-\x7e]*$/', $value) === 1) {
        return $value;
    }
    return mb_encode_mimeheader($value, 'UTF-8', 'B', "\r\n", $offset);
}

/** A Reply-To style address. A plain name is quoted so a comma in it is not read as a second address. */
function replyToHeader(string $name, string $email): string
{
    $name = headerSafe($name);
    $display = preg_match('/^[\x20-\x7e]*$/', $name) === 1
        ? '"' . addcslashes($name, '"\\') . '"'
        : encodeHeaderText($name, 10);
    return $display . ' <' . headerSafe($email) . '>';
}

/**
 * Attachment name `Resume - <Full Name>.<ext>`, reduced to letters, digits,
 * space, dot, underscore and hyphen. Plain ASCII needs no RFC 2231 encoding and
 * cannot carry a quote, a path separator or a header break.
 */
function attachmentFileName(string $fullName, string $extension): string
{
    $clean = trim((string) preg_replace('/ {2,}/', ' ', (string) preg_replace('/[^A-Za-z0-9 ._-]/', '', $fullName)));
    // Trailing dots and spaces would double up against the extension ("Jr." + ".pdf").
    $clean = trim(substr($clean, 0, 80), ' .');
    return 'Resume - ' . ($clean !== '' ? $clean : 'Applicant') . '.' . $extension;
}

/** "PHP 25,000". */
function formatSalary(string $amount): string
{
    return 'PHP ' . number_format((int) $amount);
}

/** The first word of the name, for the reply button. */
function firstName(string $fullName): string
{
    $parts = preg_split('/\s+/', trim($fullName));
    return is_array($parts) && $parts[0] !== '' ? $parts[0] : $fullName;
}

/** The reference shown to the applicant and printed in the email: stable for a given submission key. */
function applicationReference(string $submissionKey): string
{
    return 'AR-' . strtoupper(substr($submissionKey, 0, 6));
}

/** A question with its answer stacked beneath it; the question labels are too long for a side-by-side cell. */
function answerRow(string $question, string $answer): string
{
    return '<tr><td style="padding:11px 0;border-bottom:1px solid #e9ecf1;vertical-align:top;">'
        . '<div style="font:600 12px/16px Arial,Helvetica,sans-serif;color:#6b7484;text-transform:uppercase;letter-spacing:.05em;">'
        . e($question) . '</div>'
        . '<div style="margin-top:4px;font:400 15px/22px Arial,Helvetica,sans-serif;color:#111827;white-space:pre-wrap;">'
        . ($answer !== '' ? e($answer) : '<span style="color:#9aa3b2;">Not provided</span>')
        . '</div></td></tr>';
}

/**
 * Builds the subject, MIME body and headers for one application.
 *
 * A function of the persisted row and the stored resume alone, so the web
 * request and the cron retry produce the same message for the same application.
 *
 * Layout: multipart/mixed holds the readable message (multipart/related, itself
 * plain text + HTML alternatives and the inline header image) and the resume as
 * an attachment. "mixed" is what tells the client the last part is a file to
 * download rather than something that belongs in the layout.
 *
 * @param string[] $row the persisted CSV row
 * @return array{subject: string, mime: string, headers: string}
 */
function buildCareersMessage(array $row, string $resumePath, string $from): array
{
    $fullName = $row[COL_FULL_NAME];
    $email = $row[COL_EMAIL];
    $roleTitle = ROLE_TITLES[$row[COL_ROLE]] ?? 'Unknown role';
    $reference = applicationReference($row[COL_SUBMISSION_KEY]);
    $extension = (string) pathinfo($row[COL_RESUME_FILE], PATHINFO_EXTENSION);
    $fileName = attachmentFileName($fullName, $extension);
    $submittedAt = $row[COL_SUBMITTED_AT];

    // The question wording is the client's own, as the applicant saw it.
    $answers = [
        ['How many years of international outbound sales experience do you have?', EXPERIENCE_LABELS[$row[COL_OUTBOUND_YEARS]] ?? ''],
        ['How many years of international customer service experience do you have?', EXPERIENCE_LABELS[$row[COL_CS_YEARS]] ?? ''],
        ["What's your expected monthly salary?", formatSalary($row[COL_EXPECTED_SALARY])],
        ['Alabang-site location (not work from home) and night-shift', $row[COL_SITE_SHIFT] === 'yes' ? 'Confirmed' : ''],
    ];

    $lines = [
        'A new job application was submitted on ascend-rev.ca.',
        '',
        'Reference : ' . $reference,
        'Role      : ' . $roleTitle,
        'Name      : ' . $fullName,
        'Email     : ' . $email,
        'Phone     : ' . $row[COL_PHONE],
        'Source    : ' . ($row[COL_SOURCE] !== '' ? $row[COL_SOURCE] : '(none)'),
        '',
    ];
    foreach ($answers as [$question, $answer]) {
        $lines[] = $question . ':';
        $lines[] = $answer !== '' ? $answer : '(none)';
        $lines[] = '';
    }
    array_push(
        $lines,
        'Resume attached: ' . $fileName,
        '',
        '---',
        'Submitted ' . $submittedAt . ' UTC',
        'Also recorded in applications.csv'
    );

    $subject = encodeHeaderText(sprintf('[AscendRev Careers] %s: %s', $roleTitle, $fullName), 9);

    // Same table-based layout and inline styles as the enquiry email, for the
    // same reason: it is the markup Outlook renders predictably.
    $html = '<!DOCTYPE html><html><head><meta charset="utf-8">'
        . '<meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<title>New application</title></head>'
        . '<body style="margin:0;padding:0;background:#eef1f5;">'
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">'
        . e($fullName) . ', ' . e($roleTitle) . '</div>'

        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef1f5;padding:28px 12px;">'
        . '<tr><td align="center">'
        . '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(15,27,51,.10);">'

        . '<tr><td style="background:#073268;padding:0;font-size:0;line-height:0;">'
        . '<img src="cid:ascendrev-header" width="600" height="200"'
        . ' alt="AscendRev, Outsourcing &amp; Offshoring Solutions"'
        . ' style="display:block;border:0;width:100%;max-width:600px;height:auto;'
        . 'color:#ffffff;font:600 18px/200px Arial,Helvetica,sans-serif;text-align:center;">'
        . '</td></tr>'

        . '<tr><td style="font-size:0;line-height:0;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
        . '<td width="74" style="background:#267455;height:3px;font-size:0;line-height:0;">&nbsp;</td>'
        . '<td style="background:#EBCB89;height:3px;font-size:0;line-height:0;">&nbsp;</td>'
        . '</tr></table></td></tr>'

        . '<tr><td style="padding:30px 32px 8px;">'
        . '<p style="margin:0 0 4px;font:600 11px/16px Arial,Helvetica,sans-serif;color:#1E5E46;text-transform:uppercase;letter-spacing:.14em;">New application</p>'
        . '<h1 style="margin:0;font:400 26px/32px Georgia,\'Times New Roman\',serif;color:#0F1B33;">'
        . e($fullName) . '</h1>'
        . '<p style="margin:6px 0 0;font:400 15px/22px Arial,Helvetica,sans-serif;color:#4B5563;">'
        . e($roleTitle) . '</p>'
        . '</td></tr>'

        . '<tr><td style="padding:14px 32px 4px;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'
        . row('Email', $email)
        . row('Phone', $row[COL_PHONE])
        . row('Source', $row[COL_SOURCE])
        . row('Reference', $reference)
        . '</table></td></tr>'

        . '<tr><td style="padding:10px 32px 4px;">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';

    foreach ($answers as [$question, $answer]) {
        $html .= answerRow($question, $answer);
    }

    $html .= '</table></td></tr>'

        . '<tr><td style="padding:26px 32px 4px;">'
        . '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
        . '<td style="background:#1E5E46;border-radius:6px;">'
        . '<a href="mailto:' . e($email) . '?subject=' . rawurlencode('Re: your application to AscendRev')
        . '" style="display:inline-block;padding:13px 26px;font:600 14px/18px Arial,Helvetica,sans-serif;'
        . 'color:#ffffff;text-decoration:none;">Reply to ' . e(firstName($fullName)) . '</a>'
        . '</td></tr></table>'
        . '<p style="margin:12px 0 0;font:400 12px/18px Arial,Helvetica,sans-serif;color:#6b7484;">'
        . 'Replying to this email also reaches them directly. Resume attached: ' . e($fileName) . '</p>'
        . '</td></tr>'

        . '<tr><td style="padding:24px 32px 28px;">'
        . '<hr style="border:0;border-top:1px solid #e9ecf1;margin:0 0 14px;">'
        . '<p style="margin:0;font:400 12px/18px Arial,Helvetica,sans-serif;color:#8a93a3;">'
        . 'Submitted ' . e($submittedAt) . ' UTC via ascend-rev.ca<br>'
        . 'Also recorded in applications.csv'
        . '</p></td></tr>'

        . '</table></td></tr></table></body></html>';

    $boundaryMixed = 'mix_' . bin2hex(random_bytes(12));
    $boundaryRelated = 'rel_' . bin2hex(random_bytes(12));
    $boundaryAlt = 'alt_' . bin2hex(random_bytes(12));

    $mime = '--' . $boundaryMixed . "\r\n"
        . 'Content-Type: multipart/related; boundary="' . $boundaryRelated . '"' . "\r\n\r\n"

        . '--' . $boundaryRelated . "\r\n"
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

    $headerImagePath = dirname(__DIR__) . '/email-header.jpg';
    if (is_readable($headerImagePath)) {
        $headerImageData = @file_get_contents($headerImagePath);
        if ($headerImageData !== false) {
            $mime .= '--' . $boundaryRelated . "\r\n"
                . 'Content-Type: image/jpeg; name="email-header.jpg"' . "\r\n"
                . 'Content-Transfer-Encoding: base64' . "\r\n"
                . 'Content-ID: <ascendrev-header>' . "\r\n"
                . 'Content-Disposition: inline; filename="email-header.jpg"' . "\r\n\r\n"
                . chunk_split(base64_encode($headerImageData), 76, "\r\n") . "\r\n";
        }
    }
    $mime .= '--' . $boundaryRelated . '--' . "\r\n\r\n";

    $resumeData = (string) @file_get_contents($resumePath);
    $mime .= '--' . $boundaryMixed . "\r\n"
        . 'Content-Type: ' . (RESUME_CONTENT_TYPES[$extension] ?? 'application/octet-stream') . '; name="' . $fileName . '"' . "\r\n"
        . 'Content-Transfer-Encoding: base64' . "\r\n"
        . 'Content-Disposition: attachment; filename="' . $fileName . '"' . "\r\n\r\n"
        . chunk_split(base64_encode($resumeData), 76, "\r\n") . "\r\n"
        . '--' . $boundaryMixed . '--' . "\r\n";

    $headers = implode("\r\n", [
        'From: AscendRev Careers <' . $from . '>',
        'Reply-To: ' . replyToHeader($fullName, $email),
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $boundaryMixed . '"',
        'X-Mailer: ascend-rev.ca',
    ]);

    return ['subject' => $subject, 'mime' => $mime, 'headers' => $headers];
}

/*
 * No acknowledgment email goes to the applicant. A new sending domain's
 * reputation is fragile, and a form that mails whatever address it is handed is
 * a way to send mail to strangers. The on-screen reference is the confirmation.
 * Adding one later also means a second message with its own recipient, state and
 * retry bookkeeping, which is not a flag away.
 */

/* ---------------------------------------------------------------------------
 * Persistence helpers shared by the web request, cron retry and purge
 * ------------------------------------------------------------------------ */

/** Stable hash of the applicant's answers plus the exact bytes of the resume. */
function careersPayloadHash(array $row, string $resumeSha256): string
{
    $values = array_map(static fn(int $column): string => (string) $row[$column], HASHED_COLUMNS);
    return hash('sha256', implode("\x1f", array_merge($values, [$resumeSha256])));
}

/**
 * The cron half of a retry: finds the persisted row, checks its resume is still
 * there and tells the shared sweep how to rebuild the message.
 *
 * @return callable(string): ?array{payload_hash: string, build: callable(string): array}
 */
function careersRetryLoader(string $storageDir): callable
{
    return static function (string $submissionKey) use ($storageDir): ?array {
        $row = findCsvRow($storageDir . '/applications.csv', CSV_HEADER, COL_SUBMISSION_KEY, $submissionKey);
        if ($row === null) {
            logLine($storageDir, 'retry_row_missing');
            return null;
        }
        $resumePath = resumePathFromRow($storageDir, (string) $row[COL_RESUME_FILE]);
        $resumeSha = $resumePath === null ? false : @hash_file('sha256', $resumePath);
        if ($resumeSha === false) {
            logLine($storageDir, 'retry_resume_missing');
            return null;
        }
        return [
            'payload_hash' => careersPayloadHash($row, $resumeSha),
            'build' => static fn(string $from): array => buildCareersMessage($row, $resumePath, $from),
        ];
    };
}

/* ---------------------------------------------------------------------------
 * Retention (cron)
 * ------------------------------------------------------------------------ */

/**
 * Deletes applications older than the retention period: the CSV row, the stored
 * resume and the delivery bookkeeping for it. Also removes resume files that no
 * row points at once they are that old (the leftover of a crash between saving
 * the file and writing the row). Prints counts only, never a name.
 *
 * @return int process exit code
 */
function runPurge(string $storageDir, ?int $retentionDays): int
{
    $csvPath = $storageDir . '/applications.csv';
    if ($retentionDays === null || !is_dir($storageDir)) {
        logLine($storageDir, 'purge_config_invalid');
        echo "purge config_invalid\n";
        return 1;
    }
    $cutoff = time() - $retentionDays * 86400;

    // The same lock a web request holds while it writes the CSV, so a new
    // application cannot be lost to the rewrite below.
    $lock = @fopen($csvPath . '.lock', 'c');
    if ($lock === false || !flock($lock, LOCK_EX)) {
        logLine($storageDir, 'purge_lock_failed');
        echo "purge lock_failed\n";
        return 1;
    }

    $kept = [];
    $expired = [];
    if (file_exists($csvPath) && @filesize($csvPath) > 0) {
        $input = @fopen($csvPath, 'r');
        if ($input === false || fgetcsv($input) !== CSV_HEADER) {
            // Not the schema this handler writes: delete nothing from a file it cannot read.
            if ($input !== false) {
                fclose($input);
            }
            releaseSubmissionLock($lock);
            logLine($storageDir, 'purge_csv_unreadable');
            echo "purge csv_unreadable\n";
            return 1;
        }
        while (($row = fgetcsv($input)) !== false) {
            $submittedAt = count($row) === count(CSV_HEADER) ? strtotime((string) $row[COL_SUBMITTED_AT]) : false;
            // A row whose age cannot be established is kept, never deleted.
            if ($submittedAt !== false && $submittedAt < $cutoff) {
                $expired[] = $row;
            } else {
                $kept[] = $row;
            }
        }
        fclose($input);
    }

    if ($expired !== []) {
        $buffer = fopen('php://temp', 'w+b');
        fputcsv($buffer, CSV_HEADER);
        foreach ($kept as $row) {
            fputcsv($buffer, $row);
        }
        rewind($buffer);
        $written = atomicWriteFile($csvPath, (string) stream_get_contents($buffer));
        fclose($buffer);
        if (!$written) {
            releaseSubmissionLock($lock);
            logLine($storageDir, 'purge_csv_write_failed');
            echo "purge csv_write_failed\n";
            return 1;
        }
    }
    $keptResumes = array_map(static fn(array $row): string => (string) $row[COL_RESUME_FILE], $kept);
    releaseSubmissionLock($lock);

    $removedResumes = 0;
    foreach ($expired as $row) {
        $resumePath = resumePathFromRow($storageDir, (string) $row[COL_RESUME_FILE]);
        if ($resumePath !== null && @unlink($resumePath)) {
            $removedResumes++;
        }
        $key = (string) $row[COL_SUBMISSION_KEY];
        if (preg_match('/^[a-f0-9]{64}$/', $key) === 1) {
            @unlink($storageDir . '/delivery-' . $key . '.json');
            @unlink($storageDir . '/submission-' . $key . '.lock');
        }
    }

    $removedOrphans = 0;
    foreach (glob($storageDir . '/resumes/*') ?: [] as $path) {
        $relative = 'resumes/' . basename($path);
        if (!in_array($relative, $keptResumes, true) && (int) @filemtime($path) < $cutoff && @unlink($path)) {
            $removedOrphans++;
        }
    }

    $summary = sprintf(
        'purge removed_rows=%d removed_resumes=%d removed_orphans=%d kept_rows=%d retention_days=%d',
        count($expired),
        $removedResumes,
        $removedOrphans,
        count($kept),
        $retentionDays
    );
    logLine($storageDir, $summary);
    echo $summary . "\n";
    return 0;
}

/* ---------------------------------------------------------------------------
 * Validation, then the upload
 * ------------------------------------------------------------------------ */

$answers = [];
foreach ([
    'fullName', 'email', 'phone', 'role', 'outboundYears', 'csYears', 'expectedSalary',
    'siteShiftConfirmed', 'consent',
] as $name) {
    $answers[$name] = field($name);
}
$answers['fullName'] = csvSafe($answers['fullName']);
// "05000" and "5000" are the same salary; store one canonical form. Anything that
// is not plain digits is left as typed for validation to reject.
if (preg_match('/^[0-9]{1,7}$/', $answers['expectedSalary']) === 1) {
    $answers['expectedSalary'] = (string) (int) $answers['expectedSalary'];
}

// Utm tags and similar, kept only when they are the harmless shape; a bad one is
// dropped, not an error, because the applicant did not type it.
$source = field('source');
$source = preg_match('/^[A-Za-z0-9_.-]{1,40}$/', $source) === 1 ? csvSafe($source) : '';

$errors = validateAnswers($answers);

$upload = inspectResumeUpload($STORAGE_DIR);
if ($upload['state'] === 'unsupported') {
    respond(415, [
        'ok' => false,
        'error' => 'unsupported_file_type',
        'fields' => array_values(array_unique(array_merge($errors, ['resume']))),
    ]);
}
if ($upload['state'] === 'missing') {
    $errors[] = 'resume';
}

if ($errors !== []) {
    logLine($STORAGE_DIR, 'validation_failed field_count=' . count($errors));
    respond(422, ['ok' => false, 'error' => 'validation_failed', 'fields' => $errors]);
}

/* ---------------------------------------------------------------------------
 * Idempotent submission claim.
 *
 * The browser's key is authoritative when it sent a usable one. The content-hash
 * fallback includes the resume's hash, so two different files are two
 * applications. The per-key lock serialises duplicates for the whole
 * save-and-send sequence; the OS releases it if PHP dies, and a later retry
 * resumes from the durable row and the per-recipient checkpoints.
 * ------------------------------------------------------------------------ */

$submissionKey = clientSubmissionKey() ?? hash('sha256', implode("\x1f", array_merge(
    array_values($answers),
    [$upload['sha256']]
)));
$reference = applicationReference($submissionKey);

$submissionLock = @fopen($STORAGE_DIR . '/submission-' . $submissionKey . '.lock', 'c');
if ($submissionLock === false || !flock($submissionLock, LOCK_EX)) {
    releaseSubmissionLock($submissionLock);
    logLine($STORAGE_DIR, 'submission_lock_failed');
    respond(503, ['ok' => false, 'error' => 'submission_busy']);
}

$csvPath = $STORAGE_DIR . '/applications.csv';
$deliveryStatePath = $STORAGE_DIR . '/delivery-' . $submissionKey . '.json';

/*
 * Durable row. The resume is saved BEFORE the row that names it, so a row never
 * points at a file that does not exist; the cost is an orphan file after a crash
 * in between, which a retry with the same key overwrites and purge sweeps. When a
 * row already exists this is a replay and no second file is stored.
 */
$csvLock = @fopen($csvPath . '.lock', 'c');
$persistedRow = null;

if ($csvLock !== false && flock($csvLock, LOCK_EX)) {
    $persistedRow = findCsvRow($csvPath, CSV_HEADER, COL_SUBMISSION_KEY, $submissionKey);
    if ($persistedRow === null) {
        $resumeFile = storeResume($STORAGE_DIR, $upload['tmp'], $submissionKey, $upload['ext']);
        if ($resumeFile !== null) {
            $newRow = [
                gmdate('c'),
                $answers['fullName'],
                $answers['email'],
                $answers['phone'],
                $answers['role'],
                $answers['outboundYears'],
                $answers['csYears'],
                $answers['expectedSalary'],
                $answers['siteShiftConfirmed'],
                $source,
                $resumeFile,
                substr(hash('sha256', $clientIp), 0, 16),
                $submissionKey,
            ];
            $result = persistCsvRow($csvPath, $STORAGE_DIR, CSV_HEADER, $newRow, $submissionKey, COL_SUBMISSION_KEY);
            $persistedRow = $result['ok'] ? $result['row'] : null;
            if ($persistedRow === null) {
                // Nothing references the file we just wrote, so it must not linger.
                @unlink($STORAGE_DIR . '/' . $resumeFile);
            }
        }
    }
    flock($csvLock, LOCK_UN);
}
if ($csvLock !== false) {
    fclose($csvLock);
}

if (!is_array($persistedRow) || count($persistedRow) !== count(CSV_HEADER)) {
    logLine($STORAGE_DIR, 'application_write_failed');
    releaseSubmissionLock($submissionLock);
    respond(500, ['ok' => false, 'error' => 'not_recorded']);
}

$storedResumePath = resumePathFromRow($STORAGE_DIR, (string) $persistedRow[COL_RESUME_FILE]);
$storedResumeSha = $storedResumePath === null ? false : @hash_file('sha256', $storedResumePath);
if ($storedResumeSha === false) {
    logLine($STORAGE_DIR, 'resume_missing');
    releaseSubmissionLock($submissionLock);
    respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true, 'reference' => $reference]);
}

// Compare what was persisted with what this request carries. A same-key replay of
// a different answer or a different file is a conflict, never a quiet overwrite.
$incomingRow = [
    COL_FULL_NAME => $answers['fullName'],
    COL_EMAIL => $answers['email'],
    COL_PHONE => $answers['phone'],
    COL_ROLE => $answers['role'],
    COL_OUTBOUND_YEARS => $answers['outboundYears'],
    COL_CS_YEARS => $answers['csYears'],
    COL_EXPECTED_SALARY => $answers['expectedSalary'],
    COL_SITE_SHIFT => $answers['siteShiftConfirmed'],
];
$payloadHash = careersPayloadHash($persistedRow, $storedResumeSha);
if (!hash_equals($payloadHash, careersPayloadHash($incomingRow, $upload['sha256']))) {
    logLine($STORAGE_DIR, 'submission_payload_mismatch');
    releaseSubmissionLock($submissionLock);
    respond(409, ['ok' => false, 'error' => 'idempotency_key_conflict', 'recorded' => true, 'reference' => $reference]);
}

if (file_exists($deliveryStatePath)) {
    $deliveryState = json_decode((string) @file_get_contents($deliveryStatePath), true);
    if (!is_array($deliveryState)) {
        logLine($STORAGE_DIR, 'delivery_state_invalid');
        releaseSubmissionLock($submissionLock);
        respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true, 'reference' => $reference]);
    }
} else {
    $deliveryState = null;
}

$validatedRecipients = validateRecipients($RECIPIENTS, 1);
if ($validatedRecipients === null) {
    logLine($STORAGE_DIR, 'recipient_config_invalid count=' . count($RECIPIENTS) . ' csv=ok');
    releaseSubmissionLock($submissionLock);
    respond(500, ['ok' => false, 'error' => 'recipient_configuration_invalid', 'recorded' => true, 'reference' => $reference]);
}
$requiredRecipientIds = recipientIds($validatedRecipients);

if ($deliveryState === null) {
    $deliveryState = [
        'version' => 1,
        'payload_hash' => $payloadHash,
        'required' => $requiredRecipientIds,
        'accepted' => [],
    ];
    if (!writeDeliveryState($deliveryStatePath, $deliveryState)) {
        logLine($STORAGE_DIR, 'delivery_state_write_failed');
        releaseSubmissionLock($submissionLock);
        respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true, 'reference' => $reference]);
    }
} else {
    $checked = checkDeliveryState($deliveryState, $payloadHash, $requiredRecipientIds);
    if ($checked['problem'] === 'recipients_changed') {
        logLine($STORAGE_DIR, 'recipient_set_changed');
        releaseSubmissionLock($submissionLock);
        respond(409, ['ok' => false, 'error' => 'recipient_configuration_changed', 'recorded' => true, 'reference' => $reference]);
    }
    if ($checked['problem'] !== null) {
        logLine($STORAGE_DIR, 'delivery_state_invalid');
        releaseSubmissionLock($submissionLock);
        respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true, 'reference' => $reference]);
    }
    $deliveryState = $checked['state'];
}

/* ---------------------------------------------------------------------------
 * Outcome. A 2xx means the application cannot be lost: the row, the resume and
 * the delivery state are on disk. The applicant is answered at once where the
 * host can detach, and cron finishes whatever the attempt does not.
 * ------------------------------------------------------------------------ */

$from = headerSafe($MAIL_FROM);
$recipientsById = array_combine($requiredRecipientIds, $validatedRecipients);
$alreadyDelivered = acceptedCount($deliveryState, $requiredRecipientIds) === count($requiredRecipientIds);
$finishRequest = $alreadyDelivered ? null : finishRequestFunction();

// Delivery must survive the applicant closing the tab, and one session carrying
// a resume can outlast the default execution limit on a slow link.
ignore_user_abort(true);
set_time_limit(120);

// Built lazily, only if a recipient is still pending, from the persisted row.
$buildMessage = static fn(string $sender): array => buildCareersMessage($persistedRow, $storedResumePath, $sender);

if ($finishRequest !== null) {
    recordRateHit($rate['file'], $rate['hits'], $rate['now']);
    sendJson(200, ['ok' => true, 'recorded' => true, 'mailed' => false, 'queued' => true, 'reference' => $reference]);
    $finishRequest();

    runDeliveryAttempt($SMTP, $STORAGE_DIR, $deliveryStatePath, $deliveryState, $recipientsById, $buildMessage, $from, 'background');
    releaseSubmissionLock($submissionLock);
    exit;
}

// No way to detach (php -S, CLI), or nothing left to send on a replay: answer
// after delivery.
$mailDelivered = $alreadyDelivered
    || runDeliveryAttempt($SMTP, $STORAGE_DIR, $deliveryStatePath, $deliveryState, $recipientsById, $buildMessage, $from, 'sync');

recordRateHit($rate['file'], $rate['hits'], $rate['now']);
releaseSubmissionLock($submissionLock);

if (!$mailDelivered) {
    respond(503, ['ok' => false, 'error' => 'delivery_incomplete', 'recorded' => true, 'reference' => $reference]);
}

respond(200, ['ok' => true, 'mailed' => true, 'recorded' => true, 'reference' => $reference]);
