<?php
// router.php intercepts requests for 301 SEO redirects before serving React

$__baseDir = __DIR__;

// Load environment to ensure DB check works
if (file_exists($__baseDir . '/api/load-env.php')) {
    require_once $__baseDir . '/api/load-env.php';
}

require_once $__baseDir . '/api/config/database.php';
require_once $__baseDir . '/api/lib/RedirectService.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove common prefixes
$path = preg_replace('#^/new/#', '/', $path);
$path = preg_replace('#^/api/#', '/', $path);
$path = preg_replace('#^/admin/#', '/', $path);

// Only check DB if it's a non-api, non-admin route (e.g. /properties)
if (strpos($path, '.') === false) {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        $service = new RedirectService($conn);
        
        $rule = $service->findByUrlOld($path);
        if ($rule && !empty($rule['urlNew'])) {
            header("HTTP/1.1 301 Moved Permanently");
            header("Location: " . $rule['urlNew']);
            exit;
        }
    } catch (Exception $e) {
        error_log("Router Redirect Error: " . $e->getMessage());
    }
}

// Fallback to React index.html
require __DIR__ . '/index.html';
