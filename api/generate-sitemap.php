<?php
/**
 * Script to manually generate sitemap
 * Run: docker exec -w /var/www/html dalila-backend php generate-sitemap.php
 */

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/lib/SitemapService.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if (!$conn) {
        throw new Exception("Database connection failed");
    }
    
    $sitemapPath = '/tmp/sitemap.xml';
    
    $sitemapService = new SitemapService($conn, 'https://buywithdali.com', $sitemapPath);
    $sitemapService->generateSitemap();
    
    // Leggi e stampa il contenuto
    $content = file_get_contents($sitemapPath);
    echo $content;
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
