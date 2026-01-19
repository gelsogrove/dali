<?php

class JWTHandler {
    private $secret_key;
    private $algorithm = 'HS256';
    private $token_expiry = 3600; // 1 hour
    private $refresh_expiry = 604800; // 7 days

    public function __construct() {
        $this->secret_key = getenv('JWT_SECRET') ?: 'default-secret-change-in-production';
    }

    /**
     * Generate JWT token
     * @param array $payload User data to encode
     * @return string JWT token
     */
    public function generateToken($payload) {
        $header = [
            'typ' => 'JWT',
            'alg' => $this->algorithm
        ];

        $payload['iat'] = time();
        $payload['exp'] = time() + $this->token_expiry;

        $base64UrlHeader = $this->base64UrlEncode(json_encode($header));
        $base64UrlPayload = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret_key, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Verify and decode JWT token
     * @param string $token JWT token
     * @return array|false Decoded payload or false on failure
     */
    public function verifyToken($token) {
        $tokenParts = explode('.', $token);

        if (count($tokenParts) != 3) {
            return false;
        }

        $header = base64_decode($tokenParts[0]);
        $payload = base64_decode($tokenParts[1]);
        $signatureProvided = $tokenParts[2];

        // Verify signature
        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode($payload);
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret_key, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);

        if ($base64UrlSignature !== $signatureProvided) {
            return false;
        }

        $payload = json_decode($payload, true);

        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    }

    /**
     * Generate refresh token
     * @param int $userId User ID
     * @return string Refresh token
     */
    public function generateRefreshToken($userId) {
        $payload = [
            'user_id' => $userId,
            'type' => 'refresh',
            'iat' => time(),
            'exp' => time() + $this->refresh_expiry
        ];

        return $this->generateToken($payload);
    }

    /**
     * Base64 URL encode
     * @param string $data
     * @return string
     */
    private function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Get token expiry time in seconds
     * @return int
     */
    public function getTokenExpiry() {
        return $this->token_expiry;
    }
}
