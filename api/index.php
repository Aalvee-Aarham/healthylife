<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// This script's real path is /api/index.php, but that has no bearing on the
// public URL structure (which includes routes like /api/... on purpose).
// Left alone, Symfony's Request would treat "/api" as the app's base path
// (matching this script's directory) and strip it from every request's path
// info, breaking Laravel's own "api" route prefix. Pointing SCRIPT_NAME at a
// bare "/index.php" makes Symfony compute an empty base path instead, so the
// full request path (e.g. "/api/auth/login") reaches Laravel's router intact.
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

$backend = __DIR__.'/../packages/backend';

require "$backend/vendor/autoload.php";

// Vercel's function filesystem is read-only at runtime except for /tmp, so
// Laravel's cache/session/view/log storage is redirected there. /tmp is wiped
// between cold starts, which is fine: nothing here needs to persist across
// invocations (sessions use the "cookie" driver, cache uses "array", and logs
// go to stderr — see the *_STORE / *_DRIVER / LOG_CHANNEL env vars).
$storagePath = '/tmp/storage';
foreach (['app/public', 'framework/cache/data', 'framework/sessions', 'framework/views', 'logs'] as $dir) {
    @mkdir("$storagePath/$dir", 0775, true);
}

/** @var Application $app */
$app = require "$backend/bootstrap/app.php";
$app->useStoragePath($storagePath);

$app->handleRequest(Request::capture());
