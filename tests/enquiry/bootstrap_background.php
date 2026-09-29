<?php
/**
 * Test-only auto_prepend_file. Lets the CLI exercise the handler's BACKGROUND
 * path: it fakes a web request and defines litespeed_finish_request(), which the
 * handler detects with function_exists(). The stand-in records what the visitor
 * would have received at the moment the connection is released.
 */

$_SERVER['DOCUMENT_ROOT'] = getenv('TEST_DOCROOT');
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['HTTP_ORIGIN'] = 'http://localhost';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_POST = json_decode((string) getenv('TEST_POST'), true);

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
