-- Migration 014: Add property_landing_pages table
-- Created: 2026-02-04
-- Purpose: Create many-to-many relationship between properties and landing pages

-- Create property_landing_pages table if not exists
CREATE TABLE IF NOT EXISTS `property_landing_pages` (
  `property_id` INT UNSIGNED NOT NULL,
  `landing_page_slug` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`property_id`, `landing_page_slug`),
  CONSTRAINT `fk_plp_property` FOREIGN KEY (`property_id`) 
    REFERENCES `properties` (`id`) ON DELETE CASCADE,
  INDEX `idx_landing_page_slug` (`landing_page_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table was created
SELECT 'property_landing_pages table created successfully' AS status;
