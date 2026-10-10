<?php
/**
 * Test-only auto_prepend_file for php-cgi. php-cgi parses a real multipart body,
 * so is_uploaded_file() is true, while this defines litespeed_finish_request()
 * (which the handler detects with function_exists) to exercise the BACKGROUND
 * path. The stand-in records what the applicant would have received at the moment
 * the connection is released.
 */

ob_start();

function litespeed_finish_request(): bool
{
    file_put_contents((string) getenv('TEST_MARKER'), json_encode([
        't' => microtime(true),
        'status' => http_response_code(),
        'body' => ob_get_contents(),
    ]));
    return true;
}
