<?php
require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/lib/RedirectService.php';

$db = new Database();
$conn = $db->getConnection();
$redirectService = new RedirectService($conn);

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?? '/';

// Skip redirect logic for API calls
if (strpos($path, '/api') === 0) {
    return false;
}

$normalized = $redirectService->normalizeUrl($path);
$rule = $redirectService->findByUrlOld($normalized);

if ($rule && !empty($rule['urlNew'])) {
    $urlNew = $redirectService->normalizeUrl($rule['urlNew']);
    if ($urlNew && $urlNew !== $normalized && !$redirectService->wouldCreateCycle($normalized, $urlNew, (int)($rule['id'] ?? 0))) {
        header("Location: {$urlNew}", true, 301);
        exit;
    }
}

// Serve static assets if they exist
$distPath = __DIR__ . '/dist';
$assetCandidate = realpath($distPath . $path);
if ($assetCandidate && is_file($assetCandidate) && strpos($assetCandidate, realpath($distPath)) === 0) {
    $mime = mime_content_type($assetCandidate);
    if ($mime) {
        header("Content-Type: {$mime}");
    }
    readfile($assetCandidate);
    exit;
}

// Default to SPA index
$indexFile = $distPath . '/index.html';
if (file_exists($indexFile)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($indexFile);
    exit;
}

http_response_code(503);
echo 'Frontend build not found';
