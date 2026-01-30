<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

class AuthController {
    private $db;
    private $conn;
    private $jwt;

    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
        $this->jwt = new JWTHandler();
    }

    /**
     * User login
     * @param string $email User email
     * @param string $password User password
     * @return array Response with token or error
     */
    public function login($email, $password) {
        try {
            // Validate input
            if (empty($email) || empty($password)) {
                error_log("Login failed: Empty email or password");
                return $this->errorResponse('Email and password are required', 400);
            }

            // Get user from database
            $query = "SELECT id, email, password_hash, first_name, last_name, role, is_active 
                     FROM admin_users WHERE email = ? LIMIT 1";
            
            $result = $this->db->executePrepared($query, [$email], 's');

            if (!$result || $result->num_rows === 0) {
                error_log("Login failed: User not found for email: " . $email);
                return $this->errorResponse('Invalid email or password. Please check your credentials.', 401);
            }

            $user = $result->fetch_assoc();

            // Check if user is active
            if (!$user['is_active']) {
                error_log("Login failed: Account inactive for user: " . $email);
                return $this->errorResponse('Your account is inactive. Please contact support.', 403);
            }

            // Verify password
            if (!password_verify($password, $user['password_hash'])) {
                error_log("Login failed: Invalid password for user: " . $email);
                return $this->errorResponse('Invalid email or password. Please check your credentials.', 401);
            }

            // Generate JWT token
            $payload = [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role']
            ];

            $token = $this->jwt->generateToken($payload);
            $refreshToken = $this->jwt->generateRefreshToken($user['id']);

            // Store session
            $this->storeSession($user['id'], $token, $refreshToken);

            // Update last login
            $this->updateLastLogin($user['id']);

            return $this->successResponse([
                'token' => $token,
                'refresh_token' => $refreshToken,
                'expires_in' => $this->jwt->getTokenExpiry(),
                'user' => [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'role' => $user['role']
                ]
            ]);

        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
            return $this->errorResponse('An error occurred during login', 500);
        }
    }

    /**
     * User logout
     * @param string $token JWT token
     * @return array Response
     */
    public function logout($token) {
        try {
            $payload = $this->jwt->verifyToken($token);
            
            if (!$payload) {
                return $this->errorResponse('Invalid token', 401);
            }

            // Delete session
            $query = "DELETE FROM sessions WHERE user_id = ? AND token = ?";
            $this->db->executePrepared($query, [$payload['user_id'], $token], 'is');

            return $this->successResponse(['message' => 'Logout successful']);

        } catch (Exception $e) {
            error_log("Logout error: " . $e->getMessage());
            return $this->errorResponse('An error occurred during logout', 500);
        }
    }

    /**
     * Verify token and return user data
     * @param string $token JWT token
     * @return array Response with user data or error
     */
    public function verifyToken($token) {
        $payload = $this->jwt->verifyToken($token);
        
        if (!$payload) {
            return $this->errorResponse('Invalid or expired token', 401);
        }

        // Check if session exists
        $query = "SELECT id FROM sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()";
        $result = $this->db->executePrepared($query, [$payload['user_id'], $token], 'is');

        if (!$result || $result->num_rows === 0) {
            return $this->errorResponse('Session expired', 401);
        }

        return $this->successResponse([
            'valid' => true,
            'user' => $payload
        ]);
    }

    /**
     * Store session in database
     * @param int $userId User ID
     * @param string $token JWT token
     * @param string $refreshToken Refresh token
     */
    private function storeSession($userId, $token, $refreshToken) {
        $expiresAt = date('Y-m-d H:i:s', time() + $this->jwt->getTokenExpiry());
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

        $query = "INSERT INTO sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at) 
                 VALUES (?, ?, ?, ?, ?, ?)";
        
        // Store variables to pass by reference
        $params = [$userId, $token, $refreshToken, $ipAddress, $userAgent, $expiresAt];
        
        $this->db->executePrepared($query, $params, 'isssss');
    }

    /**
     * Update last login timestamp
     * @param int $userId User ID
     */
    private function updateLastLogin($userId) {
        $query = "UPDATE admin_users SET last_login = NOW() WHERE id = ?";
        $this->db->executePrepared($query, [$userId], 'i');
    }

    /**
     * Log activity
     * @param int $userId User ID
     * @param string $action Action performed
     * @param string $entityType Entity type
     * @param int $entityId Entity ID
     * @param string $description Description
     */
    private function logActivity($userId, $action, $entityType, $entityId, $description) {
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
        
        $query = "INSERT INTO activity_log (user_id, action, entity_type, entity_id, description, ip_address) 
                 VALUES (?, ?, ?, ?, ?, ?)";
        
        $this->db->executePrepared($query, 
            [$userId, $action, $entityType, $entityId, $description, $ipAddress],
            'ississ'
        );
    }

    /**
     * Success response
     * @param mixed $data Response data
     * @return array
     */
    private function successResponse($data) {
        return [
            'success' => true,
            'data' => $data
        ];
    }

    /**
     * Error response
     * @param string $message Error message
     * @param int $code HTTP status code
     * @return array
     */
    private function errorResponse($message, $code = 400) {
        http_response_code($code);
        return [
            'success' => false,
            'error' => $message
        ];
    }
}
