-- Migration 047: Fix landing_page_content_blocks table
-- The FK constraint failed because landing_pages.id is INT UNSIGNED
-- but landing_page_content_blocks.landing_page_id was INT (signed).
-- This migration drops and recreates the table with correct column type.

-- Drop the table if it exists (it may have been partially created)
DROP TABLE IF EXISTS landing_page_content_blocks;

-- Recreate with INT UNSIGNED to match landing_pages.id
CREATE TABLE landing_page_content_blocks (
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

SELECT 'Migration 047 applied: landing_page_content_blocks table created with correct INT UNSIGNED type' AS status;
