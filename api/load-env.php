<?php

/**
 * Local env loader (dev-only).
 * Reads key=value pairs from api/.env.local and injects them into env if not already set.
 * Use this to point the local API to a local DB without touching production variables.
 */
$envFile = __DIR__ . '/.env.local';

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

