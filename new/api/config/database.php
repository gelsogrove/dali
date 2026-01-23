<?php

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME') ?: 'dalila_db';
        $this->username = getenv('DB_USER') ?: 'dalila_user';
        $this->password = getenv('DB_PASSWORD') ?: '';
    }

    /**
     * Get database connection
     * @return mysqli|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);
            
            if ($this->conn->connect_error) {
                throw new Exception("Connection failed: " . $this->conn->connect_error);
            }

            // Set charset to utf8mb4
            $this->conn->set_charset("utf8mb4");
            
            return $this->conn;
        } catch (Exception $e) {
            error_log("Database connection error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Close database connection
     */
    public function closeConnection() {
        if ($this->conn) {
            $this->conn->close();
        }
    }

    /**
     * Execute a prepared statement with error handling
     * @param string $query SQL query with placeholders
     * @param array $params Array of parameters
     * @param string $types Parameter types (e.g., 'ssi' for string, string, integer)
     * @return mysqli_result|bool
     */
    public function executePrepared($query, $params = [], $types = '') {
        $stmt = $this->conn->prepare($query);
        
        if (!$stmt) {
            $error = "Prepare failed: " . $this->conn->error;
            error_log($error);
            throw new Exception($error);
        }

        if (!empty($params)) {
            if (!$stmt->bind_param($types, ...$params)) {
                $error = "Bind failed: " . $stmt->error;
                error_log($error);
                $stmt->close();
                throw new Exception($error);
            }
        }

        if (!$stmt->execute()) {
            $error = "Execute failed: " . $stmt->error;
            error_log($error);
            $stmt->close();
            throw new Exception($error);
        }

        // For INSERT/UPDATE/DELETE queries, get_result() returns false
        // We return true to indicate success
        $result = $stmt->get_result();
        if ($result === false && $stmt->affected_rows >= 0) {
            // This is an INSERT/UPDATE/DELETE query
            $stmt->close();
            return true;
        }
        
        $stmt->close();
        return $result;
    }

    /**
     * Get last insert ID
     * @return int
     */
    public function getLastInsertId() {
        return $this->conn->insert_id;
    }

    /**
     * Escape string for safe SQL usage
     * @param string $value
     * @return string
     */
    public function escapeString($value) {
        return $this->conn->real_escape_string($value);
    }
}
