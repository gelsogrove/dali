-- Migration 024: Fix Cities & Areas Schema (Idempotent Version 3)
-- Optimized for MariaDB to handle renames even if already partially applied.
-- Using separate lines for PREPARE/EXECUTE/DEALLOCATE for runner compatibility.

-- 1. Helper for Cities renames
SET @name_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities' AND COLUMN_NAME = 'name');
SET @feat_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities' AND COLUMN_NAME = 'featured_image');
SET @seo_title_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities' AND COLUMN_NAME = 'seo_title');
SET @seo_desc_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities' AND COLUMN_NAME = 'seo_description');
SET @order_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities' AND COLUMN_NAME = 'order');
SET @is_active_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cities' AND COLUMN_NAME = 'is_active');

SET @sql_cities := CONCAT('ALTER TABLE `cities` ',
  IF(@name_exists > 0, 'CHANGE `name` `title` VARCHAR(255) NOT NULL, ', ''),
  IF(@feat_exists > 0, 'CHANGE `featured_image` `cover_image` VARCHAR(255) NULL, ', ''),
  IF(@seo_title_exists > 0, 'CHANGE `seo_title` `seoTitle` VARCHAR(160) NULL, ', ''),
  IF(@seo_desc_exists > 0, 'CHANGE `seo_description` `seoDescription` TEXT NULL, ', ''),
  IF(@order_exists > 0, 'CHANGE `order` `display_order` INT DEFAULT 0, ', ''),
  IF(@is_active_exists > 0, 'CHANGE `is_active` `is_home` TINYINT(1) DEFAULT 0, ', '')
);

-- Remove trailing comma and space if added
SET @sql_cities := IF(RIGHT(@sql_cities, 2) = ', ', LEFT(@sql_cities, LENGTH(@sql_cities) - 2), @sql_cities);

-- Execute if there was at least one rename
SET @should_run_cities := IF(LENGTH(@sql_cities) > 21, 1, 0); -- 'ALTER TABLE `cities` ' is 21 chars
SET @sql_to_run_cities := IF(@should_run_cities = 1, @sql_cities, 'SELECT "No renames needed for cities"');

PREPARE stmt FROM @sql_to_run_cities; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt;

-- Add CITIES missing columns
ALTER TABLE `cities`
  ADD COLUMN IF NOT EXISTS `subtitle` VARCHAR(500) NULL AFTER `title`,
  ADD COLUMN IF NOT EXISTS `cover_image_alt` VARCHAR(255) NULL AFTER `cover_image`,
  ADD COLUMN IF NOT EXISTS `content_image` VARCHAR(255) NULL AFTER `cover_image_alt`,
  ADD COLUMN IF NOT EXISTS `content_image_alt` VARCHAR(255) NULL AFTER `content_image`,
  ADD COLUMN IF NOT EXISTS `fullContent` LONGTEXT NULL AFTER `content_image_alt`,
  ADD COLUMN IF NOT EXISTS `ogTitle` VARCHAR(160) NULL AFTER `seoDescription`,
  ADD COLUMN IF NOT EXISTS `ogDescription` TEXT NULL AFTER `ogTitle`,
  ADD COLUMN IF NOT EXISTS `ogImage` VARCHAR(500) NULL AFTER `ogDescription`,
  ADD COLUMN IF NOT EXISTS `keywords` TEXT NULL AFTER `ogImage`,
  ADD COLUMN IF NOT EXISTS `canonicalUrl` VARCHAR(500) NULL AFTER `keywords`,
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL AFTER `updated_at`;


-- 2. Helper for Areas renames
SET @name_exists_a := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'areas' AND COLUMN_NAME = 'name');
SET @feat_exists_a := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'areas' AND COLUMN_NAME = 'featured_image');
SET @seo_title_exists_a := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'areas' AND COLUMN_NAME = 'seo_title');
SET @seo_desc_exists_a := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'areas' AND COLUMN_NAME = 'seo_description');
SET @order_exists_a := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'areas' AND COLUMN_NAME = 'order');
SET @is_active_exists_a := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'areas' AND COLUMN_NAME = 'is_active');

SET @sql_areas := CONCAT('ALTER TABLE `areas` ',
  IF(@name_exists_a > 0, 'CHANGE `name` `title` VARCHAR(255) NOT NULL, ', ''),
  IF(@feat_exists_a > 0, 'CHANGE `featured_image` `cover_image` VARCHAR(255) NULL, ', ''),
  IF(@seo_title_exists_a > 0, 'CHANGE `seo_title` `seoTitle` VARCHAR(160) NULL, ', ''),
  IF(@seo_desc_exists_a > 0, 'CHANGE `seo_description` `seoDescription` TEXT NULL, ', ''),
  IF(@order_exists_a > 0, 'CHANGE `order` `display_order` INT DEFAULT 0, ', ''),
  IF(@is_active_exists_a > 0, 'CHANGE `is_active` `is_home` TINYINT(1) DEFAULT 0, ', '')
);

SET @sql_areas := IF(RIGHT(@sql_areas, 2) = ', ', LEFT(@sql_areas, LENGTH(@sql_areas) - 2), @sql_areas);

SET @should_run_areas := IF(LENGTH(@sql_areas) > 20, 1, 0); -- 'ALTER TABLE `areas` ' is 20 chars
SET @sql_to_run_areas := IF(@should_run_areas = 1, @sql_areas, 'SELECT "No renames needed for areas"');

PREPARE stmt_a FROM @sql_to_run_areas; 
EXECUTE stmt_a; 
DEALLOCATE PREPARE stmt_a;

ALTER TABLE `areas`
  ADD COLUMN IF NOT EXISTS `subtitle` VARCHAR(500) NULL AFTER `title`,
  ADD COLUMN IF NOT EXISTS `cover_image_alt` VARCHAR(255) NULL AFTER `cover_image`,
  ADD COLUMN IF NOT EXISTS `content_image` VARCHAR(255) NULL AFTER `cover_image_alt`,
  ADD COLUMN IF NOT EXISTS `content_image_alt` VARCHAR(255) NULL AFTER `content_image`,
  ADD COLUMN IF NOT EXISTS `fullContent` LONGTEXT NULL AFTER `content_image_alt`,
  ADD COLUMN IF NOT EXISTS `ogTitle` VARCHAR(160) NULL AFTER `seoDescription`,
  ADD COLUMN IF NOT EXISTS `ogDescription` TEXT NULL AFTER `ogTitle`,
  ADD COLUMN IF NOT EXISTS `ogImage` VARCHAR(500) NULL AFTER `ogDescription`,
  ADD COLUMN IF NOT EXISTS `keywords` TEXT NULL AFTER `ogImage`,
  ADD COLUMN IF NOT EXISTS `canonicalUrl` VARCHAR(500) NULL AFTER `keywords`,
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL AFTER `updated_at`;

SELECT 'Migration 024 completed! Cities and Areas schema now matches controller expectations.' AS status;
