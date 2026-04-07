-- Migration 040: Rename featured column to is_home
-- Created: 2026-04-07
-- Purpose: Rename featured column to is_home for clarity in landing pages

-- Rename the column
ALTER TABLE `landing_pages` 
CHANGE COLUMN `featured` `is_home` TINYINT(1) DEFAULT 0 COMMENT 'Show in homepage';

-- Update indexes if needed
-- The index idx_featured should be renamed to idx_is_home
ALTER TABLE `landing_pages` DROP INDEX `idx_featured`;
ALTER TABLE `landing_pages` ADD INDEX `idx_is_home` (`is_home`);

-- Confirmation
SELECT 'Migration 040 applied: featured column renamed to is_home' AS status;
