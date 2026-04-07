-- Migration 046: Ensure landing_page_content_blocks table exists
-- Fixes issue where migration 044 was recorded as applied but table creation failed

CREATE TABLE IF NOT EXISTS landing_page_content_blocks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  landing_page_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NULL,
  subtitle VARCHAR(255) NULL,
  description TEXT NULL,
  image VARCHAR(500) NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (landing_page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
  INDEX idx_landing_page_id (landing_page_id),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
