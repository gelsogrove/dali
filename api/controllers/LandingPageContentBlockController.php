<?php

require_once __DIR__ . '/../config/database.php';

class LandingPageContentBlockController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Get all blocks for a landing page
     */
    public function getByLandingPageId($landingPageId)
    {
        try {
            $query = "SELECT * FROM landing_page_content_blocks 
                     WHERE landing_page_id = ? 
                     ORDER BY display_order ASC";
            
            $result = $this->db->executePrepared($query, [$landingPageId], 'i');
            
            if (!$result) {
                return $this->errorResponse('Failed to fetch blocks');
            }

            $blocks = [];
            while ($row = $result->fetch_assoc()) {
                $blocks[] = $this->formatBlock($row);
            }

            return $this->successResponse(['blocks' => $blocks]);
        } catch (Exception $e) {
            error_log("Error fetching blocks: " . $e->getMessage());
            return $this->errorResponse('Error fetching blocks: ' . $e->getMessage());
        }
    }

    /**
     * Create a new block
     */
    public function create($data)
    {
        try {
            $allowedFields = ['landing_page_id', 'title', 'subtitle', 'description', 'image', 'display_order'];
            $fields = [];
            $params = [];
            $types = '';

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = $field;
                    $params[] = $data[$field];
                    $types .= in_array($field, ['landing_page_id', 'display_order']) ? 'i' : 's';
                }
            }

            if (empty($fields)) {
                return $this->errorResponse('No valid fields provided');
            }

            $placeholders = implode(',', array_fill(0, count($fields), '?'));
            $query = "INSERT INTO landing_page_content_blocks (" . implode(',', $fields) . ") 
                     VALUES ($placeholders)";

            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to create block');
            }

            $newId = $this->conn->insert_id;

            return $this->successResponse([
                'block' => $this->getById($newId)['data']['block']
            ]);
        } catch (Exception $e) {
            error_log("Error creating block: " . $e->getMessage());
            return $this->errorResponse('Error creating block: ' . $e->getMessage());
        }
    }

    /**
     * Update a block
     */
    public function update($id, $data)
    {
        try {
            $allowedFields = ['title', 'subtitle', 'description', 'image', 'display_order'];
            $updates = [];
            $params = [];
            $types = '';

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                    $types .= $field === 'display_order' ? 'i' : 's';
                }
            }

            if (empty($updates)) {
                return $this->errorResponse('No valid fields to update');
            }

            $params[] = $id;
            $types .= 'i';

            $query = "UPDATE landing_page_content_blocks SET " . implode(', ', $updates) . " WHERE id = ?";
            $result = $this->db->executePrepared($query, $params, $types);

            if (!$result) {
                return $this->errorResponse('Failed to update block');
            }

            return $this->successResponse([
                'block' => $this->getById($id)['data']['block']
            ]);
        } catch (Exception $e) {
            error_log("Error updating block: " . $e->getMessage());
            return $this->errorResponse('Error updating block: ' . $e->getMessage());
        }
    }

    /**
     * Delete a block
     */
    public function delete($id)
    {
        try {
            $query = "DELETE FROM landing_page_content_blocks WHERE id = ?";
            $result = $this->db->executePrepared($query, [$id], 'i');

            if (!$result) {
                return $this->errorResponse('Failed to delete block');
            }

            return $this->successResponse(['message' => 'Block deleted']);
        } catch (Exception $e) {
            error_log("Error deleting block: " . $e->getMessage());
            return $this->errorResponse('Error deleting block: ' . $e->getMessage());
        }
    }

    /**
     * Reorder blocks
     */
    public function reorder($order)
    {
        try {
            foreach ($order as $item) {
                if (!isset($item['id']) || !isset($item['display_order'])) continue;

                $query = "UPDATE landing_page_content_blocks SET display_order = ? WHERE id = ?";
                $this->db->executePrepared($query, [$item['display_order'], $item['id']], 'ii');
            }

            return $this->successResponse(['message' => 'Blocks reordered']);
        } catch (Exception $e) {
            error_log("Error reordering blocks: " . $e->getMessage());
            return $this->errorResponse('Error reordering blocks: ' . $e->getMessage());
        }
    }

    /**
     * Get single block
     */
    private function getById($id)
    {
        $query = "SELECT * FROM landing_page_content_blocks WHERE id = ?";
        $result = $this->db->executePrepared($query, [$id], 'i');

        if (!$result || $result->num_rows === 0) {
            return $this->errorResponse('Block not found', 404);
        }

        $row = $result->fetch_assoc();
        return $this->successResponse(['block' => $this->formatBlock($row)]);
    }

    /**
     * Format block
     */
    private function formatBlock($row)
    {
        return [
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

    /**
     * Success response
     */
    private function successResponse($data)
    {
        return ['success' => true, 'data' => $data];
    }

    /**
     * Error response
     */
    private function errorResponse($message, $code = 400)
    {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }
}
