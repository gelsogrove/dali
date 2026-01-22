<?php

require_once __DIR__ . '/../config/database.php';

class PropertyController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get all properties with optional filters
     * @param array $filters Filter parameters
     * @return array
     */
    public function getAll($filters = []) {
        try {
            $where = [];
            $params = [];
            $types = '';

            // Status filter - if not specified and not admin context, default to active
            // Admin can pass 'all' to see all properties, or specific status
            if (isset($filters['status'])) {
                if ($filters['status'] !== 'all') {
                    $where[] = "status = ?";
                    $params[] = $filters['status'];
                    $types .= 's';
                }
            } else {
                // Default for public frontend - only show active properties
                $where[] = "status = 'active'";
            }

            // Apply filters
            if (!empty($filters['city'])) {
                $where[] = "city = ?";
                $params[] = $filters['city'];
                $types .= 's';
            }

            if (!empty($filters['min_price'])) {
                $where[] = "price >= ?";
                $params[] = $filters['min_price'];
                $types .= 'd';
            }

            if (!empty($filters['max_price'])) {
                $where[] = "price <= ?";
                $params[] = $filters['max_price'];
                $types .= 'd';
            }

            if (!empty($filters['bedrooms'])) {
                $where[] = "bedrooms >= ?";
                $params[] = $filters['bedrooms'];
                $types .= 'i';
            }

            if (!empty($filters['property_type'])) {
                $where[] = "property_type = ?";
                $params[] = $filters['property_type'];
                $types .= 's';
            }

            if (isset($filters['featured']) && $filters['featured'] === '1') {
                $where[] = "featured = 1";
            }

            // Build query
            $whereClause = empty($where) ? '1=1' : implode(' AND ', $where);
            $query = "SELECT id, title, slug, description, price, bedrooms, bathrooms, square_feet, 
                     property_type, status, address, city, state, zip_code, featured, featured_image,
                     created_at, updated_at 
                     FROM properties 
                     WHERE $whereClause 
                     ORDER BY featured DESC, created_at DESC
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
                return $this->errorResponse('Failed to fetch properties');
            }

            $properties = [];
            while ($row = $result->fetch_assoc()) {
                $properties[] = $this->formatProperty($row);
            }

            // Get total count (without LIMIT/OFFSET)
            $countQuery = "SELECT COUNT(*) as total FROM properties WHERE $whereClause";
            // Remove last 2 params (LIMIT/OFFSET) for count
            $countParams = array_slice($params, 0, -2);
            $countTypes = substr($types, 0, -2);
            $countResult = empty($countParams)
                ? $this->conn->query($countQuery)
                : $this->db->executePrepared($countQuery, $countParams, $countTypes);
            
            $total = $countResult->fetch_assoc()['total'];

            return $this->successResponse([
                'properties' => $properties,
                'pagination' => [
                    'total' => (int)$total,
                    'page' => $page,
                    'per_page' => $perPage,
                    'total_pages' => ceil($total / $perPage)
                ]
            ]);

        } catch (Exception $e) {
            error_log("Error fetching properties: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get property by ID
     * @param int $id Property ID
     * @return array
     */
    public function getById($id) {
        try {
            $query = "SELECT * FROM properties WHERE id = ? AND status = 'active' LIMIT 1";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Property not found', 404);
            }

            $property = $result->fetch_assoc();

            // Get photos
            $photosQuery = "SELECT id, image_url, thumbnail_url, medium_url, caption, alt_text, display_order 
                           FROM photogallery 
                           WHERE property_id = ? 
                           ORDER BY display_order ASC, id ASC";
            $photosResult = $this->db->executePrepared($photosQuery, [$id], 'i');
            $photos = [];
            while ($row = $photosResult->fetch_assoc()) {
                $photos[] = $row;
            }

            // Get videos
            $videosQuery = "SELECT id, title, description, video_url, video_type, thumbnail_url, display_order 
                           FROM videos 
                           WHERE property_id = ? AND deleted_at IS NULL
                           ORDER BY display_order ASC, id ASC";
            $videosResult = $this->db->executePrepared($videosQuery, [$id], 'i');
            $videos = [];
            while ($row = $videosResult->fetch_assoc()) {
                $videos[] = $row;
            }

            // Get amenities
            $amenitiesQuery = "SELECT amenity_name, amenity_value, category 
                              FROM property_amenities 
                              WHERE property_id = ? 
                              ORDER BY category, amenity_name";
            $amenitiesResult = $this->db->executePrepared($amenitiesQuery, [$id], 'i');
            $amenities = [];
            while ($row = $amenitiesResult->fetch_assoc()) {
                $amenities[] = $row;
            }

            $property['photos'] = $photos;
            $property['videos'] = $videos;
            $property['amenities'] = $amenities;

            return $this->successResponse($this->formatProperty($property));

        } catch (Exception $e) {
            error_log("Error fetching property: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Create new property
     * @param array $data Property data
     * @param int $userId User ID
     * @return array
     */
    public function create($data, $userId) {
        try {
            // Validate required fields
            $required = ['title', 'price'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    return $this->errorResponse("$field is required", 400);
                }
            }

            // Generate slug
            $slug = $this->generateSlug($data['title']);

            // Insert property
            $query = "INSERT INTO properties (title, slug, description, price, bedrooms, bathrooms, 
                     square_feet, lot_size, year_built, property_type, status, address, city, state, 
                     zip_code, latitude, longitude, featured, featured_image, mls_number, created_by) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $params = [
                $data['title'],
                $slug,
                $data['description'] ?? null,
                $data['price'],
                $data['bedrooms'] ?? null,
                $data['bathrooms'] ?? null,
                $data['square_feet'] ?? null,
                $data['lot_size'] ?? null,
                $data['year_built'] ?? null,
                $data['property_type'] ?? null,
                $data['status'] ?? 'draft',
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['state'] ?? null,
                $data['zip_code'] ?? null,
                $data['latitude'] ?? null,
                $data['longitude'] ?? null,
                $data['featured'] ?? 0,
                $data['featured_image'] ?? null,
                $data['mls_number'] ?? null,
                $userId
            ];

            // Types: s=string, i=integer, d=decimal
            // title, slug, description, price(decimal), bedrooms(int), bathrooms(decimal), square_feet(int),
            // lot_size, year_built(int), property_type, status, address, city, state, zip_code,
            // latitude(decimal), longitude(decimal), featured(int), featured_image, mls_number, created_by(int)
            $types = 'sssdiidisisssssddissi';

            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to create property');
            }

            $propertyId = $this->db->getLastInsertId();

            // Log activity
            $this->logActivity($userId, 'create', 'property', $propertyId, "Created property: {$data['title']}");

            return $this->successResponse([
                'id' => $propertyId,
                'slug' => $slug,
                'message' => 'Property created successfully'
            ], 201);

        } catch (Exception $e) {
            error_log("Error creating property: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Update property
     * @param int $id Property ID
     * @param array $data Property data
     * @param int $userId User ID
     * @return array
     */
    public function update($id, $data, $userId) {
        try {
            // Check if property exists
            $checkQuery = "SELECT id FROM properties WHERE id = ? LIMIT 1";
            $checkResult = $this->db->executePrepared($checkQuery, [$id], 'i');

            if (!$checkResult || $checkResult->num_rows === 0) {
                return $this->errorResponse('Property not found', 404);
            }

            // Build update query
            $updates = [];
            $params = [];
            $types = '';

            $allowedFields = ['title', 'description', 'price', 'bedrooms', 'bathrooms', 'square_feet',
                            'lot_size', 'year_built', 'property_type', 'status', 'address', 'city', 
                            'state', 'zip_code', 'latitude', 'longitude', 'featured', 'featured_image', 'mls_number'];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                    $types .= $this->getParamType($field);
                }
            }

            if (empty($updates)) {
                return $this->errorResponse('No valid fields to update', 400);
            }

            // Regenerate slug if title changed
            if (isset($data['title'])) {
                $slug = $this->generateSlug($data['title'], $id);
                $updates[] = "slug = ?";
                $params[] = $slug;
                $types .= 's';
            }

            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE properties SET " . implode(', ', $updates) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to update property');
            }

            // Log activity
            $this->logActivity($userId, 'update', 'property', $id, "Updated property ID: $id");

            return $this->successResponse(['message' => 'Property updated successfully']);

        } catch (Exception $e) {
            error_log("Error updating property: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Delete property
     * @param int $id Property ID
     * @param int $userId User ID
     * @return array
     */
    public function delete($id, $userId) {
        try {
            // Check if property exists
            $checkQuery = "SELECT id, title FROM properties WHERE id = ? LIMIT 1";
            $checkResult = $this->db->executePrepared($checkQuery, [$id], 'i');

            if (!$checkResult || $checkResult->num_rows === 0) {
                return $this->errorResponse('Property not found', 404);
            }

            $property = $checkResult->fetch_assoc();

            // Delete property (cascade will handle related records)
            $query = "DELETE FROM properties WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result) {
                return $this->errorResponse('Failed to delete property');
            }

            // Log activity
            $this->logActivity($userId, 'delete', 'property', $id, "Deleted property: {$property['title']}");

            return $this->successResponse(['message' => 'Property deleted successfully']);

        } catch (Exception $e) {
            error_log("Error deleting property: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Generate unique slug
     * @param string $title Property title
     * @param int $excludeId Property ID to exclude
     * @return string
     */
    private function generateSlug($title, $excludeId = null) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $title), '-'));
        
        // Check if slug exists
        $query = "SELECT id FROM properties WHERE slug = ?" . ($excludeId ? " AND id != ?" : "");
        $params = $excludeId ? [$slug, $excludeId] : [$slug];
        $types = $excludeId ? 'si' : 's';
        
        $result = $this->db->executePrepared($query, $params, $types);

        if ($result && $result->num_rows > 0) {
            $slug .= '-' . time();
        }

        return $slug;
    }

    /**
     * Format property data
     * @param array $property Property data
     * @return array
     */
    private function formatProperty($property) {
        $property['price'] = (float)$property['price'];
        $property['bedrooms'] = isset($property['bedrooms']) ? (int)$property['bedrooms'] : null;
        $property['bathrooms'] = isset($property['bathrooms']) ? (float)$property['bathrooms'] : null;
        $property['square_feet'] = isset($property['square_feet']) ? (int)$property['square_feet'] : null;
        $property['featured'] = (bool)$property['featured'];
        
        return $property;
    }

    /**
     * Get parameter type for prepared statement
     * @param string $field Field name
     * @return string
     */
    private function getParamType($field) {
        $intFields = ['bedrooms', 'square_feet', 'year_built', 'featured'];
        $doubleFields = ['price', 'bathrooms', 'latitude', 'longitude'];
        
        if (in_array($field, $intFields)) return 'i';
        if (in_array($field, $doubleFields)) return 'd';
        return 's';
    }

    /**
     * Log activity
     */
    private function logActivity($userId, $action, $entityType, $entityId, $description) {
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $query = "INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, ip_address) 
                 VALUES (?, ?, ?, ?, ?, ?)";
        $this->db->executePrepared($query, [$userId, $action, $entityType, $entityId, $description, $ipAddress], 'ississ');
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
