-- Migration: Cities & Areas landing with SEO + soft delete
-- Compatible with MariaDB 10.6.x

START TRANSACTION;

-- Cities table
CREATE TABLE IF NOT EXISTS `cities` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `slug` VARCHAR(255) NOT NULL,
  `cover_image` VARCHAR(500) NULL,
  `cover_image_alt` VARCHAR(255) NOT NULL DEFAULT '',
  `content_image` VARCHAR(500) NULL,
  `content_image_alt` VARCHAR(255) NOT NULL DEFAULT '',
  `fullContent` LONGTEXT NULL,
  `seoTitle` VARCHAR(255) NULL,
  `seoDescription` TEXT NULL,
  `ogTitle` VARCHAR(255) NULL,
  `ogDescription` TEXT NULL,
  `ogImage` VARCHAR(500) NULL,
  `keywords` VARCHAR(500) NULL,
  `canonicalUrl` VARCHAR(500) NULL,
  `is_home` TINYINT(1) NOT NULL DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cities_slug` (`slug`),
  INDEX `idx_cities_is_home` (`is_home`),
  INDEX `idx_cities_deleted_at` (`deleted_at`),
  INDEX `idx_cities_display_order` (`display_order`),
  FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Areas table
CREATE TABLE IF NOT EXISTS `areas` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `city_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `slug` VARCHAR(255) NOT NULL,
  `cover_image` VARCHAR(500) NULL,
  `cover_image_alt` VARCHAR(255) NOT NULL DEFAULT '',
  `content_image` VARCHAR(500) NULL,
  `content_image_alt` VARCHAR(255) NOT NULL DEFAULT '',
  `fullContent` LONGTEXT NULL,
  `seoTitle` VARCHAR(255) NULL,
  `seoDescription` TEXT NULL,
  `ogTitle` VARCHAR(255) NULL,
  `ogDescription` TEXT NULL,
  `ogImage` VARCHAR(500) NULL,
  `keywords` VARCHAR(500) NULL,
  `canonicalUrl` VARCHAR(500) NULL,
  `is_home` TINYINT(1) NOT NULL DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_area_slug_city` (`slug`, `city_id`),
  INDEX `idx_areas_city` (`city_id`),
  INDEX `idx_areas_is_home` (`is_home`),
  INDEX `idx_areas_deleted_at` (`deleted_at`),
  INDEX `idx_areas_display_order` (`display_order`),
  FOREIGN KEY (`city_id`) REFERENCES `cities` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
