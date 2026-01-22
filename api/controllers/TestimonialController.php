<?php

require_once __DIR__ . '/../config/database.php';

class TestimonialController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->ensureSchema();
    }

    /**
    * List testimonials (public by default)
    */
    public function getAll($filters = []) {
        try {
            $where = [];
            $params = [];
            $types = '';

            // Active filter - public defaults to active only
            if (isset($filters['is_active'])) {
                if ($filters['is_active'] !== 'all') {
                    $where[] = "is_active = ?";
                    $params[] = ($filters['is_active'] === 'true' || $filters['is_active'] === '1') ? 1 : 0;
                    $types .= 'i';
                }
            } else {
                $where[] = "is_active = 1";
            }

            // Search by author or content
            if (!empty($filters['q'])) {
                $where[] = "(author LIKE ? OR content LIKE ?)";
                $term = '%' . $filters['q'] . '%';
                array_push($params, $term, $term);
                $types .= 'ss';
            }

            $whereClause = empty($where) ? '1=1' : implode(' AND ', $where);

            // Pagination
            $page = isset($filters['page']) ? max(1, (int)$filters['page']) : 1;
            $perPage = isset($filters['per_page']) ? max(1, (int)$filters['per_page']) : 50;
            $limit = isset($filters['limit']) ? max(1, (int)$filters['limit']) : null;
            if ($limit) {
                $perPage = $limit;
                $page = 1;
            }
            $offset = ($page - 1) * $perPage;

            $query = "SELECT id, author, content, testimonial_date, display_order, is_active, created_at, updated_at
                      FROM testimonials
                      WHERE $whereClause
                      ORDER BY display_order ASC, testimonial_date DESC, created_at DESC
                      LIMIT $perPage OFFSET $offset";

            $result = empty($params)
                ? $this->conn->query($query)
                : $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to fetch testimonials');
            }

            $items = [];
            while ($row = $result->fetch_assoc()) {
                $items[] = $this->formatTestimonial($row);
            }

            if ($limit) {
                return $this->successResponse([
                    'testimonials' => $items,
                    'pagination' => [
                        'total' => count($items),
                        'page' => 1,
                        'per_page' => $perPage,
                        'total_pages' => 1,
                    ],
                ]);
            }

            $countQuery = "SELECT COUNT(*) as total FROM testimonials WHERE $whereClause";
            $countResult = empty($params)
                ? $this->conn->query($countQuery)
                : $this->db->executePrepared($countQuery, $params, $types);
            $total = $countResult->fetch_assoc()['total'] ?? 0;

            return $this->successResponse([
                'testimonials' => $items,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => $perPage > 0 ? ceil($total / $perPage) : 1,
                ],
            ]);
        } catch (Exception $e) {
            error_log("Error fetching testimonials: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
    * Get a single testimonial
    */
    public function getById($id) {
        try {
            $result = $this->db->executePrepared(
                "SELECT * FROM testimonials WHERE id = ? LIMIT 1",
                [$id],
                'i'
            );

            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Testimonial not found', 404);
            }

            return $this->successResponse($this->formatTestimonial($result->fetch_assoc()));
        } catch (Exception $e) {
            error_log("Error fetching testimonial: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
    * Create testimonial
    */
    public function create($data, $userId) {
        try {
            if (empty($data['author'])) {
                return $this->errorResponse('Author is required', 400);
            }
            if (empty($data['content'])) {
                return $this->errorResponse('Content is required', 400);
            }

            $displayOrder = isset($data['display_order'])
                ? (int)$data['display_order']
                : $this->getNextDisplayOrder();

            $query = "INSERT INTO testimonials (author, content, testimonial_date, display_order, is_active, created_by)
                      VALUES (?, ?, ?, ?, ?, ?)";

            $params = [
                $data['author'],
                $data['content'],
                $data['testimonial_date'] ?? null,
                $displayOrder,
                isset($data['is_active']) ? (int)$data['is_active'] : 1,
                $userId,
            ];

            $result = $this->db->executePrepared($query, $params, 'sssiii');
            if (!$result) {
                return $this->errorResponse('Failed to create testimonial');
            }

            $id = $this->db->getLastInsertId();
            $this->logActivity($userId, 'create', 'testimonial', $id, "Created testimonial from {$data['author']}");

            return $this->successResponse([
                'id' => $id,
                'message' => 'Testimonial created successfully',
            ], 201);
        } catch (Exception $e) {
            error_log("Error creating testimonial: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
    * Update testimonial
    */
    public function update($id, $data, $userId) {
        try {
            $exists = $this->db->executePrepared("SELECT id FROM testimonials WHERE id = ? LIMIT 1", [$id], 'i');
            if (!$exists || $exists->num_rows === 0) {
                return $this->errorResponse('Testimonial not found', 404);
            }

            $fields = [];
            $params = [];
            $types = '';

            $allowed = ['author', 'content', 'testimonial_date', 'display_order', 'is_active'];
            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                    $types .= $this->getParamType($field);
                }
            }

            if (empty($fields)) {
                return $this->errorResponse('No data provided for update', 400);
            }

            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE testimonials SET " . implode(', ', $fields) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to update testimonial');
            }

            $this->logActivity($userId, 'update', 'testimonial', $id, "Updated testimonial #{$id}");

            return $this->successResponse(['message' => 'Testimonial updated successfully']);
        } catch (Exception $e) {
            error_log("Error updating testimonial: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
    * Delete testimonial
    */
    public function delete($id, $userId) {
        try {
            $result = $this->db->executePrepared("DELETE FROM testimonials WHERE id = ?", [$id], 'i');
            if (!$result) {
                return $this->errorResponse('Failed to delete testimonial');
            }

            $this->logActivity($userId, 'delete', 'testimonial', $id, "Deleted testimonial #{$id}");

            return $this->successResponse(['message' => 'Testimonial deleted successfully']);
        } catch (Exception $e) {
            error_log("Error deleting testimonial: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
    * Reorder testimonials
    */
    public function reorder($orders = [], $userId = null) {
        if (empty($orders) || !is_array($orders)) {
            return $this->errorResponse('Invalid order payload', 400);
        }

        try {
            foreach ($orders as $item) {
                if (!isset($item['id'], $item['display_order'])) {
                    continue;
                }
                $this->db->executePrepared(
                    "UPDATE testimonials SET display_order = ? WHERE id = ?",
                    [(int)$item['display_order'], (int)$item['id']],
                    'ii'
                );
            }

            if ($userId) {
                $this->logActivity($userId, 'reorder', 'testimonial', null, 'Reordered testimonials');
            }

            return $this->successResponse(['message' => 'Display order updated']);
        } catch (Exception $e) {
            error_log("Error reordering testimonials: " . $e->getMessage());
            return $this->errorResponse('Failed to update order');
        }
    }

    /**
    * Ensure testimonials table exists
    */
    private function ensureSchema() {
        $sql = "CREATE TABLE IF NOT EXISTS `testimonials` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `author` VARCHAR(255) NOT NULL,
            `content` TEXT NOT NULL,
            `testimonial_date` DATE NULL,
            `display_order` INT DEFAULT 0,
            `is_active` TINYINT(1) DEFAULT 1,
            `created_by` INT UNSIGNED NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            INDEX `idx_display_order` (`display_order`),
            INDEX `idx_is_active` (`is_active`),
            INDEX `idx_testimonial_date` (`testimonial_date`),
            FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        $this->conn->query($sql);
    }

    private function getNextDisplayOrder() {
        $result = $this->conn->query("SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM testimonials");
        if ($result) {
            $row = $result->fetch_assoc();
            return (int)$row['next_order'];
        }
        return 1;
    }

    private function formatTestimonial($row) {
        return [
            'id' => (int)$row['id'],
            'author' => $row['author'],
            'content' => $row['content'],
            'testimonial_date' => $row['testimonial_date'],
            'display_order' => isset($row['display_order']) ? (int)$row['display_order'] : 0,
            'is_active' => isset($row['is_active']) ? (bool)$row['is_active'] : true,
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }

    private function getParamType($field) {
        switch ($field) {
            case 'display_order':
            case 'is_active':
                return 'i';
            default:
                return 's';
        }
    }

    private function logActivity($userId, $action, $entityType, $entityId, $description) {
        $query = "INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, ip_address) 
                  VALUES (?, ?, ?, ?, ?, ?)";
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $this->db->executePrepared($query, [
            $userId,
            $action,
            $entityType,
            $entityId,
            $description,
            $ip
        ], 'ississ');
    }

    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return [
            'success' => true,
            'data' => $data
        ];
    }

    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return [
            'success' => false,
            'error' => $message
        ];
    }
}
