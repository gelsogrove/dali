<?php
echo "DOCUMENT_ROOT: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "ABSPATH: " . __DIR__ . "\n";
$uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/uploads';
echo "Target Upload Dir: " . $uploadDir . "\n";
echo "Upload Dir Exists: " . (is_dir($uploadDir) ? 'Yes' : 'No') . "\n";
if (is_dir($uploadDir)) {
    echo "Upload Dir Permissions: " . substr(sprintf('%o', fileperms($uploadDir)), -4) . "\n";
}

$dirs = ['images', 'images/properties', 'attachments'];
foreach ($dirs as $dir) {
    $path = $uploadDir . '/' . $dir;
    echo "Checking $path: " . (is_dir($path) ? 'EXISTS' : 'MISSING') . "\n";
    if (!is_dir($path)) {
        echo "Attempting to create $path...\n";
        $res = mkdir($path, 0755, true);
        echo "Result: " . ($res ? 'SUCCESS' : 'FAILURE') . "\n";
        if (!$res) {
            $err = error_get_last();
            echo "Error: " . ($err['message'] ?? 'Unknown error') . "\n";
        }
    }
}
?>