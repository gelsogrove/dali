<?php
header('Content-Type: application/json');

$results = [
    'php_settings' => [
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
    ],
    'directories' => []
];

$uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/uploads';
$dirs = ['attachments', 'images/properties', 'videos'];

foreach ($dirs as $dir) {
    $path = $uploadDir . '/' . $dir;
    $results['directories'][$dir] = [
        'exists' => is_dir($path),
        'writable' => is_writable($path),
        'perms' => substr(sprintf('%o', fileperms($path)), -4)
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);
