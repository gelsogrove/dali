-- Migration: SEO fields, alt text, redirect table, and is_home flag
-- Compatible with MariaDB 10.6.x

START TRANSACTION;

-- Blogs: SEO + alt + is_home
ALTER TABLE `blogs`
  ADD COLUMN IF NOT EXISTS `seoTitle` VARCHAR(255) NULL AFTER `title`,
  ADD COLUMN IF NOT EXISTS `seoDescription` TEXT NULL AFTER `seoTitle`,
  ADD COLUMN IF NOT EXISTS `subtitle` VARCHAR(255) NULL AFTER `slug`,
  ADD COLUMN IF NOT EXISTS `ogTitle` VARCHAR(255) NULL AFTER `seoDescription`,
  ADD COLUMN IF NOT EXISTS `ogDescription` TEXT NULL AFTER `ogTitle`,
  ADD COLUMN IF NOT EXISTS `ogImage` VARCHAR(500) NULL AFTER `ogDescription`,
  ADD COLUMN IF NOT EXISTS `featured_image_alt` VARCHAR(255) NOT NULL DEFAULT '' AFTER `featured_image`,
  ADD COLUMN IF NOT EXISTS `content_image` VARCHAR(255) NULL AFTER `featured_image_alt`,
  ADD COLUMN IF NOT EXISTS `content_image_alt` VARCHAR(255) NOT NULL DEFAULT '' AFTER `content_image`,
  ADD COLUMN IF NOT EXISTS `is_home` TINYINT(1) NOT NULL DEFAULT 0 AFTER `content_image_alt`,
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL AFTER `updated_at`;

UPDATE `blogs` SET `is_home` = COALESCE(`is_home`, 0);

DROP INDEX IF EXISTS `idx_is_active` ON `blogs`;
ALTER TABLE `blogs` ADD INDEX IF NOT EXISTS `idx_is_home` (`is_home`);
ALTER TABLE `blogs` ADD INDEX IF NOT EXISTS `idx_deleted_at` (`deleted_at`);
ALTER TABLE `blogs` DROP COLUMN IF EXISTS `is_active`;

-- Videos: alt + is_home
ALTER TABLE `videos`
  ADD COLUMN IF NOT EXISTS `thumbnail_alt` VARCHAR(255) NOT NULL DEFAULT '' AFTER `thumbnail_url`,
  ADD COLUMN IF NOT EXISTS `is_home` TINYINT(1) NOT NULL DEFAULT 0 AFTER `display_order`,
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL AFTER `updated_at`;

UPDATE `videos` SET `is_home` = COALESCE(`is_home`, 0);

DROP INDEX IF EXISTS `idx_is_active` ON `videos`;
ALTER TABLE `videos` ADD INDEX IF NOT EXISTS `idx_is_home` (`is_home`);
ALTER TABLE `videos` DROP COLUMN IF EXISTS `is_active`;

-- Testimonials: ensure table exists, swap is_active -> is_home
CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `author` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `testimonial_date` DATE NULL,
  `display_order` INT DEFAULT 0,
  `is_home` TINYINT(1) NOT NULL DEFAULT 0,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_display_order` (`display_order`),
  INDEX `idx_is_home` (`is_home`),
  INDEX `idx_testimonial_date` (`testimonial_date`),
  FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `testimonials`
  ADD COLUMN IF NOT EXISTS `is_home` TINYINT(1) NOT NULL DEFAULT 0 AFTER `display_order`;

UPDATE `testimonials` SET `is_home` = COALESCE(`is_home`, 0);

DROP INDEX IF EXISTS `idx_is_active` ON `testimonials`;
ALTER TABLE `testimonials` ADD INDEX IF NOT EXISTS `idx_is_home` (`is_home`);
ALTER TABLE `testimonials` DROP COLUMN IF EXISTS `is_active`;

-- Redirect table
CREATE TABLE IF NOT EXISTS `redirect` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `urlOld` VARCHAR(500) NOT NULL,
  `urlNew` VARCHAR(500) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_url_old` (`urlOld`),
  INDEX `idx_url_new` (`urlNew`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
