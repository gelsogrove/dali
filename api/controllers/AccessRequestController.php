<?php

class AccessRequestController {
    private $db;
    private $conn;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * PUBLIC: Create access request (from frontend)
     */
    public function create($data) {
        $firstName = trim($data['first_name'] ?? '');
        $lastName = trim($data['last_name'] ?? '');
        $email = trim($data['email'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $message = trim($data['message'] ?? '');
        $propertyId = (int)($data['property_id'] ?? 0);

        // Validation
        if ($firstName === '' || $lastName === '' || $email === '') {
            return $this->errorResponse('First name, last name and email are required', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->errorResponse('Invalid email address', 400);
        }
        if ($propertyId <= 0) {
            return $this->errorResponse('Invalid property', 400);
        }

        // Check property exists
        // Prefer soft-delete aware query; fall back if column missing
        $stmt = $this->conn->prepare("SELECT id, title FROM properties WHERE id = ? AND deleted_at IS NULL");
        if (!$stmt) {
            // Retry without deleted_at (older schemas)
            $stmt = $this->conn->prepare("SELECT id, title FROM properties WHERE id = ?");
        }
        if (!$stmt) {
            error_log('AccessRequestController::create prepare failed (properties): ' . $this->conn->error);
            return $this->errorResponse('Database error (properties lookup)', 500);
        }
        $stmt->bind_param('i', $propertyId);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0) {
            return $this->errorResponse('Property not found', 404);
        }
        $stmt->close();

        // Sanitize
        $firstName = htmlspecialchars(strip_tags($firstName), ENT_QUOTES, 'UTF-8');
        $lastName = htmlspecialchars(strip_tags($lastName), ENT_QUOTES, 'UTF-8');
        $phone = htmlspecialchars(strip_tags($phone), ENT_QUOTES, 'UTF-8');
        $message = htmlspecialchars(strip_tags($message), ENT_QUOTES, 'UTF-8');

        $stmt = $this->conn->prepare(
            "INSERT INTO property_access_requests (property_id, first_name, last_name, phone, email, message) 
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        if (!$stmt) {
            error_log('AccessRequestController::create prepare failed (insert): ' . $this->conn->error);
            return $this->errorResponse('Database error (insert)', 500);
        }
        $stmt->bind_param('isssss', $propertyId, $firstName, $lastName, $phone, $email, $message);

        if (!$stmt->execute()) {
            return $this->errorResponse('Failed to create request', 500);
        }

        $id = $stmt->insert_id;
        $stmt->close();

        return $this->successResponse([
            'id' => $id,
            'message' => 'Access request submitted successfully'
        ], 201);
    }

    /**
     * ADMIN: Get all access requests with property info
     */
    public function getAll($filters = []) {
        $page = max(1, (int)($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int)($filters['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        // Count total
        $countSql = "SELECT COUNT(*) as total FROM property_access_requests ar 
                     JOIN properties p ON ar.property_id = p.id";
        $countResult = $this->conn->query($countSql);
        if (!$countResult) {
            error_log('AccessRequestController::getAll count query failed: ' . $this->conn->error);
            return $this->errorResponse('Database error (count)', 500);
        }
        $total = $countResult->fetch_assoc()['total'] ?? 0;

        // Get requests with property info (keep columns compatible with older schemas)
        $sql = "SELECT ar.*, 
                       p.title as property_title, 
                       p.slug as property_slug,
                       p.property_type
                FROM property_access_requests ar
                JOIN properties p ON ar.property_id = p.id
                ORDER BY ar.created_at DESC
                LIMIT ? OFFSET ?";
        
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            error_log('AccessRequestController::getAll prepare failed: ' . $this->conn->error);
            return $this->errorResponse('Database error (list)', 500);
        }
        $stmt->bind_param('ii', $perPage, $offset);
        $stmt->execute();
        $result = $stmt->get_result();

        $requests = [];
        while ($row = $result->fetch_assoc()) {
            // Mask access code for list view
            $row['code_expired'] = false;
            if ($row['code_expires_at']) {
                $row['code_expired'] = strtotime($row['code_expires_at']) < time();
            }
            $requests[] = $row;
        }
        $stmt->close();

        return $this->successResponse([
            'requests' => $requests,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => (int)$total,
                'total_pages' => ceil($total / $perPage)
            ]
        ]);
    }

    /**
     * ADMIN: Get unviewed count (for badge)
     */
    public function getUnviewedCount() {
        $sql = "SELECT COUNT(*) as count FROM property_access_requests WHERE viewed = 0";
        $result = $this->conn->query($sql);
        if (!$result) {
            error_log('AccessRequestController::getUnviewedCount failed: ' . $this->conn->error);
            return $this->errorResponse('Database error (count)', 500);
        }
        $count = $result->fetch_assoc()['count'] ?? 0;

        return $this->successResponse(['count' => (int)$count]);
    }

    /**
     * ADMIN: Mark request as viewed
     */
    public function markViewed($id) {
        $stmt = $this->conn->prepare("UPDATE property_access_requests SET viewed = 1 WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $stmt->close();

        return $this->successResponse(['message' => 'Marked as viewed']);
    }

    /**
     * ADMIN: Mark all as viewed
     */
    public function markAllViewed() {
        $this->conn->query("UPDATE property_access_requests SET viewed = 1 WHERE viewed = 0");
        return $this->successResponse(['message' => 'All marked as viewed']);
    }

    /**
     * ADMIN: Generate access code (6-char alphanumeric)
     */
    public function generateCode($id) {
        // Check request exists
        $stmt = $this->conn->prepare("SELECT id, access_code, code_expires_at FROM property_access_requests WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            return $this->errorResponse('Request not found', 404);
        }
        $stmt->close();

        // Generate random 6-char alphanumeric code
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }

        $now = date('Y-m-d H:i:s');
        $expiresAt = date('Y-m-d H:i:s', strtotime('+72 hours'));

        $stmt = $this->conn->prepare(
            "UPDATE property_access_requests 
             SET access_code = ?, code_generated_at = ?, code_expires_at = ?, status = 'approved'
             WHERE id = ?"
        );
        $stmt->bind_param('sssi', $code, $now, $expiresAt, $id);
        $stmt->execute();
        $stmt->close();

        return $this->successResponse([
            'access_code' => $code,
            'code_generated_at' => $now,
            'code_expires_at' => $expiresAt,
            'message' => 'Access code generated successfully'
        ]);
    }

    /**
     * ADMIN: Regenerate expired code
     */
    public function regenerateCode($id) {
        return $this->generateCode($id); // Same logic, generates new code + new 72h window
    }

    /**
     * ADMIN: Delete request
     */
    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM property_access_requests WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            $stmt->close();
            return $this->errorResponse('Request not found', 404);
        }
        $stmt->close();

        return $this->successResponse(['message' => 'Request deleted']);
    }

    /**
     * PUBLIC: Verify access code for a property
     */
    public function verifyCode($data) {
        $code = strtoupper(trim($data['code'] ?? ''));

        if ($code === '') {
            return $this->errorResponse('Access code is required', 400);
        }

        $stmt = $this->conn->prepare(
            "SELECT id, code_expires_at 
             FROM property_access_requests 
             WHERE access_code = ? AND status = 'approved'
             ORDER BY code_generated_at DESC 
             LIMIT 1"
        );
        $stmt->bind_param('s', $code);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            return $this->errorResponse('Invalid access code', 401);
        }

        $row = $result->fetch_assoc();
        $stmt->close();

        // Check expiration
        if ($row['code_expires_at'] && strtotime($row['code_expires_at']) < time()) {
            return $this->errorResponse('Access code has expired', 401);
        }

        return $this->successResponse([
            'valid' => true,
            'expires_at' => $row['code_expires_at'],
            'message' => 'Access granted'
        ]);
    }

    private function successResponse($data, $code = 200) {
        http_response_code($code);
        return ['success' => true, 'data' => $data];
    }

    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }
}
