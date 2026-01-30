<?php

$__baseDir = rtrim(__DIR__, "/\\ \t\n\r\0\x0B");
require_once $__baseDir . '/../config/database.php';

class PropertyPhotoController {
    private $db;
    private $conn;
    private $uploadDir;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/uploads';
    }

    /**
     * Get all photos for a specific property
     * @param int $propertyId Property ID
     * @return array
     */
    public function getByPropertyId($propertyId) {
        try {
            $query = "SELECT id, property_id, filename, filepath, url, alt_text, is_cover, `order`, 
                      created_at
                      FROM property_photos 
                      WHERE property_id = ? 
                      ORDER BY is_cover DESC, `order` ASC, created_at ASC";
            
            $result = $this->db->executePrepared($query, [$propertyId], 'i');
            
            if ($result === false) {
                return $this->errorResponse('Failed to fetch property photos');
            }

            $photos = [];
            while ($row = $result->fetch_assoc()) {
                $photos[] = [
                    'id' => (int)$row['id'],
                    'property_id' => (int)$row['property_id'],
                    'filename' => $row['filename'],
                    'filepath' => $row['filepath'],
                    'url' => $row['url'],
                    'alt_text' => $row['alt_text'],
                    'is_cover' => (bool)$row['is_cover'],
                    'order' => (int)$row['order'],
                    'created_at' => $row['created_at']
                ];
            }

            return $this->successResponse($photos);
        } catch (Exception $e) {
            error_log("PropertyPhotoController::getByPropertyId() error: " . $e->getMessage());
            return $this->errorResponse('An error occurred while fetching photos');
        }
    }

    /**
     * Get a single photo by ID
     * @param int $id Photo ID
     * @return array
     */
    public function getById($id) {
        try {
            $query = "SELECT id, property_id, filename, filepath, url, alt_text, is_cover, `order`, 
                      created_at
                      FROM property_photos 
                      WHERE id = ?";
            
            $result = $this->db->executePrepared($query, [$id], 'i');
            
            if ($result === false || $result->num_rows === 0) {
                return $this->errorResponse('Photo not found', 404);
            }

            $row = $result->fetch_assoc();
            $photo = [
                'id' => (int)$row['id'],
                'property_id' => (int)$row['property_id'],
                'filename' => $row['filename'],
                'filepath' => $row['filepath'],
                'url' => $row['url'],
                'alt_text' => $row['alt_text'],
                'is_cover' => (bool)$row['is_cover'],
                'order' => (int)$row['order'],
                'created_at' => $row['created_at']
            ];

            return $this->successResponse($photo);
        } catch (Exception $e) {
            error_log("PropertyPhotoController::getById() error: " . $e->getMessage());
            return $this->errorResponse('An error occurred while fetching photo');
        }
    }

    /**
     * Create a new property photo
     * @param array $data Photo data
     * @return array
     */
    public function create($data) {
        try {
            // Validate required fields
            $validation = $this->validatePhotoData($data);
            if (!$validation['success']) {
                return $validation;
            }

            // Check if property exists
            $propertyCheck = $this->db->executePrepared(
                "SELECT id FROM properties WHERE id = ?",
                [$data['property_id']],
                'i'
            );

            if ($propertyCheck === false || $propertyCheck->num_rows === 0) {
                return $this->errorResponse('Property not found', 404);
            }

            // If this is marked as cover, remove cover from other photos
            if (!empty($data['is_cover'])) {
                $this->removeCoverStatus($data['property_id']);
            }

            // Get next order
            $orderQuery = "SELECT MAX(`order`) as max_order FROM property_photos WHERE property_id = ?";
            $orderResult = $this->db->executePrepared($orderQuery, [$data['property_id']], 'i');
            $maxOrder = 0;
            if ($orderResult && $row = $orderResult->fetch_assoc()) {
                $maxOrder = (int)($row['max_order'] ?? 0);
            }
            $order = $maxOrder + 1;

            // Insert photo
            $query = "INSERT INTO property_photos 
                      (property_id, filename, filepath, url, alt_text, is_cover, `order`) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)";
            
            $params = [
                $data['property_id'],
                $data['filename'] ?? basename($data['url']),
                $data['filepath'] ?? $data['url'],
                $data['url'],
                $data['alt_text'] ?? '',
                !empty($data['is_cover']) ? 1 : 0,
                $order
            ];

            $result = $this->db->executePrepared($query, $params, 'issssis');

            if ($result === false) {
                return $this->errorResponse('Failed to create photo');
            }

            $photoId = $this->conn->insert_id;

            // Return created photo
            return $this->getById($photoId);

        } catch (Exception $e) {
            error_log("PropertyPhotoController::create() error: " . $e->getMessage());
            return $this->errorResponse('PHOTO_ERROR: ' . $e->getMessage() . ' | Line: ' . $e->getLine());
        }
    }

    /**
     * Update an existing photo
     * @param int $id Photo ID
     * @param array $data Updated data
     * @return array
     */
    public function update($id, $data) {
        try {
            // Check if photo exists
            $checkQuery = "SELECT id, property_id FROM property_photos WHERE id = ?";
            $checkResult = $this->db->executePrepared($checkQuery, [$id], 'i');

            if ($checkResult === false || $checkResult->num_rows === 0) {
                return $this->errorResponse('Photo not found', 404);
            }

            $photo = $checkResult->fetch_assoc();

            // If marking as cover, remove cover from other photos
            if (isset($data['is_cover']) && $data['is_cover']) {
                $this->removeCoverStatus($photo['property_id']);
            }

            // Build update query dynamically
            $updateFields = [];
            $params = [];
            $types = '';

            if (isset($data['url'])) {
                $updateFields[] = "url = ?";
                $params[] = $data['url'];
                $types .= 's';
            }

            if (isset($data['alt_text'])) {
                $updateFields[] = "alt_text = ?";
                $params[] = $data['alt_text'];
                $types .= 's';
            }

            if (isset($data['is_cover'])) {
                $updateFields[] = "is_cover = ?";
                $params[] = $data['is_cover'] ? 1 : 0;
                $types .= 'i';
            }

            if (isset($data['order'])) {
                $updateFields[] = "`order` = ?";
                $params[] = (int)$data['order'];
                $types .= 'i';
            }

            if (empty($updateFields)) {
                return $this->errorResponse('No fields to update');
            }

            // Add photo ID to params
            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE property_photos SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);

            if ($result === false) {
                return $this->errorResponse('Failed to update photo');
            }

            return $this->getById($id);

        } catch (Exception $e) {
            error_log("PropertyPhotoController::update() error: " . $e->getMessage());
            return $this->errorResponse('An error occurred while updating photo');
        }
    }

    /**
     * Delete a photo
     * @param int $id Photo ID
     * @return array
     */
    public function delete($id) {
        try {
            // Get photo details before deleting
            $photo = $this->getById($id);
            
            if (!$photo['success']) {
                return $photo;
            }

            $photoData = $photo['data'];

            // Delete from database
            $query = "DELETE FROM property_photos WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if ($result === false) {
                return $this->errorResponse('Failed to delete photo');
            }

            // Try to delete physical files
            $this->deletePhotoFiles($photoData['url']);

            return $this->successResponse([
                'message' => 'Photo deleted successfully',
                'deleted_id' => $id
            ]);

        } catch (Exception $e) {
            error_log("PropertyPhotoController::delete() error: " . $e->getMessage());
            return $this->errorResponse('An error occurred while deleting photo');
        }
    }

    /**
     * Reorder photos
     * @param array $items Array of ['id' => photo_id, 'order' => order]
     * @return array
     */
    public function reorder($items) {
        try {
            if (!is_array($items) || empty($items)) {
                return $this->errorResponse('Invalid items array');
            }

            $this->conn->begin_transaction();

            $propertyId = null;
            $firstPhotoId = null;

            foreach ($items as $item) {
                if (!isset($item['id']) || !isset($item['order'])) {
                    $this->conn->rollback();
                    return $this->errorResponse('Each item must have id and order');
                }

                // Track the first photo (order=1)
                if ($item['order'] == 1) {
                    $firstPhotoId = $item['id'];
                }

                $query = "UPDATE property_photos SET `order` = ? WHERE id = ?";
                $result = $this->db->executePrepared(
                    $query, 
                    [$item['order'], $item['id']], 
                    'ii'
                );

                if ($result === false) {
                    $this->conn->rollback();
                    return $this->errorResponse('Failed to update photo order');
                }

                // Get property_id from first item
                if ($propertyId === null) {
                    $propQuery = "SELECT property_id FROM property_photos WHERE id = ? LIMIT 1";
                    $propResult = $this->db->executePrepared($propQuery, [$item['id']], 'i');
                    if ($propResult && $row = $propResult->fetch_assoc()) {
                        $propertyId = $row['property_id'];
                    }
                }
            }

            // Auto-set is_cover: first photo (order=1) becomes cover
            if ($propertyId && $firstPhotoId) {
                // Reset all covers for this property
                $resetQuery = "UPDATE property_photos SET is_cover = 0 WHERE property_id = ?";
                $this->db->executePrepared($resetQuery, [$propertyId], 'i');
                
                // Set first photo as cover
                $coverQuery = "UPDATE property_photos SET is_cover = 1 WHERE id = ?";
                $this->db->executePrepared($coverQuery, [$firstPhotoId], 'i');
            }

            $this->conn->commit();

            return $this->successResponse([
                'message' => 'Photos reordered successfully',
                'updated_count' => count($items)
            ]);

        } catch (Exception $e) {
            $this->conn->rollback();
            error_log("PropertyPhotoController::reorder() error: " . $e->getMessage());
            return $this->errorResponse('An error occurred while reordering photos');
        }
    }

    /**
     * Set a photo as cover
     * @param int $id Photo ID
     * @return array
     */
    public function setCover($id) {
        try {
            // Get photo details
            $photo = $this->getById($id);
            
            if (!$photo['success']) {
                return $photo;
            }

            $photoData = $photo['data'];

            // Remove cover status from other photos of the same property
            $this->removeCoverStatus($photoData['property_id']);

            // Set this photo as cover
            $query = "UPDATE property_photos SET is_cover = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if ($result === false) {
                return $this->errorResponse('Failed to set photo as cover');
            }

            return $this->successResponse([
                'message' => 'Photo set as cover successfully',
                'photo_id' => $id
            ]);

        } catch (Exception $e) {
            error_log("PropertyPhotoController::setCover() error: " . $e->getMessage());
            return $this->errorResponse('An error occurred while setting cover photo');
        }
    }

    /**
     * Remove cover status from all photos of a property
     * @param int $propertyId Property ID
     */
    private function removeCoverStatus($propertyId) {
        $query = "UPDATE property_photos SET is_cover = 0 WHERE property_id = ?";
        $this->db->executePrepared($query, [$propertyId], 'i');
    }

    /**
     * Delete physical photo files
     * @param string $imageUrl Image URL
     */
    private function deletePhotoFiles($imageUrl) {
        try {
            // Extract path from URL
            $path = parse_url($imageUrl, PHP_URL_PATH);
            $path = ltrim($path, '/');

            // Delete original
            $originalPath = $this->uploadDir . '/' . $path;
            if (file_exists($originalPath)) {
                unlink($originalPath);
            }

            // Delete versions (medium, thumbnail)
            $pathInfo = pathinfo($originalPath);
            $versions = ['medium', 'thumbnail'];
            
            foreach ($versions as $version) {
                $versionPath = $pathInfo['dirname'] . '/' . 
                               $pathInfo['filename'] . '_' . $version . '.' . 
                               $pathInfo['extension'];
                
                if (file_exists($versionPath)) {
                    unlink($versionPath);
                }
            }

        } catch (Exception $e) {
            error_log("Failed to delete photo files: " . $e->getMessage());
            // Don't fail the request if file deletion fails
        }
    }

    /**
     * Validate photo data
     * @param array $data Photo data
     * @return array
     */
    private function validatePhotoData($data) {
        $errors = [];

        if (empty($data['property_id'])) {
            $errors[] = 'Property ID is required';
        }

        if (empty($data['url'])) {
            $errors[] = 'Image URL is required';
        }

        if (!empty($errors)) {
            return $this->errorResponse(implode(', ', $errors), 400);
        }

        return ['success' => true];
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
