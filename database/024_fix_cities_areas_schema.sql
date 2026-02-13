-- ============================================================================
-- Migration 024: Fix Cities & Areas Schema to Match Controller Expectations
-- ============================================================================
-- Issue: CityController.php e AreaController.php usano camelCase per alcuni campi
-- ma il DB usa snake_case (es. seoTitle vs seo_title). Questo causa errori di selezione.
-- ============================================================================

USE `dalila`;

-- ─── ALTER CITIES TABLE ─────────────────────────────────────────────────────
ALTER TABLE `cities`
  -- Rename & add missing columns
  CHANGE `name` `title` VARCHAR(255) NOT NULL,
  CHANGE `featured_image` `cover_image` VARCHAR(255) NULL,
  ADD COLUMN `subtitle` VARCHAR(500) NULL AFTER `title`,
  ADD COLUMN `cover_image_alt` VARCHAR(255) NULL AFTER `cover_image`,
  ADD COLUMN `content_image` VARCHAR(255) NULL AFTER `cover_image_alt`,
  ADD COLUMN `content_image_alt` VARCHAR(255) NULL AFTER `content_image`,
  ADD COLUMN `fullContent` LONGTEXT NULL AFTER `content_image_alt` COMMENT 'HTML content for landing page',
  
  -- Rename seo_title → seoTitle (camelCase)
  CHANGE `seo_title` `seoTitle` VARCHAR(160) NULL,
  CHANGE `seo_description` `seoDescription` TEXT NULL,
  
  -- Add OG tags (camelCase)
  ADD COLUMN `ogTitle` VARCHAR(160) NULL AFTER `seoDescription`,
  ADD COLUMN `ogDescription` TEXT NULL AFTER `ogTitle`,
  ADD COLUMN `ogImage` VARCHAR(500) NULL AFTER `ogDescription`,
  ADD COLUMN `keywords` TEXT NULL AFTER `ogImage`,
  ADD COLUMN `canonicalUrl` VARCHAR(500) NULL AFTER `keywords`,
  
  -- Rename & add display fields
  CHANGE `order` `display_order` INT DEFAULT 0,
  CHANGE `is_active` `is_home` TINYINT(1) DEFAULT 0 COMMENT 'Show on home page',
  ADD COLUMN `deleted_at` DATETIME NULL AFTER `updated_at`;

-- ─── ALTER AREAS TABLE ─────────────────────────────────────────────────────
ALTER TABLE `areas`
  -- Rename & add missing columns
  CHANGE `name` `title` VARCHAR(255) NOT NULL,
  CHANGE `featured_image` `cover_image` VARCHAR(255) NULL,
  ADD COLUMN `subtitle` VARCHAR(500) NULL AFTER `title`,
  ADD COLUMN `cover_image_alt` VARCHAR(255) NULL AFTER `cover_image`,
  ADD COLUMN `content_image` VARCHAR(255) NULL AFTER `cover_image_alt`,
  ADD COLUMN `content_image_alt` VARCHAR(255) NULL AFTER `content_image`,
  ADD COLUMN `fullContent` LONGTEXT NULL AFTER `content_image_alt`,
  
  -- Rename seo fields to camelCase
  CHANGE `seo_title` `seoTitle` VARCHAR(160) NULL,
  CHANGE `seo_description` `seoDescription` TEXT NULL,
  
  -- Add OG tags
  ADD COLUMN `ogTitle` VARCHAR(160) NULL AFTER `seoDescription`,
  ADD COLUMN `ogDescription` TEXT NULL AFTER `ogTitle`,
  ADD COLUMN `ogImage` VARCHAR(500) NULL AFTER `ogDescription`,
  ADD COLUMN `keywords` TEXT NULL AFTER `ogImage`,
  ADD COLUMN `canonicalUrl` VARCHAR(500) NULL AFTER `keywords`,
  
  -- Rename display fields
  CHANGE `order` `display_order` INT DEFAULT 0,
  CHANGE `is_active` `is_home` TINYINT(1) DEFAULT 0,
  ADD COLUMN `deleted_at` DATETIME NULL AFTER `updated_at`;

SELECT 'Migration 024 completed! Cities and Areas schema now matches controller expectations.' AS status;
