<?php
// Simula la richiesta come se fosse /admin/assets/index-CQ8_3ebm.js
$test_uri = '/admin/assets/index-CQ8_3ebm.js';

echo "TEST URI: $test_uri\n\n";

// Test pattern ^/admin
if (preg_match('#^/admin#', $test_uri)) {
    echo "✓ Pattern ^/admin MATCHA\n";
} else {
    echo "✗ Pattern ^/admin NON matcha\n";
}

// Test REQUEST_URI reale
echo "\nREQUEST_URI attuale: " . $_SERVER['REQUEST_URI'] . "\n";

// Test se file esiste
$file = __DIR__ . '/admin/assets/index-CQ8_3ebm.js';
echo "\nFile path: $file\n";
echo "File exists: " . (file_exists($file) ? 'YES' : 'NO') . "\n";
