<?php

/**
 * Environment loader.
 * Reads key=value pairs from .env.local (dev) or .env (production) and injects them into env.
 */

// Try .env.local first (development), then .env (production)
$envFile = __DIR__ . '/.env.local';
if (!file_exists($envFile)) {
    $envFile = __DIR__ . '/.env';
}

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || strncmp($trimmed, '#', 1) === 0) {
            continue;
        }
        if (strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $value = trim($value, "\"'");

        if ($key === '') {
            continue;
        }

        // Do not override existing env
        if (getenv($key) !== false) {
            continue;
        }

        putenv("$key=$value");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}
