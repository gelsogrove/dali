<?php

require_once __DIR__ . '/../../config/database.php';

class PhotoGalleryController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get all photos for a property
     */
    public function getByPropertyId($propertyId) {
        try {
            $query = "SELECT * FROM photogallery WHERE property_id = ? ORDER BY display_order ASC, id ASC";
            $result = $this->db->executePrepared($query, [$propertyId], 'i');

            if (!$result) {
                return $this->errorResponse('Failed to fetch photos');
            }

            $photos = [];
            while ($row = $result->fetch_assoc()) {
                $photos[] = $this->formatPhoto($row);
            }

            return $this->successResponse(['photos' => $photos]);

        } catch (Exception $e) {
            error_log("Error fetching photos: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Get single photo by ID
     */
    public function getById($id) {
        try {
            $query = "SELECT * FROM photogallery WHERE id = ? LIMIT 1";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Photo not found', 404);
            }

            $photo = $result->fetch_assoc();
            return $this->successResponse($this->formatPhoto($photo));

        } catch (Exception $e) {
            error_log("Error fetching photo: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Create new photo
     */
    public function create($data) {
        try {
            // Validate required fields
            if (empty($data['property_id']) || empty($data['image_url'])) {
                return $this->errorResponse("property_id and image_url are required", 400);
            }

            // Insert photo
            $query = "INSERT INTO photogallery (property_id, image_url, thumbnail_url, medium_url, 
                     caption, alt_text, display_order, is_featured, file_size, width, height) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $params = [
                $data['property_id'],
                $data['image_url'],
                $data['thumbnail_url'] ?? null,
                $data['medium_url'] ?? null,
                $data['caption'] ?? null,
                $data['alt_text'] ?? null,
                $data['display_order'] ?? 0,
                $data['is_featured'] ?? 0,
                $data['file_size'] ?? null,
                $data['width'] ?? null,
                $data['height'] ?? null
            ];

            $types = 'isssssiiii';

            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to create photo');
            }

            $photoId = $this->db->getLastInsertId();

            return $this->successResponse([
                'id' => $photoId,
                'message' => 'Photo created successfully'
            ], 201);

        } catch (Exception $e) {
            error_log("Error creating photo: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Update photo
     */
    public function update($id, $data) {
        try {
            // Check if photo exists
            $checkQuery = "SELECT id FROM photogallery WHERE id = ? LIMIT 1";
            $checkResult = $this->db->executePrepared($checkQuery, [$id], 'i');

            if (!$checkResult || $checkResult->num_rows === 0) {
                return $this->errorResponse('Photo not found', 404);
            }

            // Build update query
            $updates = [];
            $params = [];
            $types = '';

            $allowedFields = ['caption', 'alt_text', 'display_order', 'is_featured'];

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

            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE photogallery SET " . implode(', ', $updates) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to update photo');
            }

            return $this->successResponse(['message' => 'Photo updated successfully']);

        } catch (Exception $e) {
            error_log("Error updating photo: " . $e->getMessage());
            return $this->errorResponse('An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Delete photo
     */
    public function delete($id) {
        try {
            // Get photo info before deleting
            $query = "SELECT image_url, thumbnail_url, medium_url FROM photogallery WHERE id = ? LIMIT 1";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result || $result->num_rows === 0) {
                return $this->errorResponse('Photo not found', 404);
            }

            $photo = $result->fetch_assoc();

            // Delete from database
            $deleteQuery = "DELETE FROM photogallery WHERE id = ?";
            $deleteResult = $this->db->executePrepared($deleteQuery, [$id], 'i');

            if (!$deleteResult) {
                return $this->errorResponse('Failed to delete photo');
            }

            // Try to delete physical files
            $this->deletePhysicalFile($photo['image_url']);
            $this->deletePhysicalFile($photo['thumbnail_url']);
            $this->deletePhysicalFile($photo['medium_url']);

            return $this->successResponse(['message' => 'Photo deleted successfully']);

        } catch (Exception $e) {
            error_log("Error deleting photo: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Bulk update display order
     */
    public function updateOrder($orders) {
        try {
            foreach ($orders as $order) {
                if (!isset($order['id']) || !isset($order['display_order'])) {
                    continue;
                }

                $query = "UPDATE photogallery SET display_order = ? WHERE id = ?";
                $this->db->executePrepared($query, [$order['display_order'], $order['id']], 'ii');
            }

            return $this->successResponse(['message' => 'Order updated successfully']);

        } catch (Exception $e) {
            error_log("Error updating order: " . $e->getMessage());
            return $this->errorResponse('An error occurred');
        }
    }

    /**
     * Delete physical file
     */
    private function deletePhysicalFile($url) {
        if (!$url) return;

        $path = $_SERVER['DOCUMENT_ROOT'] . '/../' . ltrim($url, '/');
        if (file_exists($path)) {
            @unlink($path);
        }
    }

    /**
     * Get parameter type for bind_param
     */
    private function getParamType($field) {
        $intFields = ['display_order', 'is_featured'];
        return in_array($field, $intFields) ? 'i' : 's';
    }

    /**
     * Format photo data
     */
    private function formatPhoto($photo) {
        return [
            'id' => $photo['id'],
            'property_id' => $photo['property_id'],
            'image_url' => $photo['image_url'],
            'thumbnail_url' => $photo['thumbnail_url'],
            'medium_url' => $photo['medium_url'],
            'caption' => $photo['caption'],
            'alt_text' => $photo['alt_text'],
            'display_order' => (int)$photo['display_order'],
            'is_featured' => (bool)$photo['is_featured'],
            'file_size' => $photo['file_size'] ? (int)$photo['file_size'] : null,
            'width' => $photo['width'] ? (int)$photo['width'] : null,
            'height' => $photo['height'] ? (int)$photo['height'] : null,
            'uploaded_at' => $photo['uploaded_at']
        ];
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
