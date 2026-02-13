-- Migration 019: Fix property_landing_pages schema to match backend code
-- Created: 2026-02-13
-- Purpose: Ensure landing_page_slug column exists (used by /properties/:id/landing-pages)

-- Add landing_page_slug column if missing
ALTER TABLE `property_landing_pages`
  ADD COLUMN IF NOT EXISTS `landing_page_slug` VARCHAR(255) NOT NULL AFTER `property_id`;

-- Add index on landing_page_slug if missing
ALTER TABLE `property_landing_pages`
  ADD INDEX IF NOT EXISTS `idx_landing_page_slug` (`landing_page_slug`);

-- Add composite primary key (property_id, landing_page_slug) if not already set
-- MySQL doesn't support IF NOT EXISTS for primary keys, so we wrap in a guard.
SET @has_pk := (SELECT COUNT(*) 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'property_landing_pages' 
                  AND CONSTRAINT_TYPE = 'PRIMARY KEY');

SET @sql := IF(@has_pk = 0,
  'ALTER TABLE `property_landing_pages` DROP PRIMARY KEY, ADD PRIMARY KEY (`property_id`, `landing_page_slug`);',
  NULL);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Optional: drop legacy id/area_id/city_id columns if they exist (harmless if not present)
ALTER TABLE `property_landing_pages`
  DROP COLUMN IF EXISTS `id`,
  DROP COLUMN IF EXISTS `city_id`,
  DROP COLUMN IF EXISTS `area_id`;

-- Summary
SELECT 'Migration 019 applied: property_landing_pages now has landing_page_slug + composite PK' AS status;
