<?php

class CSRFToken {
    private $token_name = 'csrf_token';
    private $session_key = 'csrf_tokens';

    /**
     * Generate CSRF token
     * @return string
     */
    public function generate() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $token = bin2hex(random_bytes(32));
        
        if (!isset($_SESSION[$this->session_key])) {
            $_SESSION[$this->session_key] = [];
        }

        $_SESSION[$this->session_key][$token] = time();

        // Clean up old tokens (older than 1 hour)
        $this->cleanupOldTokens();

        return $token;
    }

    /**
     * Verify CSRF token
     * @param string $token Token to verify
     * @return bool
     */
    public function verify($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION[$this->session_key][$token])) {
            return false;
        }

        $timestamp = $_SESSION[$this->session_key][$token];
        
        // Token expires after 1 hour
        if (time() - $timestamp > 3600) {
            unset($_SESSION[$this->session_key][$token]);
            return false;
        }

        // Token is valid, remove it (one-time use)
        unset($_SESSION[$this->session_key][$token]);
        
        return true;
    }

    /**
     * Get token from request headers
     * @return string|null
     */
    public function getTokenFromRequest() {
        $headers = getallheaders();
        
        if (isset($headers['X-CSRF-Token'])) {
            return $headers['X-CSRF-Token'];
        }

        if (isset($_POST[$this->token_name])) {
            return $_POST[$this->token_name];
        }

        return null;
    }

    /**
     * Clean up old tokens
     */
    private function cleanupOldTokens() {
        if (!isset($_SESSION[$this->session_key])) {
            return;
        }

        $current_time = time();
        foreach ($_SESSION[$this->session_key] as $token => $timestamp) {
            if ($current_time - $timestamp > 3600) {
                unset($_SESSION[$this->session_key][$token]);
            }
        }
    }
}
