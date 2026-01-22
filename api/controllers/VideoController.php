<?php

$__baseDir = rtrim(__DIR__, "/\\ \t\n\r\0\x0B");
require_once $__baseDir . '/../config/database.php';
$__redirectPath = realpath($__baseDir . '/../lib/RedirectService.php') ?: ($__baseDir . '/../lib/RedirectService.php');
require_once $__redirectPath;
$__sitemapPath = realpath($__baseDir . '/../lib/SitemapService.php') ?: ($__baseDir . '/../lib/SitemapService.php');
require_once $__sitemapPath;

class VideoController {
    private $db;
    private $conn;
    private $hasCreatedBy = false;
    private $redirectService;
    private $sitemapService;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->ensureSchema();
        $this->redirectService = new RedirectService($this->conn);
        $this->sitemapService = new SitemapService($this->conn);
    }

    /**
     * Get all videos with optional filters
     */
    public function getAll($filters = []) {
        try {
            $where = [];
            $params = [];
            $types = '';

            // Exclude soft deleted by default
            if (empty($filters['include_deleted'])) {
                $where[] = "deleted_at IS NULL";
            }

            // is_home filter
            if (isset($filters['is_home'])) {
                $where[] = "is_home = ?";
                $params[] = ($filters['is_home'] === 'true' || $filters['is_home'] === '1') ? 1 : 0;
                $types .= 'i';
            }

            // Search filter (title + description)
            if (!empty($filters['q'])) {
                $where[] = "(title LIKE ? OR description LIKE ?)";
                $term = '%' . $filters['q'] . '%';
                array_push($params, $term, $term);
                $types .= 'ss';
            }

            // Optional property filter (kept for compatibility)
            if (!empty($filters['property_id'])) {
                $where[] = "property_id = ?";
                $params[] = (int)$filters['property_id'];
                $types .= 'i';
            }

            $whereClause = empty($where) ? '1=1' : implode(' AND ', $where);
            $limit = isset($filters['limit']) ? max(1, (int)$filters['limit']) : null;

            // Pagination
            $page = isset($filters['page']) ? max(1, (int)$filters['page']) : 1;
            $perPage = isset($filters['per_page']) ? max(1, (int)$filters['per_page']) : 12;
            if ($limit) {
                $perPage = $limit;
                $page = 1;
            }
            $offset = ($page - 1) * $perPage;

            $selectColumns = "id, property_id, title, description, video_url, video_type, thumbnail_url, thumbnail_alt, display_order, is_home, created_at, updated_at, deleted_at";

            $query = "SELECT $selectColumns 
                      FROM videos 
                      WHERE $whereClause 
                      ORDER BY display_order ASC, created_at DESC 
                      LIMIT ? OFFSET ?";
            
            // Add pagination to parameters
            $params[] = $perPage;
            $params[] = $offset;
            $types .= 'ii';

            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to fetch videos');
            }

            $videos = [];
            while ($row = $result->fetch_assoc()) {
                $videos[] = $this->formatVideo($row);
            }

            if ($limit) {
                return $this->successResponse([
                    'videos' => $videos,
                    'pagination' => [
                        'total' => count($videos),
                        'page' => 1,
                        'per_page' => $perPage,
                        'total_pages' => 1
                    ]
                ]);
            }

            // Count (without LIMIT/OFFSET)
            $countQuery = "SELECT COUNT(*) as total FROM videos WHERE $whereClause";
            // Remove last 2 params (LIMIT/OFFSET) for count
            $countParams = array_slice($params, 0, -2);
            $countTypes = substr($types, 0, -2);
            $countResult = empty($countParams)
                ? $this->conn->query($countQuery)
                : $this->db->executePrepared($countQuery, $countParams, $countTypes);
            $total = $countResult->fetch_assoc()['total'] ?? 0;

            return $this->successResponse([
                'videos' => $videos,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => $perPage > 0 ? ceil($total / $perPage) : 1
                ]
            ]);
        } catch (Exception $e) {
            error_log("Error fetching videos: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get single video
     */
    public function getById($id) {
        try {
            $query = "SELECT * FROM videos WHERE id = ? AND deleted_at IS NULL LIMIT 1";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Video not found', 404);
            }

            $video = $result->fetch_assoc();
            return $this->successResponse($this->formatVideo($video));
        } catch (Exception $e) {
            error_log("Error fetching video: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Create video
     */
    public function create($data, $userId) {
        try {
            if (empty($data['title'])) {
                return $this->errorResponse('Title is required', 400);
            }
            if (empty($data['video_url'])) {
                return $this->errorResponse('Video URL is required', 400);
            }
            if (strpos($data['video_url'], 'vimeo.com') === false) {
                return $this->errorResponse('Video URL must be a Vimeo link', 400);
            }
            if (empty($data['thumbnail_url'])) {
                return $this->errorResponse('Thumbnail image is required', 400);
            }
            if (empty($data['thumbnail_alt'])) {
                return $this->errorResponse('Thumbnail alt text is required', 400);
            }

            $displayOrder = isset($data['display_order']) ? (int)$data['display_order'] : $this->getNextDisplayOrder();

            $columns = ['property_id', 'title', 'description', 'video_url', 'video_type', 'thumbnail_url', 'thumbnail_alt', 'display_order', 'is_home'];
            $placeholders = ['?', '?', '?', '?', '?', '?', '?', '?', '?'];
            $params = [
                $data['property_id'] ?? null,
                $data['title'],
                $data['description'] ?? null,
                $data['video_url'],
                $data['video_type'] ?? 'vimeo',
                $data['thumbnail_url'],
                $data['thumbnail_alt'],
                $displayOrder,
                isset($data['is_home']) ? (int)$data['is_home'] : 0,
            ];
            $types = 'issssssii';

            if ($this->hasCreatedBy) {
                $columns[] = 'created_by';
                $placeholders[] = '?';
                $params[] = $userId;
                $types .= 'i';
            }

            $query = "INSERT INTO videos (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $placeholders) . ")";

            $result = $this->db->executePrepared($query, $params, $types);
            if (!$result) {
                return $this->errorResponse('Failed to create video');
            }

            $videoId = $this->db->getLastInsertId();
            $this->logActivity($userId, 'create', 'video', $videoId, "Created video: {$data['title']}");

            // Regenerate sitemap
            $this->sitemapService->generateSitemap();

            return $this->successResponse([
                'id' => $videoId,
                'message' => 'Video created successfully'
            ], 201);
        } catch (Exception $e) {
            error_log("Error creating video: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Update video
     */
    public function update($id, $data, $userId) {
        try {
            $check = $this->db->executePrepared("SELECT * FROM videos WHERE id = ? AND deleted_at IS NULL LIMIT 1", [$id], 'i');
            if (!$check || $check->num_rows === 0) {
                return $this->errorResponse('Video not found', 404);
            }

            if (!empty($data['video_url']) && strpos($data['video_url'], 'vimeo.com') === false) {
                return $this->errorResponse('Video URL must be a Vimeo link', 400);
            }

            if (isset($data['thumbnail_url']) && !empty($data['thumbnail_url']) && empty($data['thumbnail_alt'])) {
                return $this->errorResponse('Thumbnail alt text is required', 400);
            }

            $allowed = ['property_id', 'title', 'description', 'video_url', 'video_type', 'thumbnail_url', 'thumbnail_alt', 'display_order', 'is_home'];
            $updates = [];
            $params = [];
            $types = '';

            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                    $types .= $this->getParamType($field);
                }
            }

            if (empty($updates)) {
                return $this->errorResponse('No valid fields to update', 400);
            }

            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE videos SET " . implode(', ', $updates) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to update video');
            }

            $this->logActivity($userId, 'update', 'video', $id, "Updated video: {$data['title']}");

            // Regenerate sitemap
            $this->sitemapService->generateSitemap();

            return $this->successResponse(['message' => 'Video updated successfully']);
        } catch (Exception $e) {
            error_log("Error updating video: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Delete video and its thumbnail
     */
    public function delete($id, $userId) {
        try {
            $fetch = $this->db->executePrepared("SELECT thumbnail_url, created_at, deleted_at FROM videos WHERE id = ? LIMIT 1", [$id], 'i');
            if (!$fetch || $fetch->num_rows === 0) {
                return $this->errorResponse('Video not found', 404);
            }
            $row = $fetch->fetch_assoc();
            if (!empty($row['deleted_at'])) {
                return $this->errorResponse('Video already archived', 400);
            }

            $createdAt = new DateTime($row['created_at']);
            $now = new DateTime();
            $hoursDiff = ($now->getTimestamp() - $createdAt->getTimestamp()) / 3600;

            if ($hoursDiff < 24) {
                $result = $this->db->executePrepared("DELETE FROM videos WHERE id = ?", [$id], 'i');
                if (!$result) {
                    return $this->errorResponse('Failed to delete video');
                }

                if (!empty($row['thumbnail_url'])) {
                    require_once __DIR__ . '/UploadController.php';
                    $uploader = new UploadController();
                    $uploader->deleteFile($row['thumbnail_url']);
                }

                $this->logActivity($userId, 'delete', 'video', $id, "Deleted video ID: $id");
                
                // Regenerate sitemap
                $this->sitemapService->generateSitemap();
                
                return $this->successResponse(['message' => 'Video deleted permanently (created < 24h)']);
            }

            // Soft delete + redirect placeholder
            $stmt = $this->conn->prepare("UPDATE videos SET deleted_at = NOW() WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $stmt->close();

            $urlOld = '/videos/' . $id;
            try {
                $existingRule = $this->redirectService->findByUrlOld($urlOld);
                if (!$existingRule) {
                    $this->redirectService->create($urlOld, '');
                }
            } catch (Exception $ex) {
                $this->conn->query("UPDATE videos SET deleted_at = NULL WHERE id = " . (int)$id);
                return $this->errorResponse('Redirect creation failed: ' . $ex->getMessage());
            }

            $this->logActivity($userId, 'archive', 'video', $id, "Archived video ID: $id and created redirect placeholder");
            
            // Regenerate sitemap
            $this->sitemapService->generateSitemap();
            
            return $this->successResponse([
                'message' => 'Video archived for SEO. A redirect entry was created with empty urlNew; please set the destination.'
            ]);
        } catch (Exception $e) {
            error_log("Error deleting video: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Reorder videos
     */
    public function reorder($orderItems, $userId) {
        if (empty($orderItems) || !is_array($orderItems)) {
            return $this->errorResponse('Invalid order data', 400);
        }

        $this->conn->begin_transaction();
        try {
            $stmt = $this->conn->prepare("UPDATE videos SET display_order = ? WHERE id = ?");
            foreach ($orderItems as $item) {
                $id = isset($item['id']) ? (int)$item['id'] : 0;
                $order = isset($item['display_order']) ? (int)$item['display_order'] : 0;
                if ($id <= 0) {
                    continue;
                }
                $stmt->bind_param('ii', $order, $id);
                $stmt->execute();
            }
            $this->conn->commit();
            $this->logActivity($userId, 'update', 'video', 0, 'Reordered videos');
            return $this->successResponse(['message' => 'Order updated']);
        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Error reordering videos: " . $e->getMessage());
            return $this->errorResponse('Failed to update order');
        }
    }

    /**
     * Calculate next display order
     */
    private function getNextDisplayOrder() {
        $result = $this->conn->query("SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM videos");
        $row = $result ? $result->fetch_assoc() : ['next_order' => 1];
        return (int)($row['next_order'] ?? 1);
    }

    /**
     * Param type helper
     */
    private function getParamType($field) {
        $intFields = ['property_id', 'display_order', 'is_home'];
        return in_array($field, $intFields) ? 'i' : 's';
    }

    /**
     * Format video payload
     */
    private function formatVideo($video) {
        return [
            'id' => (int)$video['id'],
            'property_id' => $video['property_id'] ?? null,
            'title' => $video['title'],
            'description' => $video['description'] ?? null,
            'video_url' => $video['video_url'],
            'video_type' => $video['video_type'] ?? 'vimeo',
            'thumbnail_url' => $video['thumbnail_url'],
            'display_order' => (int)$video['display_order'],
            'thumbnail_alt' => $video['thumbnail_alt'] ?? '',
            'is_home' => isset($video['is_home']) ? (bool)$video['is_home'] : false,
            'created_at' => $video['created_at'] ?? null,
            'updated_at' => $video['updated_at'] ?? null,
            'deleted_at' => $video['deleted_at'] ?? null,
        ];
    }

    /**
     * Log activity
     */
    private function logActivity($userId, $action, $entityType, $entityId, $description) {
        try {
            $query = "INSERT INTO activity_log (user_id, action, entity_type, entity_id, description) 
                      VALUES (?, ?, ?, ?, ?)";
            $this->db->executePrepared($query, [$userId, $action, $entityType, $entityId, $description], 'issis');
        } catch (Exception $e) {
            error_log("Failed to log activity: " . $e->getMessage());
        }
    }

    /**
     * Success response
     */
    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return ['success' => true, 'data' => $data];
    }

    /**
     * Error response
     */
    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }

    /**
     * Ensure required columns exist (compatibility with older schemas)
     */
    private function ensureSchema() {
        try {
            // created_by column
            $col2 = $this->conn->query("SHOW COLUMNS FROM videos LIKE 'created_by'");
            if ($col2 && $col2->num_rows > 0) {
                $this->hasCreatedBy = true;
            } else {
                $this->conn->query("ALTER TABLE videos ADD COLUMN created_by INT UNSIGNED NULL DEFAULT NULL");
                $this->hasCreatedBy = true;
            }

            // thumbnail_alt
            $col3 = $this->conn->query("SHOW COLUMNS FROM videos LIKE 'thumbnail_alt'");
            if (!$col3 || $col3->num_rows === 0) {
                $this->conn->query("ALTER TABLE videos ADD COLUMN thumbnail_alt VARCHAR(255) NOT NULL DEFAULT '' AFTER thumbnail_url");
            }

            // is_home
            $col4 = $this->conn->query("SHOW COLUMNS FROM videos LIKE 'is_home'");
            if (!$col4 || $col4->num_rows === 0) {
                $this->conn->query("ALTER TABLE videos ADD COLUMN is_home TINYINT(1) NOT NULL DEFAULT 0 AFTER display_order");
            }

            // deleted_at
            $col5 = $this->conn->query("SHOW COLUMNS FROM videos LIKE 'deleted_at'");
            if (!$col5 || $col5->num_rows === 0) {
                $this->conn->query("ALTER TABLE videos ADD COLUMN deleted_at DATETIME NULL AFTER updated_at");
            }
        } catch (Exception $e) {
            error_log('VideoController schema check failed: ' . $e->getMessage());
            // Proceed without breaking API; fall back to available columns
        }
    }
}
