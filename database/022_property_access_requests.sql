-- Migration 022: Property Access Requests for Hot Deals
-- Allows clients to request access codes to download attachments on hot deal properties.
-- Access codes expire after 72 hours and can be regenerated.

CREATE TABLE IF NOT EXISTS property_access_requests (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(40) DEFAULT NULL,
    email VARCHAR(254) NOT NULL,
    message TEXT DEFAULT NULL,
    
    -- Access code management
    access_code VARCHAR(10) DEFAULT NULL,
    code_generated_at DATETIME DEFAULT NULL,
    code_expires_at DATETIME DEFAULT NULL,
    
    -- Admin tracking
    viewed TINYINT(1) NOT NULL DEFAULT 0,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT fk_access_request_property FOREIGN KEY (property_id) 
        REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_access_request_property (property_id),
    INDEX idx_access_request_email (email),
    INDEX idx_access_request_code (access_code),
    INDEX idx_access_request_viewed (viewed),
    INDEX idx_access_request_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
