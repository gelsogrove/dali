-- Migration 020: Add property_attachments table for downloadable files
-- Created: 2026-02-13

CREATE TABLE IF NOT EXISTS `property_attachments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `url` TEXT NOT NULL,
  `mime_type` VARCHAR(120) NULL,
  `size_bytes` INT UNSIGNED NULL,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_display_order` (`display_order`),
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Downloadable attachments (pdf, docx, xlsx, pptx, etc.) linked to properties';

SELECT 'Migration 020 applied: property_attachments created' AS status;
