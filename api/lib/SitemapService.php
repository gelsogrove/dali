<?php

class SitemapService {
    private $conn;
    private $baseUrl;
    private $sitemapPath;

    public function __construct($conn, $baseUrl = 'https://buywithdali.com', $sitemapPath = null) {
        $this->conn = $conn;
        $this->baseUrl = rtrim($baseUrl, '/');
        
        // Default sitemap path: write directly to webroot/sitemap.xml
        if ($sitemapPath === null) {
            $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '/var/www/html', '/');
            $sitemapPath = $docRoot . '/sitemap.xml';
        }
        $this->sitemapPath = $sitemapPath;
    }

    /**
     * Generate and save the complete sitemap
     * Should be called whenever content is created/updated/deleted
     */
    public function generateSitemap() {
        try {
            $urls = [];

            // Add static pages (highest priority)
            $urls[] = $this->createUrl('/', '1.0', 'weekly', date('c'));
            $urls[] = $this->createUrl('/about', '0.9', 'monthly', date('c'));
            $urls[] = $this->createUrl('/contact', '0.9', 'monthly', date('c'));
            $urls[] = $this->createUrl('/properties', '0.9', 'weekly', date('c'));
            $urls[] = $this->createUrl('/blog', '0.8', 'weekly', date('c'));
            $urls[] = $this->createUrl('/videos', '0.8', 'weekly', date('c'));
            $urls[] = $this->createUrl('/communities', '0.8', 'weekly', date('c'));
            $urls[] = $this->createUrl('/privacy-policy', '0.7', 'yearly', date('c'));

            // Add all published blogs
            $blogUrls = $this->getBlogUrls();
            $urls = array_merge($urls, $blogUrls);

            // Add all active properties
            $propertyUrls = $this->getPropertyUrls();
            $urls = array_merge($urls, $propertyUrls);

            // Add all videos
            $videoUrls = $this->getVideoUrls();
            $urls = array_merge($urls, $videoUrls);

            // Add cities (when table exists)
            if ($this->tableExists('cities')) {
                $cityUrls = $this->getCityUrls();
                $urls = array_merge($urls, $cityUrls);
            }

            // Add areas (when table exists)
            if ($this->tableExists('areas')) {
                $areaUrls = $this->getAreaUrls();
                $urls = array_merge($urls, $areaUrls);
            }

            // Generate XML
            $xml = $this->generateXml($urls);

            // Write to file
            $this->writeSitemapFile($xml);

            error_log("Sitemap generated successfully with " . count($urls) . " URLs");
            return true;

        } catch (Exception $e) {
            error_log("Sitemap generation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get all published blog URLs
     */
    private function getBlogUrls() {
        $urls = [];
        try {
            $query = "SELECT slug, updated_at FROM blogs WHERE deleted_at IS NULL ORDER BY updated_at DESC";
            $result = $this->conn->query($query);

            while ($row = $result->fetch_assoc()) {
                $urls[] = $this->createUrl(
                    '/blog/' . $row['slug'],
                    '0.8',
                    'weekly',
                    $row['updated_at']
                );
            }
        } catch (Exception $e) {
            error_log("Error fetching blog URLs: " . $e->getMessage());
        }

        return $urls;
    }

    /**
     * Get all active property URLs
     */
    private function getPropertyUrls() {
        $urls = [];
        try {
            $query = "SELECT slug, updated_at FROM properties WHERE status = 'active' ORDER BY updated_at DESC";
            $result = $this->conn->query($query);

            while ($row = $result->fetch_assoc()) {
                $urls[] = $this->createUrl(
                    '/property/' . $row['slug'],
                    '0.8',
                    'weekly',
                    $row['updated_at']
                );
            }
        } catch (Exception $e) {
            error_log("Error fetching property URLs: " . $e->getMessage());
        }

        return $urls;
    }

    /**
     * Get all video URLs
     */
    private function getVideoUrls() {
        $urls = [];
        try {
            $query = "SELECT id, updated_at FROM videos WHERE is_active = 1 ORDER BY display_order ASC";
            $result = $this->conn->query($query);

            if ($result && $result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    $urls[] = $this->createUrl(
                        '/videos/' . $row['id'],
                        '0.7',
                        'monthly',
                        $row['updated_at']
                    );
                }
            }
        } catch (Exception $e) {
            error_log("Error fetching video URLs: " . $e->getMessage());
        }

        return $urls;
    }

    /**
     * Get all city URLs (when cities table exists)
     */
    private function getCityUrls() {
        $urls = [];
        try {
            $query = "SELECT slug, updated_at FROM cities ORDER BY updated_at DESC";
            $result = $this->conn->query($query);

            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $urls[] = $this->createUrl(
                        '/community/' . $row['slug'],
                        '0.8',
                        'monthly',
                        $row['updated_at']
                    );
                }
            }
        } catch (Exception $e) {
            error_log("Error fetching city URLs: " . $e->getMessage());
        }

        return $urls;
    }

    /**
     * Get all area URLs (when areas table exists)
     */
    private function getAreaUrls() {
        $urls = [];
        try {
            $query = "SELECT slug, city_id, updated_at FROM areas ORDER BY updated_at DESC";
            $result = $this->conn->query($query);

            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    // Assuming URL structure: /community/city-slug/area-slug
                    $urls[] = $this->createUrl(
                        '/community/' . $row['slug'],
                        '0.7',
                        'monthly',
                        $row['updated_at']
                    );
                }
            }
        } catch (Exception $e) {
            error_log("Error fetching area URLs: " . $e->getMessage());
        }

        return $urls;
    }

    /**
     * Create a single URL entry
     */
    private function createUrl($path, $priority = '0.5', $changefreq = 'monthly', $lastmod = null) {
        return [
            'loc' => $this->baseUrl . $path,
            'lastmod' => $lastmod ?: date('c'),
            'changefreq' => $changefreq,
            'priority' => $priority
        ];
    }

    /**
     * Generate XML content
     */
    private function generateXml($urls) {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . PHP_EOL;
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . PHP_EOL;

        foreach ($urls as $url) {
            $xml .= '  <url>' . PHP_EOL;
            $xml .= '    <loc>' . htmlspecialchars($url['loc'], ENT_XML1, 'UTF-8') . '</loc>' . PHP_EOL;
            $xml .= '    <lastmod>' . htmlspecialchars($url['lastmod'], ENT_XML1, 'UTF-8') . '</lastmod>' . PHP_EOL;
            $xml .= '    <changefreq>' . htmlspecialchars($url['changefreq'], ENT_XML1, 'UTF-8') . '</changefreq>' . PHP_EOL;
            $xml .= '    <priority>' . htmlspecialchars($url['priority'], ENT_XML1, 'UTF-8') . '</priority>' . PHP_EOL;
            $xml .= '  </url>' . PHP_EOL;
        }

        $xml .= '</urlset>' . PHP_EOL;
        return $xml;
    }

    /**
     * Write sitemap to file
     */
    private function writeSitemapFile($xml) {
        if (!is_writable(dirname($this->sitemapPath))) {
            throw new Exception("Sitemap path not writable: " . $this->sitemapPath);
        }
        if (file_exists($this->sitemapPath) && !is_writable($this->sitemapPath)) {
            throw new Exception("Sitemap file not writable: " . $this->sitemapPath);
        }
        if (file_put_contents($this->sitemapPath, $xml) === false) {
            throw new Exception("Failed to write sitemap to " . $this->sitemapPath);
        }
    }

    /**
     * Check if a table exists
     */
    private function tableExists($tableName) {
        try {
            $result = $this->conn->query("SELECT 1 FROM $tableName LIMIT 1");
            return $result !== false;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get the sitemap file path
     */
    public function getSitemapPath() {
        return $this->sitemapPath;
    }
}
