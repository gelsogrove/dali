<?php

class OffMarketInviteController
{
    private $db;
    private $conn;

    public function __construct()
    {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }

    /**
     * Generate a random token (URL-safe)
     */
    private function generateToken($length = 12)
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        $token = '';
        for ($i = 0; $i < $length; $i++) {
            $token .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $token;
    }

    /**
     * Generate a 6-char alphanumeric code
     */
    private function generateCode()
    {
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $code;
    }

    /**
     * ADMIN: Create invite for a property
     */
    public function create($data)
    {
        $propertyId = (int) ($data['property_id'] ?? 0);
        $clientName = trim($data['client_name'] ?? '');
        $clientEmail = trim($data['client_email'] ?? '');

        // Check property exists and is off_market (if property_id is provided)
        $property = null;
        if ($propertyId > 0) {
            $stmt = $this->conn->prepare("SELECT id, title, slug FROM properties WHERE id = ? AND deleted_at IS NULL");
            $stmt->bind_param('i', $propertyId);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows === 0) {
                $stmt->close();
                return $this->errorResponse('Property not found', 404);
            }
            $property = $result->fetch_assoc();
            $stmt->close();
        }

        // Generate unique token
        $token = $this->generateToken();
        // Ensure uniqueness
        $checkStmt = $this->conn->prepare("SELECT id FROM off_market_invites WHERE token = ?");
        $checkStmt->bind_param('s', $token);
        $checkStmt->execute();
        while ($checkStmt->get_result()->num_rows > 0) {
            $token = $this->generateToken();
            $checkStmt->bind_param('s', $token);
            $checkStmt->execute();
        }
        $checkStmt->close();

        $code = $this->generateCode();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+72 hours'));

        // Use NULL if propertyId is 0
        $dbPropertyId = $propertyId > 0 ? $propertyId : null;

        // Sanitize
        $clientName = htmlspecialchars(strip_tags($clientName), ENT_QUOTES, 'UTF-8');
        $clientEmail = htmlspecialchars(strip_tags($clientEmail), ENT_QUOTES, 'UTF-8');

        $stmt = $this->conn->prepare(
            "INSERT INTO off_market_invites (property_id, token, access_code, client_name, client_email, expires_at) 
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param('isssss', $dbPropertyId, $token, $code, $clientName, $clientEmail, $expiresAt);

        if (!$stmt->execute()) {
            return $this->errorResponse('Failed to create invite', 500);
        }

        $id = $stmt->insert_id;
        $stmt->close();

        // Build invite link
        $frontendUrl = getenv('FRONTEND_URL');
        if (!$frontendUrl) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443 ? "https://" : "http://";
            $host = $_SERVER['HTTP_HOST'] ?? 'buywithdali.com';
            $frontendUrl = $protocol . $host;

            // Check if we are in /new subfolder
            if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/new/api') !== false) {
                if (strpos($host, 'new.') === false) { // Only add /new if not already in a subdomain
                    $frontendUrl .= '/new';
                }
            }
        }
        $baseUrl = rtrim($frontendUrl, '/');

        if ($property) {
            $inviteLink = "{$baseUrl}/listings/{$property['slug']}?token={$token}";
        } else {
            $inviteLink = "{$baseUrl}/off-market";
        }

        return $this->successResponse([
            'id' => $id,
            'token' => $token,
            'access_code' => $code,
            'invite_link' => $inviteLink,
            'property_title' => $property ? $property['title'] : 'Global Session',
            'property_slug' => $property ? $property['slug'] : null,
            'expires_at' => $expiresAt,
            'message' => 'Invite created successfully'
        ], 201);
    }

    /**
     * ADMIN: Get all invites
     */
    public function getAll($filters = [])
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        // Count total
        $countResult = $this->conn->query("SELECT COUNT(*) as total FROM off_market_invites");
        $total = $countResult->fetch_assoc()['total'];

        $sql = "SELECT omi.*, 
                       p.title as property_title, 
                       p.slug as property_slug
                FROM off_market_invites omi
                LEFT JOIN properties p ON omi.property_id = p.id
                ORDER BY omi.created_at DESC
                LIMIT ? OFFSET ?";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('ii', $perPage, $offset);
        $stmt->execute();
        $result = $stmt->get_result();

        $invites = [];
        while ($row = $result->fetch_assoc()) {
            $row['is_expired'] = strtotime($row['expires_at']) < time();

            $frontendUrl = getenv('FRONTEND_URL');
            if (!$frontendUrl) {
                $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443 ? "https://" : "http://";
                $host = $_SERVER['HTTP_HOST'] ?? 'buywithdali.com';
                $frontendUrl = $protocol . $host;

                // Check if we are in /new subfolder
                if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/new/api') !== false) {
                    if (strpos($host, 'new.') === false) { // Only add /new if not already in a subdomain
                        $frontendUrl .= '/new';
                    }
                }
            }
            $baseUrl = rtrim($frontendUrl, '/');

            if ($row['property_slug']) {
                $row['invite_link'] = "{$baseUrl}/listings/{$row['property_slug']}?token={$row['token']}";
            } else {
                $row['invite_link'] = "{$baseUrl}/off-market";
                $row['property_title'] = 'Global Session';
            }

            $invites[] = $row;
        }
        $stmt->close();

        return $this->successResponse([
            'invites' => $invites,
            'pagination' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => (int) $total,
                'total_pages' => ceil($total / $perPage)
            ]
        ]);
    }

    /**
     * ADMIN: Get off-market properties list (for creating invites)
     */
    public function getOffMarketProperties()
    {
        $sql = "SELECT id, title, slug FROM properties 
                WHERE property_type = 'off_market' AND deleted_at IS NULL AND is_active = 1
                ORDER BY title ASC";
        $result = $this->conn->query($sql);

        if (!$result) {
            error_log("SQL Error in getOffMarketProperties: " . $this->conn->error);
            return $this->errorResponse('Database query failed: ' . $this->conn->error, 500);
        }

        $properties = [];
        while ($row = $result->fetch_assoc()) {
            $properties[] = $row;
        }
        return $this->successResponse($properties);
    }

    /**
     * ADMIN: Regenerate code for an invite (extends 7 days)
     */
    public function regenerate($id)
    {
        $stmt = $this->conn->prepare("SELECT id FROM off_market_invites WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            $stmt->close();
            return $this->errorResponse('Invite not found', 404);
        }
        $stmt->close();

        $code = $this->generateCode();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+72 hours'));

        $stmt = $this->conn->prepare(
            "UPDATE off_market_invites SET access_code = ?, expires_at = ? WHERE id = ?"
        );
        $stmt->bind_param('ssi', $code, $expiresAt, $id);
        $stmt->execute();
        $stmt->close();

        return $this->successResponse([
            'access_code' => $code,
            'expires_at' => $expiresAt,
            'message' => 'Invite regenerated successfully'
        ]);
    }

    /**
     * ADMIN: Delete invite
     */
    public function delete($id)
    {
        $stmt = $this->conn->prepare("DELETE FROM off_market_invites WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        if ($stmt->affected_rows === 0) {
            $stmt->close();
            return $this->errorResponse('Invite not found', 404);
        }
        $stmt->close();
        return $this->successResponse(['message' => 'Invite deleted']);
    }

    /**
     * PUBLIC: Verify token + code for a property
     */
    public function verify($data)
    {
        $token = trim($data['token'] ?? '');
        $code = strtoupper(trim($data['code'] ?? ''));

        if ($code === '') {
            return $this->errorResponse('Access code is required', 400);
        }

        if ($token !== '') {
            // Case 1: Token + Code (standard link)
            $stmt = $this->conn->prepare(
                "SELECT omi.id, omi.property_id, omi.expires_at, p.slug as property_slug
                 FROM off_market_invites omi
                 LEFT JOIN properties p ON omi.property_id = p.id
                 WHERE omi.token = ? AND omi.access_code = ?
                 LIMIT 1"
            );
            $stmt->bind_param('ss', $token, $code);
        } else {
            // Case 2: Code Only (manual entry)
            $stmt = $this->conn->prepare(
                "SELECT omi.id, omi.property_id, omi.expires_at, p.slug as property_slug
                 FROM off_market_invites omi
                 LEFT JOIN properties p ON omi.property_id = p.id
                 WHERE omi.access_code = ? AND omi.expires_at > NOW()
                 ORDER BY omi.created_at DESC
                 LIMIT 1"
            );
            $stmt->bind_param('s', $code);
        }

        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            return $this->errorResponse('Invalid access code', 401);
        }

        $row = $result->fetch_assoc();
        $stmt->close();

        if (strtotime($row['expires_at']) < time()) {
            return $this->errorResponse('This invite has expired. Please request a new one.', 401);
        }

        return $this->successResponse([
            'valid' => true,
            'property_id' => (int) $row['property_id'],
            'property_slug' => $row['property_slug'],
            'expires_at' => $row['expires_at'],
            'message' => 'Access granted'
        ]);
    }

    /**
     * PUBLIC: Check if a token is valid (before showing code input)
     */
    public function checkToken($token)
    {
        if (empty($token)) {
            return $this->errorResponse('Token is required', 400);
        }

        $stmt = $this->conn->prepare(
            "SELECT omi.id, omi.property_id, omi.expires_at, p.slug as property_slug, p.title as property_title
             FROM off_market_invites omi
             LEFT JOIN properties p ON omi.property_id = p.id
             WHERE omi.token = ?
             LIMIT 1"
        );
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            return $this->errorResponse('Invalid invite link', 404);
        }

        $row = $result->fetch_assoc();
        $stmt->close();

        $isExpired = strtotime($row['expires_at']) < time();

        return $this->successResponse([
            'valid' => !$isExpired,
            'expired' => $isExpired,
            'property_id' => $row['property_id'] ? (int) $row['property_id'] : null,
            'property_slug' => $row['property_slug'],
            'property_title' => $row['property_title'] ?: 'Global Session',
        ]);
    }

    private function successResponse($data, $code = 200)
    {
        http_response_code($code);
        return ['success' => true, 'data' => $data];
    }

    private function errorResponse($message, $code = 400)
    {
        http_response_code($code);
        return ['success' => false, 'error' => $message];
    }
}
