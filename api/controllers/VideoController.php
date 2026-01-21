<?php

require_once __DIR__ . '/../config/database.php';

class VideoController {
    private $db;
    private $conn;
    private $hasIsActive = false;
    private $hasCreatedBy = false;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->ensureSchema();
    }

    /**
     * Get all videos with optional filters
     */
    public function getAll($filters = []) {
        try {
            $where = [];
            $params = [];
            $types = '';

            // Visibility filter
            if ($this->hasIsActive) {
                if (isset($filters['is_active']) && $filters['is_active'] !== 'all') {
                    $where[] = "is_active = ?";
                    $params[] = ($filters['is_active'] === 'true' || $filters['is_active'] === '1') ? 1 : 0;
                    $types .= 'i';
                } else {
                    // Default for public - only active
                    if (!isset($filters['is_active'])) {
                        $where[] = "is_active = 1";
                    }
                }
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

            $selectColumns = "id, property_id, title, description, video_url, video_type, thumbnail_url, display_order";
            if ($this->hasIsActive) {
                $selectColumns .= ", is_active";
            }
            $selectColumns .= ", created_at, updated_at";

            $query = "SELECT $selectColumns 
                      FROM videos 
                      WHERE $whereClause 
                      ORDER BY display_order ASC, created_at DESC 
                      LIMIT $perPage OFFSET $offset";

            $result = empty($params)
                ? $this->conn->query($query)
                : $this->db->executePrepared($query, $params, $types);

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

            // Count
            $countQuery = "SELECT COUNT(*) as total FROM videos WHERE $whereClause";
            $countResult = empty($params)
                ? $this->conn->query($countQuery)
                : $this->db->executePrepared($countQuery, $params, $types);
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
            $query = "SELECT * FROM videos WHERE id = ? LIMIT 1";
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

            $displayOrder = isset($data['display_order']) ? (int)$data['display_order'] : $this->getNextDisplayOrder();

            $columns = ['property_id', 'title', 'description', 'video_url', 'video_type', 'thumbnail_url', 'display_order'];
            $placeholders = ['?', '?', '?', '?', '?', '?', '?'];
            $params = [
                $data['property_id'] ?? null,
                $data['title'],
                $data['description'] ?? null,
                $data['video_url'],
                $data['video_type'] ?? 'vimeo',
                $data['thumbnail_url'],
                $displayOrder,
            ];
            $types = 'isssssi';

            if ($this->hasIsActive) {
                $columns[] = 'is_active';
                $placeholders[] = '?';
                $params[] = isset($data['is_active']) ? (int)$data['is_active'] : 1;
                $types .= 'i';
            }

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
            $check = $this->db->executePrepared("SELECT id FROM videos WHERE id = ? LIMIT 1", [$id], 'i');
            if (!$check || $check->num_rows === 0) {
                return $this->errorResponse('Video not found', 404);
            }

            $allowed = ['property_id', 'title', 'description', 'video_url', 'video_type', 'thumbnail_url', 'display_order'];
            if ($this->hasIsActive) {
                $allowed[] = 'is_active';
            }
            $updates = [];
            $params = [];
            $types = '';

            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    if ($field === 'video_url' && !empty($data[$field]) && strpos($data[$field], 'vimeo.com') === false) {
                        return $this->errorResponse('Video URL must be a Vimeo link', 400);
                    }
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
            $fetch = $this->db->executePrepared("SELECT thumbnail_url FROM videos WHERE id = ? LIMIT 1", [$id], 'i');
            $thumb = null;
            if ($fetch && $fetch->num_rows > 0) {
                $thumb = $fetch->fetch_assoc()['thumbnail_url'] ?? null;
            }

            $result = $this->db->executePrepared("DELETE FROM videos WHERE id = ?", [$id], 'i');
            if (!$result) {
                return $this->errorResponse('Failed to delete video');
            }

            if (!empty($thumb)) {
                require_once __DIR__ . '/UploadController.php';
                $uploader = new UploadController();
                $uploader->deleteFile($thumb);
            }

            $this->logActivity($userId, 'delete', 'video', $id, "Deleted video ID: $id");
            return $this->successResponse(['message' => 'Video deleted successfully']);
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
        $intFields = ['property_id', 'display_order', 'is_active'];
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
            'is_active' => $this->hasIsActive ? (bool)$video['is_active'] : true,
            'created_at' => $video['created_at'] ?? null,
            'updated_at' => $video['updated_at'] ?? null,
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
            // is_active column
            $col = $this->conn->query("SHOW COLUMNS FROM videos LIKE 'is_active'");
            if ($col && $col->num_rows > 0) {
                $this->hasIsActive = true;
            } else {
                $this->conn->query("ALTER TABLE videos ADD COLUMN is_active TINYINT(1) DEFAULT 1");
                $this->hasIsActive = true;
            }

            // created_by column
            $col2 = $this->conn->query("SHOW COLUMNS FROM videos LIKE 'created_by'");
            if ($col2 && $col2->num_rows > 0) {
                $this->hasCreatedBy = true;
            } else {
                $this->conn->query("ALTER TABLE videos ADD COLUMN created_by INT UNSIGNED NULL DEFAULT NULL");
                $this->hasCreatedBy = true;
            }
        } catch (Exception $e) {
            error_log('VideoController schema check failed: ' . $e->getMessage());
            // Proceed without breaking API; fall back to available columns
        }
    }
}
