-- RESTORATION SCRIPT FOR LOCAL DATABASE
-- Recreates missing tables and aligns schema with production

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Create missing tables
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

CREATE TABLE IF NOT EXISTS `videos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `video_url` VARCHAR(500) NOT NULL,
  `video_type` ENUM('vimeo', 'youtube', 'upload', 'link') DEFAULT 'vimeo',
  `thumbnail_url` VARCHAR(255) NOT NULL,
  `thumbnail_alt` VARCHAR(255) NOT NULL DEFAULT '',
  `display_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_display_order` (`display_order`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `currency_from` VARCHAR(3) NOT NULL DEFAULT 'USD',
  `currency_to` VARCHAR(3) NOT NULL DEFAULT 'MXN',
  `rate` DECIMAL(10,4) NOT NULL,
  `date` DATE NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_currency_date` (`currency_from`, `currency_to`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Update properties table with missing columns
ALTER TABLE `properties` 
  ADD COLUMN IF NOT EXISTS `price_eur` DECIMAL(15,2) NULL AFTER `price_mxn`,
  ADD COLUMN IF NOT EXISTS `price_from_usd` DECIMAL(15,2) NULL AFTER `price_usd`,
  ADD COLUMN IF NOT EXISTS `price_to_usd` DECIMAL(15,2) NULL AFTER `price_from_usd`,
  ADD COLUMN IF NOT EXISTS `price_from_mxn` DECIMAL(15,2) NULL AFTER `price_mxn`,
  ADD COLUMN IF NOT EXISTS `price_to_mxn` DECIMAL(15,2) NULL AFTER `price_from_mxn`,
  ADD COLUMN IF NOT EXISTS `price_from_eur` DECIMAL(15,2) NULL AFTER `price_eur`,
  ADD COLUMN IF NOT EXISTS `price_to_eur` DECIMAL(15,2) NULL AFTER `price_from_eur`,
  ADD COLUMN IF NOT EXISTS `subtitle` VARCHAR(255) NULL AFTER `title`,
  ADD COLUMN IF NOT EXISTS `show_in_home` TINYINT(1) DEFAULT 0 AFTER `featured`;

-- 3. Apply Migration 024 changes to Cities & Areas
ALTER TABLE `cities` 
  CHANGE COLUMN IF EXISTS `name` `title` VARCHAR(255) NOT NULL,
  CHANGE COLUMN IF EXISTS `featured_image` `cover_image` VARCHAR(255) NULL,
  CHANGE COLUMN IF EXISTS `seo_title` `seoTitle` VARCHAR(160) NULL,
  CHANGE COLUMN IF EXISTS `seo_description` `seoDescription` TEXT NULL,
  CHANGE COLUMN IF EXISTS `order` `display_order` INT DEFAULT 0,
  CHANGE COLUMN IF EXISTS `is_active` `is_home` TINYINT(1) DEFAULT 0;

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

ALTER TABLE `areas` 
  CHANGE COLUMN IF EXISTS `name` `title` VARCHAR(255) NOT NULL,
  CHANGE COLUMN IF EXISTS `featured_image` `cover_image` VARCHAR(255) NULL,
  CHANGE COLUMN IF EXISTS `seo_title` `seoTitle` VARCHAR(160) NULL,
  CHANGE COLUMN IF EXISTS `seo_description` `seoDescription` TEXT NULL,
  CHANGE COLUMN IF EXISTS `order` `display_order` INT DEFAULT 0,
  CHANGE COLUMN IF EXISTS `is_active` `is_home` TINYINT(1) DEFAULT 0;

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

-- 4. Set Initial Data
INSERT INTO `exchange_rates` (`currency_from`, `currency_to`, `rate`, `date`, `is_active`) 
VALUES ('USD', 'MXN', 18.50, CURDATE(), 1), ('USD', 'EUR', 0.92, CURDATE(), 1)
ON DUPLICATE KEY UPDATE `rate` = VALUES(`rate`);

SET FOREIGN_KEY_CHECKS = 1;
