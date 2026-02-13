-- Migration 023: Off Market Invites
-- Per-property invite system for off-market properties.
-- Each invite has a unique token (for URL) and access code (for verification).
-- Invites expire after 7 days and can be regenerated.

CREATE TABLE IF NOT EXISTS off_market_invites (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    token VARCHAR(20) NOT NULL,
    access_code VARCHAR(10) NOT NULL,
    
    -- Client info (optional, for tracking)
    client_name VARCHAR(200) DEFAULT NULL,
    client_email VARCHAR(254) DEFAULT NULL,
    
    -- Expiration
    expires_at DATETIME NOT NULL,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT fk_off_market_invite_property FOREIGN KEY (property_id) 
        REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Indexes
    UNIQUE INDEX idx_off_market_token (token),
    INDEX idx_off_market_property (property_id),
    INDEX idx_off_market_code (access_code),
    INDEX idx_off_market_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
