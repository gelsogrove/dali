<?php

require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/database.php';

class AuthMiddleware {
    private $jwt;
    private $db;

    public function __construct() {
        $this->jwt = new JWTHandler();
        $this->db = new Database();
    }

    /**
     * Authenticate request
     * @return array|false User data or false
     */
    public function authenticate() {
        $token = $this->getBearerToken();

        if (!$token) {
            $this->sendUnauthorized('No token provided');
            return false;
        }

        $payload = $this->jwt->verifyToken($token);

        if (!$payload) {
            $this->sendUnauthorized('Invalid or expired token');
            return false;
        }

        // Verify session exists and is valid; if missing but token still valid, recreate it
        $conn = $this->db->getConnection();
        $query = "SELECT id FROM sessions WHERE user_id = ? AND token = ? AND expires_at > NOW() LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('is', $payload['user_id'], $token);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            // Attempt to recreate session to avoid stale-token errors
            $expiresAt = isset($payload['exp'])
                ? date('Y-m-d H:i:s', $payload['exp'])
                : date('Y-m-d H:i:s', time() + 3600);
            $ip = $_SERVER['REMOTE_ADDR'] ?? null;
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $insert = $conn->prepare("INSERT INTO sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at) VALUES (?, ?, NULL, ?, ?, ?)");
            $insert->bind_param('issss', $payload['user_id'], $token, $ip, $ua, $expiresAt);
            $insert->execute();

            if ($insert->affected_rows === 0) {
                $this->sendUnauthorized('Session expired');
                return false;
            }
        }

        return $payload;
    }

    /**
     * Check if user has required role
     * @param array $user User data
     * @param array $allowedRoles Array of allowed roles
     * @return bool
     */
    public function checkRole($user, $allowedRoles = []) {
        if (empty($allowedRoles)) {
            return true;
        }

        if (!isset($user['role']) || !in_array($user['role'], $allowedRoles)) {
            $this->sendForbidden('Insufficient permissions');
            return false;
        }

        return true;
    }

    /**
     * Get bearer token from header
     * @return string|null
     */
    private function getBearerToken() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];

        // Normalize keys to handle case differences
        $normalized = [];
        foreach ($headers as $key => $value) {
            $normalized[strtolower($key)] = $value;
        }

        // Fallbacks for servers that don't pass Authorization
        $candidates = [
            $normalized['authorization'] ?? null,
            $_SERVER['HTTP_AUTHORIZATION'] ?? null,
            $_SERVER['Authorization'] ?? null,
            $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null,
            $_SERVER['HTTP_X_AUTHORIZATION'] ?? null,
        ];

        foreach ($candidates as $auth) {
            if (!$auth) continue;
            if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Send unauthorized response
     * @param string $message Error message
     */
    private function sendUnauthorized($message) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }

    /**
     * Send forbidden response
     * @param string $message Error message
     */
    private function sendForbidden($message) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }
}
