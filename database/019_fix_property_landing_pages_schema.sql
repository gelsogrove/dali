-- Migration 019: Fix property_landing_pages schema to match backend code
-- Optimized for MariaDB compatibility (handling AUTO_INCREMENT column drop)

-- 1. Ensure landing_page_slug column exists BEFORE dropping id
ALTER TABLE `property_landing_pages`
  ADD COLUMN IF NOT EXISTS `landing_page_slug` VARCHAR(255) NOT NULL AFTER `property_id`;

-- 2. Drop the old AUTO_INCREMENT column 'id' if it exists. 
-- Note: We must drop it or remove AUTO_INCREMENT before we change the Primary Key.
ALTER TABLE `property_landing_pages` DROP COLUMN IF EXISTS `id`;

-- 3. Now it is safe to change the Primary Key
SET @has_pk := (SELECT COUNT(*) 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'property_landing_pages' 
                  AND CONSTRAINT_TYPE = 'PRIMARY KEY');

SET @sql := IF(@has_pk > 0,
  'ALTER TABLE `property_landing_pages` DROP PRIMARY KEY, ADD PRIMARY KEY (`property_id`, `landing_page_slug`);',
  'ALTER TABLE `property_landing_pages` ADD PRIMARY KEY (`property_id`, `landing_page_slug`);');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Clean up other legacy columns
ALTER TABLE `property_landing_pages`
  DROP COLUMN IF EXISTS `city_id`,
  DROP COLUMN IF EXISTS `area_id`;

-- 5. Add index for performance
ALTER TABLE `property_landing_pages`
  ADD INDEX IF NOT EXISTS `idx_landing_page_slug` (`landing_page_slug`);

SELECT 'Migration 019 applied: property_landing_pages now has landing_page_slug + composite PK' AS status;
