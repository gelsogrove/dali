<?php

require_once __DIR__ . '/../config/database.php';
$__sitemapPath = realpath(__DIR__ . '/../lib/SitemapService.php') ?: (__DIR__ . '/../lib/SitemapService.php');
require_once $__sitemapPath;

class SeoTreeController {
    private $db;
    private $conn;
    private $sitemapService;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->sitemapService = new SitemapService($this->conn);
    }

    /**
     * Get SEO tree structure for dashboard
     */
    public function getTree() {
        try {
            $tree = [
                'name' => 'SEO Structure',
                'path' => '/',
                'type' => 'root',
                'children' => []
            ];

            // Static Pages
            $tree['children'][] = [
                'name' => 'Home',
                'path' => '/',
                'type' => 'static',
                'status' => 'active'
            ];

            // Properties Section
            $propertiesNode = [
                'name' => 'Listings',
                'path' => '/listings',
                'type' => 'category',
                'count' => 0,
                'children' => []
            ];
            $properties = $this->getProperties();
            $propertiesNode['count'] = count($properties);
            $propertiesNode['children'] = $properties;
            $tree['children'][] = $propertiesNode;

            // Landing Pages Section
            $landingPagesNode = [
                'name' => 'Landing Pages',
                'path' => '/landing-pages',
                'type' => 'category',
                'count' => 0,
                'children' => []
            ];
            $landingPages = $this->getLandingPages();
            $landingPagesNode['count'] = count($landingPages);
            $landingPagesNode['children'] = $landingPages;
            $tree['children'][] = $landingPagesNode;

            // Blog Section
            $blogNode = [
                'name' => 'Blog',
                'path' => '/blog',
                'type' => 'category',
                'count' => 0,
                'children' => []
            ];
            $blogs = $this->getBlogs();
            $blogNode['count'] = count($blogs);
            $blogNode['children'] = $blogs;
            $tree['children'][] = $blogNode;

            // Cities Section
            $citiesNode = [
                'name' => 'Communities',
                'path' => '/community',
                'type' => 'category',
                'count' => 0,
                'children' => []
            ];
            $cities = $this->getCities();
            $citiesNode['count'] = count($cities);
            $citiesNode['children'] = $cities;
            $tree['children'][] = $citiesNode;

            // Videos Section
            $videosNode = [
                'name' => 'Videos',
                'path' => '/videos',
                'type' => 'category',
                'count' => 0,
                'children' => []
            ];
            $videos = $this->getVideos();
            $videosNode['count'] = count($videos);
            $videosNode['children'] = $videos;
            $tree['children'][] = $videosNode;

            return $this->successResponse(['tree' => $tree]);
        } catch (Exception $e) {
            error_log("Error generating SEO tree: " . $e->getMessage());
            return $this->errorResponse('Failed to generate SEO tree');
        }
    }

    /**
     * Regenerate sitemap
     */
    public function regenerateSitemap() {
        try {
            $success = $this->sitemapService->generateSitemap();
            
            if ($success) {
                return $this->successResponse([
                    'message' => 'Sitemap regenerated successfully',
                    'timestamp' => date('c')
                ]);
            } else {
                return $this->errorResponse('Failed to generate sitemap. Check logs for details.', 500);
            }
        } catch (Exception $e) {
            error_log("Sitemap regeneration error: " . $e->getMessage());
            return $this->errorResponse('Sitemap generation error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get all active properties
     */
    private function getProperties() {
        $items = [];
        try {
            $query = "SELECT id, title, slug, updated_at, status FROM properties 
                     WHERE deleted_at IS NULL 
                     AND status IN ('for_sale', 'reserved', 'sold')
                     AND property_type NOT IN ('hot_deal', 'off_market')
                     ORDER BY updated_at DESC
                     LIMIT 100";
            $result = $this->conn->query($query);

            if (!$result) {
                error_log("Properties query failed: " . $this->conn->error);
                return $items;
            }

            while ($row = $result->fetch_assoc()) {
                $items[] = [
                    'name' => $row['title'],
                    'path' => '/listings/' . $row['slug'],
                    'slug' => $row['slug'],
                    'type' => 'property',
                    'status' => $row['status'],
                    'quality' => $this->validateSlug($row['slug']) ? 'good' : 'warning'
                ];
            }
        } catch (Exception $e) {
            error_log("Error fetching properties: " . $e->getMessage());
        }
        return $items;
    }

    /**
     * Get all active landing pages
     */
    private function getLandingPages() {
        $items = [];
        try {
            $query = "SELECT id, title, slug, is_home, is_active FROM landing_pages 
                     WHERE deleted_at IS NULL
                     ORDER BY display_order ASC";
            $result = $this->conn->query($query);

            if (!$result) {
                error_log("Landing pages query failed: " . $this->conn->error);
                return $items;
            }

            while ($row = $result->fetch_assoc()) {
                $items[] = [
                    'name' => $row['title'],
                    'path' => '/' . $row['slug'],
                    'slug' => $row['slug'],
                    'type' => 'landing',
                    'is_home' => $row['is_home'] ? true : false,
                    'is_active' => $row['is_active'] ? true : false,
                    'quality' => $this->validateSlug($row['slug']) ? 'good' : 'warning'
                ];
            }
        } catch (Exception $e) {
            error_log("Error fetching landing pages: " . $e->getMessage());
        }
        return $items;
    }

    /**
     * Get all blog posts
     */
    private function getBlogs() {
        $items = [];
        try {
            $query = "SELECT id, title, slug, is_published FROM blogs 
                     WHERE deleted_at IS NULL
                     AND is_published = 1
                     ORDER BY created_at DESC
                     LIMIT 100";
            $result = $this->conn->query($query);

            if (!$result) {
                error_log("Blog query failed: " . $this->conn->error);
                return $items;
            }

            while ($row = $result->fetch_assoc()) {
                $items[] = [
                    'name' => $row['title'],
                    'path' => '/blog/' . $row['slug'],
                    'slug' => $row['slug'],
                    'type' => 'blog',
                    'quality' => $this->validateSlug($row['slug']) ? 'good' : 'warning'
                ];
            }
        } catch (Exception $e) {
            error_log("Error fetching blogs: " . $e->getMessage());
        }
        return $items;
    }

    /**
     * Get all cities
     */
    private function getCities() {
        $items = [];
        try {
            $query = "SELECT id, name, slug FROM cities ORDER BY name ASC";
            $result = $this->conn->query($query);

            if (!$result) {
                error_log("Cities query failed: " . $this->conn->error);
                return $items;
            }

            while ($row = $result->fetch_assoc()) {
                $items[] = [
                    'name' => $row['name'],
                    'path' => '/community/' . $row['slug'],
                    'slug' => $row['slug'],
                    'type' => 'city',
                    'quality' => $this->validateSlug($row['slug']) ? 'good' : 'warning'
                ];
            }
        } catch (Exception $e) {
            error_log("Error fetching cities: " . $e->getMessage());
        }
        return $items;
    }

    /**
     * Get all videos
     */
    private function getVideos() {
        $items = [];
        try {
            $query = "SELECT id, title FROM videos WHERE is_active = 1 ORDER BY display_order ASC LIMIT 100";
            $result = $this->conn->query($query);

            if (!$result) {
                error_log("Videos query failed: " . $this->conn->error);
                return $items;
            }

            while ($row = $result->fetch_assoc()) {
                $items[] = [
                    'name' => $row['title'],
                    'path' => '/videos/' . $row['id'],
                    'type' => 'video',
                    'quality' => 'good'
                ];
            }
        } catch (Exception $e) {
            error_log("Error fetching videos: " . $e->getMessage());
        }
        return $items;
    }

    /**
     * Validate slug quality
     * Good: lowercase, hyphenated, no special chars, 3-50 chars
     */
    private function validateSlug($slug) {
        if (empty($slug)) return false;
        if (strlen($slug) < 3 || strlen($slug) > 50) return false;
        if (!preg_match('/^[a-z0-9-]+$/', $slug)) return false;
        if (strpos($slug, '--') !== false) return false;
        if ($slug[0] === '-' || $slug[strlen($slug) - 1] === '-') return false;
        return true;
    }

    /**
     * Success response
     */
    private function successResponse($data = [], $statusCode = 200) {
        http_response_code($statusCode);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Error response
     */
    private function errorResponse($message = '', $statusCode = 400) {
        http_response_code($statusCode);
        return ['success' => false, 'error' => $message];
    }
}
