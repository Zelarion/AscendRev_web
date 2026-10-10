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
 * Delivery is decoupled from the response. Once the row and the delivery state
 * are durable the visitor gets their answer immediately, and mail is sent
 * afterwards over a single SMTP session. Whatever that attempt could not finish
 * is retried by `php enquiry.php retry`, run from cron (see DEPLOY.md).
 *
 * Two things this file deliberately does not do. It never echoes a submitted
 * value back into HTML, because the only safe way to render attacker-supplied
 * text is not to. And it never writes a full submission to anywhere reachable
 * over the web; the CSV lives outside the document root.
 */

declare(strict_types=1);

/** Names this handler's log file. Must be defined before the shared core loads. */
const HANDLER_LOG_FILE = 'enquiry.log';

/*
 * Config lookup, response helpers, the request gates, the SMTP client, delivery
 * state and the cron sweep live in the shared core so careers.php runs on the
 * same, already-tested machinery.
 */
require_once __DIR__ . '/lib/handler-core.php';

/* ---------------------------------------------------------------------------
 * Configuration
 *
 * Recipients and storage come from the environment at deploy time, never from
 * source (SPEC.md §6). On cPanel these are set in the Apache/PHP environment
 * or in a config file placed ABOVE public_html, which is why the fallback path
 * climbs out of the document root rather than sitting beside this file.
 * ------------------------------------------------------------------------ */

/**
 * At least two recipients, so no lead depends on a single mailbox
 * (SPEC.md §6). Recipients must be configured outside source. An empty
 * fallback makes a missing cPanel config fail closed instead of routing a
 * test or production enquiry to an unintended inbox.
 */
$RECIPIENTS = array_map(
    'trim',
    explode(',', config('ASCENDREV_ENQUIRY_TO'))
);

/**
 * Where submissions and rate-limit state live. Defaults outside the document
 * root. If that is not writable the handler still delivers mail and says so in
 * the log rather than failing the visitor.
 */
$STORAGE_DIR = config(
    'ASCENDREV_ENQUIRY_STORAGE',
    accountRoot() . '/ascendrev-enquiries'
);

/** Google Workspace SMTP transport; see smtpSettings() in the shared core. */
$SMTP = smtpSettings();

/** Envelope sender. Defaults to the authenticated Google Workspace identity. */
$MAIL_FROM = config('ASCENDREV_ENQUIRY_FROM', $SMTP['user']);

/** Hosts allowed to submit. Origin/Referer must match one of these. */
$ALLOWED_HOSTS = allowedHosts();

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

/** How long an identical submission is treated as a duplicate, not a new lead. */
const DEDUPE_WINDOW_SECONDS = 900;

const CSV_HEADER = [
    'submitted_at_utc', 'individual_name', 'business_email', 'entity_name',
    'best_number_to_call', 'comments', 'ip_hash', 'submission_key',
];

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
 * Outbox retry (cron).
 *
 * `php enquiry.php retry` re-attempts deliveries a web request could not finish.
 * It is dispatched here, before any HTTP gate, because none of them apply: there
 * is no visitor, origin, method or form. Only the PHP CLI binary can reach it;
 * php-cgi does not pass command-line arguments through, so a cron job must call
 * the CLI binary (DEPLOY.md, "Delivery retry cron").
 * ------------------------------------------------------------------------ */


if (PHP_SAPI === 'cli' && ($_SERVER['argv'][1] ?? '') === 'retry') {
    exit(runRetrySweep($STORAGE_DIR, $RECIPIENTS, 2, $SMTP, $MAIL_FROM, enquiryRetryLoader($STORAGE_DIR)));
}

/* ---------------------------------------------------------------------------
 * Gates, in this order: origin (with CORS and the OPTIONS preflight), method,
 * rate limit, unknown fields, honeypot. Each one answers and ends the request
 * when it refuses; see lib/handler-core.php for the reasoning behind each.
 *
 * `referralSource` is the honeypot: rendered visually hidden, so only a bot
 * fills it in.
 * ------------------------------------------------------------------------ */

gateOrigin($ALLOWED_HOSTS);
gateMethod();
$rate = gateRateLimit($STORAGE_DIR, $RATE_LIMIT_MAX);
$clientIp = clientIp();
gateUnknownFields(ALLOWED_FIELDS);
gateHoneypot($STORAGE_DIR, 'referralSource');

/* ---------------------------------------------------------------------------
 * Validation
 * ------------------------------------------------------------------------ */

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

$submissionKey = clientSubmissionKey() ?? hash('sha256', implode("\x1f", [
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

$submissionLockPath = $STORAGE_DIR . '/submission-' . $submissionKey . '.lock';
$submissionLock = @fopen($submissionLockPath, 'c');
if ($submissionLock === false || !flock($submissionLock, LOCK_EX)) {
    releaseSubmissionLock($submissionLock);
    logLine($STORAGE_DIR, 'submission_lock_failed');
    respond(503, ['ok' => false, 'error' => 'submission_busy']);
}

$csvPath = $STORAGE_DIR . '/enquiries.csv';
$deliveryStatePath = $STORAGE_DIR . '/delivery-' . $submissionKey . '.json';

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
    $csvResult = persistCsvRow($csvPath, $STORAGE_DIR, CSV_HEADER, $row, $submissionKey, 7);
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

$validatedRecipients = validateRecipients($RECIPIENTS);
if ($validatedRecipients === null) {
    logLine($STORAGE_DIR, 'recipient_config_invalid count=' . count($RECIPIENTS) . ' csv=ok');
    releaseSubmissionLock($submissionLock);
    respond(500, ['ok' => false, 'error' => 'recipient_configuration_invalid', 'recorded' => true]);
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
        respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true]);
    }
} else {
    $checked = checkDeliveryState($deliveryState, $payloadHash, $requiredRecipientIds);
    if ($checked['problem'] === 'recipients_changed') {
        logLine($STORAGE_DIR, 'recipient_set_changed');
        releaseSubmissionLock($submissionLock);
        respond(409, ['ok' => false, 'error' => 'recipient_configuration_changed', 'recorded' => true]);
    }
    if ($checked['problem'] !== null) {
        logLine($STORAGE_DIR, 'delivery_state_invalid');
        releaseSubmissionLock($submissionLock);
        respond(500, ['ok' => false, 'error' => 'delivery_state_unavailable', 'recorded' => true]);
    }
    $deliveryState = $checked['state'];
}


/* ---------------------------------------------------------------------------
 * Mail.
 *
 * Plain text, built entirely from values already validated above. Header
 * values are re-checked for CR and LF even so, because a header injection is
 * the one mistake in this file that would matter beyond this site.
 * ------------------------------------------------------------------------ */

/**
 * Builds the subject, MIME body and headers for one enquiry.
 *
 * A function of the persisted row alone, so the web request and the cron retry
 * produce the same message for the same submission; only the random MIME
 * boundaries differ between two calls.
 *
 * @param array{0:string,1:string,2:string,3:string,4:string} $values
 *        name, business email, entity, phone, comments, as stored in the CSV row
 * @return array{subject: string, mime: string, headers: string}
 */
function buildEnquiryMessage(array $values, string $submittedAt, bool $csvWritten, string $from): array
{
    [$individualName, $businessEmail, $entityName, $bestNumberToCall, $comments] = $values;

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

        // Header band: the site's own header artwork, logo already composed into
        // it, run edge to edge so it reads as the brand's letterhead rather than a
        // logo placed on a blank strip. Embedded by Content-ID rather than
        // hotlinked, so it displays without the recipient clicking "show images".
        // 1200x400 source at 600px for retina; JPEG because Outlook desktop cannot
        // render WebP. The cell background is the artwork's average colour, so a
        // client that blocks images still shows the navy band, with the alt text
        // in white on it.
        . '<tr><td style="background:#073268;padding:0;font-size:0;line-height:0;">'
        . '<img src="cid:ascendrev-header" width="600" height="200"'
        . ' alt="AscendRev, Outsourcing &amp; Offshoring Solutions"'
        . ' style="display:block;border:0;width:100%;max-width:600px;height:auto;'
        . 'color:#ffffff;font:600 18px/200px Arial,Helvetica,sans-serif;text-align:center;">'
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

    $mime .= '--' . $boundaryRelated . '--' . "\r\n";

    $headers = implode("\r\n", [
        'From: AscendRev Website <' . $from . '>',
        'Reply-To: ' . headerSafe($individualName) . ' <' . headerSafe($businessEmail) . '>',
        'MIME-Version: 1.0',
        'Content-Type: multipart/related; boundary="' . $boundaryRelated . '"',
        'X-Mailer: ascend-rev.ca',
    ]);

    return ['subject' => $subject, 'mime' => $mime, 'headers' => $headers];
}

/**
 * The enquiry-specific half of a cron retry: finds the persisted row and says how
 * to rebuild its message. Everything else about a retry is shared.
 *
 * @return callable(string): ?array{payload_hash: string, build: callable(string): array}
 */
function enquiryRetryLoader(string $storageDir): callable
{
    return static function (string $submissionKey) use ($storageDir): ?array {
        $row = findCsvRow($storageDir . '/enquiries.csv', CSV_HEADER, 7, $submissionKey);
        if ($row === null) {
            logLine($storageDir, 'retry_row_missing');
            return null;
        }
        $values = [(string) $row[1], (string) $row[2], (string) $row[3], (string) $row[4], (string) $row[5]];
        return [
            'payload_hash' => enquiryPayloadHash($values),
            'build' => static fn(string $from): array => buildEnquiryMessage($values, (string) $row[0], true, $from),
        ];
    };
}

/* ---------------------------------------------------------------------------
 * Outcome.
 *
 * The browser treats every 2xx as success, so a 2xx must mean the enquiry
 * cannot be lost. It can be once the CSV row and the delivery state are on disk:
 * from there the visitor is answered at once and delivery continues detached,
 * with cron retrying anything the attempt does not finish.
 * ------------------------------------------------------------------------ */

$from = headerSafe($MAIL_FROM);
$recipientsById = array_combine($requiredRecipientIds, $validatedRecipients);
$alreadyDelivered = acceptedCount($deliveryState, $requiredRecipientIds) === count($requiredRecipientIds);
$finishRequest = $alreadyDelivered ? null : finishRequestFunction();

// Delivery must survive the visitor closing the tab, and one session can outlast
// the default execution limit when the mail server is slow.
ignore_user_abort(true);
set_time_limit(120);


// Built lazily, only if a recipient is still pending, from the persisted row.
$buildMessage = static fn(string $from): array => buildEnquiryMessage($persistedValues, $submittedAt, true, $from);

if ($finishRequest !== null) {
    recordRateHit($rate['file'], $rate['hits'], $rate['now']);
    sendJson(200, ['ok' => true, 'recorded' => true, 'mailed' => false, 'queued' => true]);
    $finishRequest();

    runDeliveryAttempt(
        $SMTP,
        $STORAGE_DIR,
        $deliveryStatePath,
        $deliveryState,
        $recipientsById,
        $buildMessage,
        $from,
        'background'
    );
    releaseSubmissionLock($submissionLock);
    exit;
}

// No way to detach (php -S, CLI), or nothing left to send on a replay: answer
// after delivery, as the handler always did.
$mailDelivered = $alreadyDelivered || runDeliveryAttempt(
    $SMTP,
    $STORAGE_DIR,
    $deliveryStatePath,
    $deliveryState,
    $recipientsById,
    $buildMessage,
    $from,
    'sync'
);

recordRateHit($rate['file'], $rate['hits'], $rate['now']);
releaseSubmissionLock($submissionLock);

if (!$mailDelivered) {
    respond(503, ['ok' => false, 'error' => 'delivery_incomplete', 'recorded' => true]);
}

respond(200, ['ok' => true, 'mailed' => true, 'recorded' => true]);
