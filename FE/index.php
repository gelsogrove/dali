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
    
    $html = file_get_contents($indexFile);
    
    // Server-side SEO: inject meta tags for property listing pages
    if (preg_match('#^/listings/([a-z0-9-]+)/?$#i', $path, $matches)) {
        $slug = $matches[1];
        try {
            $stmt = $conn->prepare("SELECT title, subtitle, seo_title, seo_description, og_title, og_description, og_image, cover_image_url, city, country, property_type, slug FROM properties WHERE slug = ? AND is_active = 1 LIMIT 1");
            if ($stmt) {
                $stmt->bind_param('s', $slug);
                $stmt->execute();
                $result = $stmt->get_result();
                $prop = $result->fetch_assoc();
                $stmt->close();
                
                if ($prop) {
                    $siteUrl = 'https://buywithdali.com';
                    $siteName = 'Buy With Dali';
                    
                    // Build SEO title
                    $seoTitle = $prop['seo_title'] 
                        ?: $prop['title'] . ($prop['city'] ? ' in ' . $prop['city'] : '');
                    if (stripos($seoTitle, $siteName) === false) {
                        $seoTitle .= ' | ' . $siteName;
                    }
                    
                    // Build description
                    $seoDesc = $prop['seo_description'] 
                        ?: ($prop['subtitle'] ?: $prop['title'] . ' - ' . ($prop['city'] ?: 'Riviera Maya'));
                    $seoDesc = htmlspecialchars(substr($seoDesc, 0, 300), ENT_QUOTES, 'UTF-8');
                    
                    // OG fields
                    $ogTitle = htmlspecialchars($prop['og_title'] ?: $seoTitle, ENT_QUOTES, 'UTF-8');
                    $ogDesc = htmlspecialchars($prop['og_description'] ?: $seoDesc, ENT_QUOTES, 'UTF-8');
                    $seoTitle = htmlspecialchars($seoTitle, ENT_QUOTES, 'UTF-8');
                    $canonicalUrl = $siteUrl . '/listings/' . $prop['slug'] . '/';
                    
                    // OG image
                    $ogImage = $prop['og_image'] ?: $prop['cover_image_url'];
                    if ($ogImage && !preg_match('#^https?://#', $ogImage)) {
                        $ogImage = $siteUrl . '/' . ltrim($ogImage, '/');
                    }
                    $ogImage = $ogImage ? htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8') : '';
                    
                    // Replace <title>
                    $html = preg_replace('#<title>[^<]*</title>#i', '<title>' . $seoTitle . '</title>', $html);
                    
                    // Replace meta description
                    $html = preg_replace('#<meta\s+name="description"\s+content="[^"]*"\s*/?>#i', '<meta name="description" content="' . $seoDesc . '" />', $html);
                    
                    // Replace OG tags
                    $html = preg_replace('#<meta\s+property="og:title"\s+content="[^"]*"\s*/?>#i', '<meta property="og:title" content="' . $ogTitle . '" />', $html);
                    $html = preg_replace('#<meta\s+property="og:description"\s+content="[^"]*"\s*/?>#i', '<meta property="og:description" content="' . $ogDesc . '" />', $html);
                    $html = preg_replace('#<meta\s+property="og:url"\s+content="[^"]*"\s*/?>#i', '<meta property="og:url" content="' . $canonicalUrl . '" />', $html);
                    $html = preg_replace('#<meta\s+property="og:type"\s+content="[^"]*"\s*/?>#i', '<meta property="og:type" content="product" />', $html);
                    
                    // Add og:image if not present, or replace
                    if ($ogImage) {
                        if (preg_match('#<meta\s+property="og:image"#i', $html)) {
                            $html = preg_replace('#<meta\s+property="og:image"\s+content="[^"]*"\s*/?>#i', '<meta property="og:image" content="' . $ogImage . '" />', $html);
                        } else {
                            $html = str_replace('</head>', '<meta property="og:image" content="' . $ogImage . '" />' . "\n" . '</head>', $html);
                        }
                    }
                    
                    // Add canonical link
                    if (strpos($html, 'rel="canonical"') === false) {
                        $html = str_replace('</head>', '<link rel="canonical" href="' . $canonicalUrl . '" />' . "\n" . '</head>', $html);
                    }
                }
            }
        } catch (Exception $e) {
            error_log('SEO injection error: ' . $e->getMessage());
        }
    }
    
    echo $html;
    exit;
}

http_response_code(503);
echo 'Frontend build not found';
