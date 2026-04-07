<?php

require_once __DIR__ . '/../config/database.php';
$__baseDir = rtrim(__DIR__, "/\\ \t\n\r\0\x0B");
$__redirectPath = realpath($__baseDir . '/../lib/RedirectService.php') ?: ($__baseDir . '/../lib/RedirectService.php');
require_once $__redirectPath;
$__sitemapPath = realpath($__baseDir . '/../lib/SitemapService.php') ?: ($__baseDir . '/../lib/SitemapService.php');
require_once $__sitemapPath;
require_once __DIR__ . '/UploadController.php';

class LandingPageController {
    private $db;
    private $conn;
    private $redirectService;
    private $sitemapService;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->redirectService = new RedirectService($this->conn);
        $this->sitemapService = new SitemapService($this->conn);
    }

    /**
     * Get all landing pages with optional filters
     */
    public function getAll($filters = []) {
        try {
            $where = [];
            $params = [];
            $types = '';

            // Soft delete support
            $includeDeleted = $filters['include_deleted'] ?? null;
            $includeDeletedFlag = $includeDeleted === '1' || $includeDeleted === 'true' || $includeDeleted === 1 || $includeDeleted === true;
            if (!$includeDeletedFlag) {
                $where[] = "deleted_at IS NULL";
            }

            // Filter by active status
            if (isset($filters['is_active'])) {
                $where[] = "is_active = ?";
                $params[] = ($filters['is_active'] === 'true' || $filters['is_active'] === '1') ? 1 : 0;
                $types .= 'i';
            }

            // Filter by is_home
            if (isset($filters['is_home'])) {
                $where[] = "is_home = ?";
                $params[] = ($filters['is_home'] === 'true' || $filters['is_home'] === '1') ? 1 : 0;
                $types .= 'i';
            }

            // Support legacy 'featured' parameter for backward compatibility
            if (isset($filters['featured']) && !isset($filters['is_home'])) {
                $where[] = "is_home = ?";
                $params[] = ($filters['featured'] === 'true' || $filters['featured'] === '1') ? 1 : 0;
                $types .= 'i';
            }

            // Search query
            if (!empty($filters['q'])) {
                $where[] = "(title LIKE ? OR subtitle LIKE ? OR seo_title LIKE ? OR seo_description LIKE ?)";
                $searchTerm = '%' . $filters['q'] . '%';
                array_push($params, $searchTerm, $searchTerm, $searchTerm, $searchTerm);
                $types .= 'ssss';
            }

            $whereClause = empty($where) ? '1=1' : implode(' AND ', $where);
            $query = "SELECT * FROM landing_pages WHERE $whereClause ORDER BY display_order ASC, created_at DESC";

            $result = empty($params)
                ? $this->conn->query($query)
                : $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to fetch landing pages');
            }

            $items = [];
            while ($row = $result->fetch_assoc()) {
                $items[] = $this->formatLandingPage($row);
            }

            return $this->successResponse(['landing_pages' => $items]);
        } catch (Exception $e) {
            error_log("Error fetching landing pages: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get landing page by ID
     */
    public function getById($id) {
        try {
            $query = "SELECT * FROM landing_pages WHERE id = ? AND deleted_at IS NULL LIMIT 1";
            $result = $this->db->executePrepared($query, [$id], 'i');
            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Landing page not found', 404);
            }
            $page = $result->fetch_assoc();
            return $this->successResponse($this->formatLandingPage($page, true));
        } catch (Exception $e) {
            error_log("Error fetching landing page: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get landing page by slug (public endpoint)
     */
    public function getBySlug($slug) {
        try {
            $query = "SELECT * FROM landing_pages WHERE slug = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1";
            $result = $this->db->executePrepared($query, [$slug], 's');
            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Landing page not found', 404);
            }
            $page = $result->fetch_assoc();
            return $this->successResponse($this->formatLandingPage($page, true));
        } catch (Exception $e) {
            error_log("Error fetching landing page by slug: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Create new landing page
     */
    public function create($data) {
        try {
            if (empty($data['title']) || empty($data['slug'])) {
                return $this->errorResponse('Title and slug are required', 400);
            }

            $slug = $this->slugify($data['slug']);
            
            // Check slug uniqueness
            $check = $this->db->executePrepared(
                "SELECT id FROM landing_pages WHERE slug = ? LIMIT 1",
                [$slug],
                's'
            );
            if ($check && $check->num_rows > 0) {
                return $this->errorResponse('Slug already exists', 400);
            }

            $allowedFields = [
                'title', 'subtitle', 'slug', 'description', 'content',
                'seo_title', 'seo_description', 'seo_keywords',
                'og_title', 'og_description',
                'cover_image', 'cover_image_alt',
                'is_active', 'is_home', 'display_order',
                'content_block_1_title', 'content_block_1_subtitle', 'content_block_1_description', 'content_block_1_image',
                'content_block_2_title', 'content_block_2_subtitle', 'content_block_2_description', 'content_block_2_image',
                'content_block_3_title', 'content_block_3_subtitle', 'content_block_3_description', 'content_block_3_image',
                'content_block_4_title', 'content_block_4_subtitle', 'content_block_4_description', 'content_block_4_image',
            ];

            $columns = [];
            $placeholders = [];
            $params = [];
            $types = '';

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $columns[] = $field;
                    $placeholders[] = '?';
                    
                    if ($field === 'slug') {
                        $params[] = $slug;
                    } else {
                        $params[] = $data[$field];
                    }
                    
                    // Determine type
                    if (in_array($field, ['is_active', 'is_home', 'display_order'])) {
                        $types .= 'i';
                    } else {
                        $types .= 's';
                    }
                }
            }

            if (empty($columns)) {
                return $this->errorResponse('No valid fields provided', 400);
            }

            // Auto-set og_image = cover_image
            if (array_key_exists('cover_image', $data)) {
                $columns[] = 'og_image';
                $placeholders[] = '?';
                $params[] = $data['cover_image'];
                $types .= 's';
            }

            $columnsStr = implode(', ', $columns);
            $placeholdersStr = implode(', ', $placeholders);
            $query = "INSERT INTO landing_pages ($columnsStr) VALUES ($placeholdersStr)";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                error_log("Landing page create prepare failed: " . $this->conn->error);
                return $this->errorResponse('Database error', 500);
            }

            $stmt->bind_param($types, ...$params);
            if (!$stmt->execute()) {
                error_log("Landing page create execute failed: " . $stmt->error);
                return $this->errorResponse('Failed to create landing page', 500);
            }

            $pageId = $stmt->insert_id;
            $stmt->close();

            return $this->successResponse([
                'id' => $pageId,
                'slug' => $slug,
                'message' => 'Landing page created successfully'
            ], 201);
        } catch (Exception $e) {
            error_log("Error creating landing page: " . $e->getMessage());
            return $this->errorResponse('An error occurred', 500);
        }
    }

    /**
     * Update landing page
     */
    public function update($id, $data) {
        try {
            // Verify exists
            $checkQuery = "SELECT id, slug FROM landing_pages WHERE id = ?";
            $checkResult = $this->db->executePrepared($checkQuery, [$id], 'i');
            if (!$checkResult || $checkResult->num_rows === 0) {
                return $this->errorResponse('Landing page not found', 404);
            }
            $existingPage = $checkResult->fetch_assoc();

            // Check slug uniqueness if slug is being updated
            if (array_key_exists('slug', $data) && !empty($data['slug'])) {
                $newSlug = $this->slugify($data['slug']);
                if ($newSlug !== $existingPage['slug']) {
                    $slugCheck = $this->db->executePrepared(
                        "SELECT id FROM landing_pages WHERE slug = ? AND id != ? LIMIT 1",
                        [$newSlug, $id],
                        'si'
                    );
                    if ($slugCheck && $slugCheck->num_rows > 0) {
                        return $this->errorResponse('Slug already exists', 400);
                    }
                    $data['slug'] = $newSlug;
                }
            }

            $allowedFields = [
                'title', 'subtitle', 'slug', 'description', 'content',
                'seo_title', 'seo_description', 'seo_keywords',
                'og_title', 'og_description',
                'cover_image', 'cover_image_alt',
                'is_active', 'is_home', 'display_order',
                'content_block_1_title', 'content_block_1_subtitle', 'content_block_1_description', 'content_block_1_image',
                'content_block_2_title', 'content_block_2_subtitle', 'content_block_2_description', 'content_block_2_image',
                'content_block_3_title', 'content_block_3_subtitle', 'content_block_3_description', 'content_block_3_image',
                'content_block_4_title', 'content_block_4_subtitle', 'content_block_4_description', 'content_block_4_image',
            ];

            $updates = [];
            $params = [];
            $types = '';

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                    
                    if (in_array($field, ['is_active', 'is_home', 'display_order'])) {
                        $types .= 'i';
                    } else {
                        $types .= 's';
                    }
                }
            }

            // Auto-set og_image = cover_image
            if (array_key_exists('cover_image', $data)) {
                $updates[] = "og_image = ?";
                $params[] = $data['cover_image'];
                $types .= 's';
            }

            if (empty($updates)) {
                return $this->errorResponse('No fields to update', 400);
            }

            $params[] = $id;
            $types .= 'i';

            $updateStr = implode(', ', $updates);
            $query = "UPDATE landing_pages SET $updateStr WHERE id = ?";

            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                error_log("Landing page update prepare failed: " . $this->conn->error);
                return $this->errorResponse('Database error', 500);
            }

            $stmt->bind_param($types, ...$params);
            if (!$stmt->execute()) {
                error_log("Landing page update execute failed: " . $stmt->error);
                return $this->errorResponse('Failed to update landing page', 500);
            }

            $stmt->close();

            return $this->successResponse(['message' => 'Landing page updated successfully']);
        } catch (Exception $e) {
            error_log("Error updating landing page: " . $e->getMessage());
            return $this->errorResponse('An error occurred', 500);
        }
    }

    /**
     * Soft delete landing page
     */
    public function delete($id) {
        try {
            $checkQuery = "SELECT id FROM landing_pages WHERE id = ?";
            $checkResult = $this->db->executePrepared($checkQuery, [$id], 'i');
            if (!$checkResult || $checkResult->num_rows === 0) {
                return $this->errorResponse('Landing page not found', 404);
            }

            $query = "UPDATE landing_pages SET deleted_at = NOW() WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if ($result === false) {
                return $this->errorResponse('Failed to delete landing page', 500);
            }

            return $this->successResponse(['message' => 'Landing page deleted successfully']);
        } catch (Exception $e) {
            error_log("Error deleting landing page: " . $e->getMessage());
            return $this->errorResponse('An error occurred', 500);
        }
    }

    /**
     * Reorder landing pages
     */
    public function reorder($order) {
        try {
            if (!is_array($order) || empty($order)) {
                return $this->errorResponse('Invalid order data', 400);
            }

            foreach ($order as $item) {
                if (!isset($item['id']) || !isset($item['display_order'])) {
                    continue;
                }
                
                $query = "UPDATE landing_pages SET display_order = ? WHERE id = ?";
                $this->db->executePrepared($query, [$item['display_order'], $item['id']], 'ii');
            }

            return $this->successResponse(['message' => 'Landing pages reordered successfully']);
        } catch (Exception $e) {
            error_log("Error reordering landing pages: " . $e->getMessage());
            return $this->errorResponse('An error occurred', 500);
        }
    }

    /**
     * Format landing page data
     */
    private function formatLandingPage($row, $includeBlocks = false) {
        $data = [
            'id' => (int)$row['id'],
            'title' => $row['title'] ?? '',
            'slug' => $row['slug'] ?? '',
            'subtitle' => $row['subtitle'] ?? '',
            'description' => $row['description'] ?? '',
            'content' => $row['content'] ?? '',
            'seoTitle' => $row['seo_title'] ?? '',
            'seoDescription' => $row['seo_description'] ?? '',
            'seoKeywords' => $row['seo_keywords'] ?? '',
            'ogTitle' => $row['og_title'] ?? '',
            'ogDescription' => $row['og_description'] ?? '',
            'ogImage' => $row['og_image'] ?? '',
            'cover_image' => $row['cover_image'] ?? '',
            'cover_image_alt' => $row['cover_image_alt'] ?? '',
            'is_active' => (int)$row['is_active'],
            'is_home' => (int)$row['is_home'],
            'display_order' => (int)$row['display_order'],
            'created_at' => $row['created_at'] ?? '',
            'updated_at' => $row['updated_at'] ?? '',
            // Legacy content block columns (for backward compat)
            'content_block_1_title' => $row['content_block_1_title'] ?? '',
            'content_block_1_subtitle' => $row['content_block_1_subtitle'] ?? '',
            'content_block_1_description' => $row['content_block_1_description'] ?? '',
            'content_block_1_image' => $row['content_block_1_image'] ?? '',
            'content_block_2_title' => $row['content_block_2_title'] ?? '',
            'content_block_2_subtitle' => $row['content_block_2_subtitle'] ?? '',
            'content_block_2_description' => $row['content_block_2_description'] ?? '',
            'content_block_2_image' => $row['content_block_2_image'] ?? '',
            'content_block_3_title' => $row['content_block_3_title'] ?? '',
            'content_block_3_subtitle' => $row['content_block_3_subtitle'] ?? '',
            'content_block_3_description' => $row['content_block_3_description'] ?? '',
            'content_block_3_image' => $row['content_block_3_image'] ?? '',
            'content_block_4_title' => $row['content_block_4_title'] ?? '',
            'content_block_4_subtitle' => $row['content_block_4_subtitle'] ?? '',
            'content_block_4_description' => $row['content_block_4_description'] ?? '',
            'content_block_4_image' => $row['content_block_4_image'] ?? '',
        ];

        if ($includeBlocks) {
            $data['blocks'] = $this->getBlocksForPage((int)$row['id']);
        }

        return $data;
    }

    /**
     * Get content blocks from the dynamic blocks table
     */
    private function getBlocksForPage($landingPageId) {
        try {
            $query = "SELECT * FROM landing_page_content_blocks WHERE landing_page_id = ? ORDER BY display_order ASC";
            $result = $this->db->executePrepared($query, [$landingPageId], 'i');
            
            if (!$result) return [];

            $blocks = [];
            while ($row = $result->fetch_assoc()) {
                $blocks[] = [
                    'id' => (int)$row['id'],
                    'landing_page_id' => (int)$row['landing_page_id'],
                    'title' => $row['title'],
                    'subtitle' => $row['subtitle'],
                    'description' => $row['description'],
                    'image' => $row['image'],
                    'display_order' => (int)$row['display_order'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at'],
                ];
            }
            return $blocks;
        } catch (Exception $e) {
            error_log("Error fetching blocks for page $landingPageId: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Convert string to URL-friendly slug
     */
    private function slugify($text) {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9]+/', '-', $text);
        $text = trim($text, '-');
        return $text ?: 'landing-page';
    }

    /**
     * Success response helper
     */
    private function successResponse($data = [], $statusCode = 200) {
        http_response_code($statusCode);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Error response helper
     */
    private function errorResponse($message = '', $statusCode = 400) {
        http_response_code($statusCode);
        return ['success' => false, 'message' => $message];
    }
}

?>
