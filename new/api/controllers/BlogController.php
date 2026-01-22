<?php

require_once __DIR__ . '/../config/database.php';

class BlogController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get all blogs with optional filters
     */
    public function getAll($filters = []) {
        try {
            $where = [];
            $params = [];
            $types = '';

            // Active filter - if not specified, show only active for public
            if (isset($filters['is_active'])) {
                if ($filters['is_active'] !== 'all') {
                    $where[] = "is_active = ?";
                    $params[] = $filters['is_active'] === 'true' || $filters['is_active'] === '1' ? 1 : 0;
                    $types .= 'i';
                }
            } else {
                // Default for public - only show active blogs
                $where[] = "is_active = 1";
            }

            // Search filter
            if (!empty($filters['q'])) {
                $where[] = "(title LIKE ? OR description LIKE ? OR content LIKE ?)";
                $searchTerm = '%' . $filters['q'] . '%';
                array_push($params, $searchTerm, $searchTerm, $searchTerm);
                $types .= 'sss';
            }

            // Build query
            $whereClause = empty($where) ? '1=1' : implode(' AND ', $where);
            $query = "SELECT id, title, slug, description, content, featured_image, content_image, is_active, 
                     display_order, published_date, created_at, updated_at 
                     FROM blogs 
                     WHERE $whereClause 
                     ORDER BY display_order ASC, published_date DESC, created_at DESC
                     LIMIT ? OFFSET ?";

            // Add pagination
            $page = isset($filters['page']) ? (int)$filters['page'] : 1;
            $perPage = isset($filters['per_page']) ? (int)$filters['per_page'] : 12;
            $offset = ($page - 1) * $perPage;
            
            // Add pagination to parameters
            $params[] = $perPage;
            $params[] = $offset;
            $types .= 'ii';

            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to fetch blogs');
            }

            $blogs = [];
            while ($row = $result->fetch_assoc()) {
                $blogs[] = $this->formatBlog($row);
            }

            // Get total count (without LIMIT/OFFSET)
            $countQuery = "SELECT COUNT(*) as total FROM blogs WHERE $whereClause";
            // Remove last 2 params (LIMIT/OFFSET) for count
            $countParams = array_slice($params, 0, -2);
            $countTypes = substr($types, 0, -2);
            $countResult = empty($countParams)
                ? $this->conn->query($countQuery)
                : $this->db->executePrepared($countQuery, $countParams, $countTypes);
            
            $total = $countResult->fetch_assoc()['total'];

            return $this->successResponse([
                'blogs' => $blogs,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => ceil($total / $perPage)
                ]
            ]);

        } catch (Exception $e) {
            error_log("Error fetching blogs: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get blog by ID
     */
    public function getById($id) {
        try {
            $query = "SELECT * FROM blogs WHERE id = ? LIMIT 1";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Blog not found', 404);
            }

            $blog = $result->fetch_assoc();
            return $this->successResponse($this->formatBlog($blog));

        } catch (Exception $e) {
            error_log("Error fetching blog: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get blog by slug
     */
    public function getBySlug($slug) {
        try {
            $query = "SELECT * FROM blogs WHERE slug = ? AND is_active = 1 LIMIT 1";
            $result = $this->db->executePrepared($query, [$slug], 's');

            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Blog not found', 404);
            }

            $blog = $result->fetch_assoc();
            return $this->successResponse($this->formatBlog($blog));

        } catch (Exception $e) {
            error_log("Error fetching blog: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Create new blog
     */
    public function create($data, $userId) {
        try {
            // Validate required fields
            if (empty($data['title'])) {
                return $this->errorResponse("Title is required", 400);
            }

            // Generate slug (allow custom)
            $slugSource = !empty($data['slug']) ? $data['slug'] : $data['title'];
            $slug = $this->generateSlug($slugSource);

            // Insert blog
            $query = "INSERT INTO blogs (title, slug, description, content, featured_image, content_image,
                     is_active, display_order, published_date, created_by) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $params = [
                $data['title'],
                $slug,
                $data['description'] ?? null,
                $data['content'] ?? null,
                $data['featured_image'] ?? null,
                $data['content_image'] ?? null,
                $data['is_active'] ?? 1,
                $data['display_order'] ?? 0,
                $data['published_date'] ?? date('Y-m-d'),
                $userId
            ];

            // Types: s=string, i=integer
            $types = 'ssssssiisi';

            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to create blog');
            }

            $blogId = $this->db->getLastInsertId();

            // Log activity
            $this->logActivity($userId, 'create', 'blog', $blogId, "Created blog: {$data['title']}");

            return $this->successResponse([
                'id' => $blogId,
                'slug' => $slug,
                'message' => 'Blog created successfully'
            ], 201);

        } catch (Exception $e) {
            error_log("Error creating blog: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Update blog
     */
    public function update($id, $data, $userId) {
        try {
            // Check if blog exists
            $checkQuery = "SELECT id FROM blogs WHERE id = ? LIMIT 1";
            $checkResult = $this->db->executePrepared($checkQuery, [$id], 'i');

            if (!$checkResult || $checkResult->num_rows === 0) {
                return $this->errorResponse('Blog not found', 404);
            }

            // Build update query
            $updates = [];
            $params = [];
            $types = '';

            $allowedFields = ['title', 'description', 'content', 'featured_image', 'content_image',
                            'is_active', 'display_order', 'published_date', 'slug'];

            foreach ($allowedFields as $field) {
                if (isset($data[$field]) && $field !== 'slug') { // Skip slug, gestito dopo
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                    $types .= $this->getParamType($field);
                }
            }

            if (empty($updates)) {
                return $this->errorResponse('No valid fields to update', 400);
            }

            // Regenerate slug if title changed or custom slug provided
            if (isset($data['title']) || isset($data['slug'])) {
                $slugSource = !empty($data['slug']) ? $data['slug'] : $data['title'];
                $slug = $this->generateSlug($slugSource, $id);
                $updates[] = "slug = ?";
                $params[] = $slug;
                $types .= 's';
            }

            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE blogs SET " . implode(', ', $updates) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to update blog');
            }

            // Log activity
            $this->logActivity($userId, 'update', 'blog', $id, "Updated blog: {$data['title']}");

            return $this->successResponse(['message' => 'Blog updated successfully']);

        } catch (Exception $e) {
            error_log("Error updating blog: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Delete blog
     */
    public function delete($id, $userId) {
        try {
            // Fetch blog to know related assets
            $fetch = $this->db->executePrepared("SELECT featured_image FROM blogs WHERE id = ? LIMIT 1", [$id], 'i');
            $featured = null;
            if ($fetch && $fetch->num_rows > 0) {
                $featured = $fetch->fetch_assoc()['featured_image'] ?? null;
            }

            $query = "DELETE FROM blogs WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result) {
                return $this->errorResponse('Failed to delete blog');
            }

            // Delete featured image and variants if present
            if (!empty($featured)) {
                require_once __DIR__ . '/UploadController.php';
                $uploader = new UploadController();
                $uploader->deleteFile($featured);
            }

            // Log activity
            $this->logActivity($userId, 'delete', 'blog', $id, "Deleted blog ID: $id");

            return $this->successResponse(['message' => 'Blog deleted successfully']);

        } catch (Exception $e) {
            error_log("Error deleting blog: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Bulk reorder blogs
     */
    public function reorder($orderItems, $userId) {
        if (empty($orderItems) || !is_array($orderItems)) {
            return $this->errorResponse('Invalid order data', 400);
        }

        $this->conn->begin_transaction();
        try {
            $stmt = $this->conn->prepare("UPDATE blogs SET display_order = ? WHERE id = ?");

            foreach ($orderItems as $item) {
                $id = isset($item['id']) ? (int)$item['id'] : 0;
                $pos = isset($item['display_order']) ? (int)$item['display_order'] : 0;
                if ($id <= 0) {
                    continue;
                }
                $stmt->bind_param('ii', $pos, $id);
                $stmt->execute();
            }

            $this->conn->commit();
            $this->logActivity($userId, 'update', 'blog', 0, 'Reordered blogs');
            return $this->successResponse(['message' => 'Order updated']);
        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("Error reordering blogs: " . $e->getMessage());
            return $this->errorResponse('Failed to update order');
        }
    }

    /**
     * Generate unique slug
     */
    private function generateSlug($title, $excludeId = null) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title)));
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');

        $query = "SELECT COUNT(*) as count FROM blogs WHERE slug = ?";
        $params = [$slug];
        $types = 's';

        if ($excludeId) {
            $query .= " AND id != ?";
            $params[] = $excludeId;
            $types .= 'i';
        }

        $result = $this->db->executePrepared($query, $params, $types);
        $count = $result->fetch_assoc()['count'];

        if ($count > 0) {
            $slug .= '-' . time();
        }

        return $slug;
    }

    /**
     * Get parameter type for bind_param
     */
    private function getParamType($field) {
        $intFields = ['is_active', 'display_order'];
        return in_array($field, $intFields) ? 'i' : 's';
    }

    /**
     * Format blog data
     */
    private function formatBlog($blog) {
        return [
            'id' => $blog['id'],
            'title' => $blog['title'],
            'slug' => $blog['slug'],
            'description' => $blog['description'],
            'content' => $blog['content'] ?? null,
            'featured_image' => $blog['featured_image'],
            'content_image' => $blog['content_image'] ?? null,
            'is_active' => (bool)$blog['is_active'],
            'display_order' => (int)$blog['display_order'],
            'published_date' => $blog['published_date'],
            'created_at' => $blog['created_at'],
            'updated_at' => $blog['updated_at']
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
}
