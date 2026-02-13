-- ============================================================================
-- DALILA PRODUCTION DATABASE MIGRATION - FIXED VERSION
-- ============================================================================
-- Version: 1.x.x → 2.0.0
-- Date: 2026-01-30
-- WARNING: BACKUP YOUR DATABASE BEFORE RUNNING THIS MIGRATION!
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- STEP 1: BACKUP EXISTING DATA
-- ============================================================================
DROP TABLE IF EXISTS `_backup_properties`;
CREATE TABLE `_backup_properties` AS SELECT * FROM `properties`;

-- ============================================================================
-- STEP 2: ALTER properties table - Add ALL missing columns
-- ============================================================================
ALTER TABLE `properties`
  ADD COLUMN IF NOT EXISTS `property_id_reference` VARCHAR(50) NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `subtitle` VARCHAR(255) NULL AFTER `title`,
  ADD COLUMN IF NOT EXISTS `content` LONGTEXT NULL AFTER `description`,
  ADD COLUMN IF NOT EXISTS `seo_title` VARCHAR(160) NULL AFTER `content`,
  ADD COLUMN IF NOT EXISTS `seo_description` TEXT NULL AFTER `seo_title`,
  ADD COLUMN IF NOT EXISTS `og_title` VARCHAR(160) NULL AFTER `seo_description`,
  ADD COLUMN IF NOT EXISTS `og_description` TEXT NULL AFTER `og_title`,
  ADD COLUMN IF NOT EXISTS `og_image` VARCHAR(500) NULL AFTER `og_description`,
  ADD COLUMN IF NOT EXISTS `price_usd` DECIMAL(15,2) NULL AFTER `og_image`,
  ADD COLUMN IF NOT EXISTS `price_mxn` DECIMAL(15,2) NULL AFTER `price_usd`,
  ADD COLUMN IF NOT EXISTS `exchange_rate` DECIMAL(10,4) NULL DEFAULT 18.50 AFTER `price_mxn`,
  ADD COLUMN IF NOT EXISTS `price_on_demand` TINYINT(1) DEFAULT 0 AFTER `exchange_rate`,
  ADD COLUMN IF NOT EXISTS `price_negotiable` TINYINT(1) DEFAULT 0 AFTER `price_on_demand`,
  ADD COLUMN IF NOT EXISTS `price_from_usd` DECIMAL(15,2) NULL AFTER `price_negotiable`,
  ADD COLUMN IF NOT EXISTS `price_to_usd` DECIMAL(15,2) NULL AFTER `price_from_usd`,
  ADD COLUMN IF NOT EXISTS `sqm` DECIMAL(10,2) NULL AFTER `bathrooms`,
  ADD COLUMN IF NOT EXISTS `sqft` DECIMAL(10,2) NULL AFTER `sqm`,
  ADD COLUMN IF NOT EXISTS `lot_size_sqm` DECIMAL(10,2) NULL AFTER `sqft`,
  ADD COLUMN IF NOT EXISTS `unit_typology` VARCHAR(255) NULL AFTER `lot_size_sqm`,
  ADD COLUMN IF NOT EXISTS `furnishing_status` ENUM('furnished', 'semi-furnished', 'unfurnished') NULL AFTER `unit_typology`,
  ADD COLUMN IF NOT EXISTS `tags` TEXT NULL AFTER `furnishing_status`,
  ADD COLUMN IF NOT EXISTS `neighborhood` VARCHAR(255) NULL AFTER `address`,
  ADD COLUMN IF NOT EXISTS `country` VARCHAR(100) NULL AFTER `city`,
  ADD COLUMN IF NOT EXISTS `google_maps_url` TEXT NULL AFTER `longitude`,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 0 AFTER `google_maps_url`,
  ADD COLUMN IF NOT EXISTS `order` INT DEFAULT 0 AFTER `featured`,
  ADD COLUMN IF NOT EXISTS `views_count` INT DEFAULT 0 AFTER `order`,
  ADD COLUMN IF NOT EXISTS `internal_notes` TEXT NULL AFTER `views_count`,
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL AFTER `updated_at`,
  ADD COLUMN IF NOT EXISTS `property_category` ENUM('apartment', 'house', 'villa', 'condo', 'penthouse', 'loft', 'studio', 'land', 'townhouse', 'commercial') NULL AFTER `property_type`;

-- ============================================================================
-- STEP 3: Modify existing columns
-- ============================================================================
ALTER TABLE `properties`
  MODIFY COLUMN `property_type` ENUM('active', 'development') NOT NULL DEFAULT 'active',
  MODIFY COLUMN `status` ENUM('for_sale', 'sold', 'reserved') NOT NULL DEFAULT 'for_sale';

-- ============================================================================
-- STEP 4: Remove old columns if they exist
-- ============================================================================
ALTER TABLE `properties`
  DROP COLUMN IF EXISTS `square_feet`,
  DROP COLUMN IF EXISTS `lot_size`,
  DROP COLUMN IF EXISTS `state`,
  DROP COLUMN IF EXISTS `zip_code`,
  DROP COLUMN IF EXISTS `featured_image`,
  DROP COLUMN IF EXISTS `mls_number`,
  DROP COLUMN IF EXISTS `price`;

-- ============================================================================
-- STEP 5: Update indexes
-- ============================================================================
ALTER TABLE `properties`
  DROP INDEX IF EXISTS `idx_slug`,
  DROP INDEX IF EXISTS `slug`;

ALTER TABLE `properties`
  ADD UNIQUE INDEX IF NOT EXISTS `unique_property_id_ref` (`property_id_reference`),
  ADD UNIQUE INDEX IF NOT EXISTS `unique_slug` (`slug`),
  ADD INDEX IF NOT EXISTS `idx_property_type` (`property_type`),
  ADD INDEX IF NOT EXISTS `idx_property_category` (`property_category`),
  ADD INDEX IF NOT EXISTS `idx_country` (`country`),
  ADD INDEX IF NOT EXISTS `idx_furnishing_status` (`furnishing_status`),
  ADD INDEX IF NOT EXISTS `idx_price_usd` (`price_usd`),
  ADD INDEX IF NOT EXISTS `idx_order` (`order`),
  ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`),
  ADD INDEX IF NOT EXISTS `idx_is_active` (`is_active`);

-- ============================================================================
-- STEP 6: Migrate and clean data
-- ============================================================================

-- Generate property_id_reference for existing properties
SET @counter = 0;
UPDATE `properties`
SET `property_id_reference` = CONCAT('PROP-', YEAR(COALESCE(created_at, NOW())), '-', LPAD((@counter := @counter + 1), 3, '0'))
WHERE `property_id_reference` IS NULL OR `property_id_reference` = ''
ORDER BY `id`;

-- Set is_active = 1 for for_sale properties
UPDATE `properties`
SET `is_active` = 1
WHERE `status` = 'for_sale' AND (`is_active` IS NULL OR `is_active` = 0);

-- Clean invalid data
UPDATE `properties` SET bedrooms = NULL WHERE bedrooms < 0;
UPDATE `properties` SET bathrooms = NULL WHERE bathrooms < 0;
UPDATE `properties` SET latitude = NULL WHERE latitude IS NOT NULL AND (latitude < -90 OR latitude > 90);
UPDATE `properties` SET longitude = NULL WHERE longitude IS NOT NULL AND (longitude < -180 OR longitude > 180);
UPDATE `properties` SET price_usd = NULL WHERE price_usd IS NOT NULL AND price_usd < 0;

-- ============================================================================
-- STEP 7: Fix blogs table
-- ============================================================================
ALTER TABLE `blogs`
  ADD COLUMN IF NOT EXISTS `canonical_url` VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS `seo_title` VARCHAR(160) NULL,
  ADD COLUMN IF NOT EXISTS `og_title` VARCHAR(160) NULL,
  ADD COLUMN IF NOT EXISTS `seo_description` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `og_description` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `og_image` VARCHAR(500) NULL;

-- ============================================================================
-- STEP 8: Create supporting tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS `property_landing_pages` (
  `property_id` INT UNSIGNED NOT NULL,
  `landing_page_slug` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`property_id`, `landing_page_slug`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_landing_page_slug` (`landing_page_slug`),
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `seo_title` VARCHAR(160) NULL,
  `seo_description` TEXT NULL,
  `featured_image` VARCHAR(255) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_order` (`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `areas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `city_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `seo_title` VARCHAR(160) NULL,
  `seo_description` TEXT NULL,
  `featured_image` VARCHAR(255) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_city_slug` (`city_id`, `slug`),
  INDEX `idx_city_id` (`city_id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_order` (`order`),
  FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `redirects` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `url_old` VARCHAR(500) NOT NULL,
  `url_new` VARCHAR(500) NOT NULL DEFAULT '',
  `redirect_type` INT DEFAULT 301,
  `is_active` TINYINT(1) DEFAULT 1,
  `hit_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_url_old` (`url_old`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NULL,
  `content` TEXT NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `rating` INT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 9: Clean up
-- ============================================================================
DELETE FROM `properties` WHERE title IN ('tedsf', 'test', 'ttt');
TRUNCATE TABLE `sessions`;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration completed! Run 002_triggers_procedures.sql next.' AS status;
