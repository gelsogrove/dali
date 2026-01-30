-- ============================================================================
-- DALILA PROPERTY MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Version: 2.0.0
-- Date: 2026-01-30
-- MariaDB 10.6+ / MySQL 8.0+
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================================
-- ADMIN USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'editor', 'viewer') DEFAULT 'editor',
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`),
  INDEX `idx_email` (`email`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Admin users for backend access';

-- ============================================================================
-- PROPERTIES TABLE - COMPLETE SCHEMA
-- ============================================================================
CREATE TABLE IF NOT EXISTS `properties` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  
  -- Basic Info
  `property_id_reference` VARCHAR(50) NOT NULL COMMENT 'Auto-generated: PROP-2026-001',
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `content` LONGTEXT NULL COMMENT 'Rich text content (WYSIWYG)',
  
  -- SEO Fields
  `seo_title` VARCHAR(160) NULL,
  `seo_description` TEXT NULL,
  `og_title` VARCHAR(160) NULL,
  `og_description` TEXT NULL,
  `og_image` VARCHAR(500) NULL,
  
  -- Property Classification
  `property_type` ENUM('active', 'development') NOT NULL DEFAULT 'active' COMMENT 'Active Property or Development',
  `status` ENUM('for_sale', 'sold', 'reserved') NOT NULL DEFAULT 'for_sale',
  `property_category` ENUM('apartment', 'house', 'villa', 'condo', 'penthouse', 'loft', 'studio', 'land', 'townhouse', 'commercial') NULL,
  
  -- Pricing
  `price_usd` DECIMAL(15,2) NULL COMMENT 'Primary price in USD',
  `price_mxn` DECIMAL(15,2) NULL COMMENT 'Auto-calculated from USD',
  `exchange_rate` DECIMAL(10,4) NULL DEFAULT 18.50 COMMENT 'USD to MXN rate',
  `price_on_demand` TINYINT(1) DEFAULT 0,
  `price_negotiable` TINYINT(1) DEFAULT 0,
  `price_from_usd` DECIMAL(15,2) NULL COMMENT 'For developments - starting price',
  `price_to_usd` DECIMAL(15,2) NULL COMMENT 'For developments - max price',
  
  -- Physical Specs
  `bedrooms` INT NULL,
  `bathrooms` DECIMAL(3,1) NULL,
  `sqm` DECIMAL(10,2) NULL COMMENT 'Square meters',
  `sqft` DECIMAL(10,2) NULL COMMENT 'Auto-calculated from sqm',
  `lot_size_sqm` DECIMAL(10,2) NULL,
  `year_built` INT NULL,
  
  -- Development Specific
  `unit_typology` VARCHAR(255) NULL COMMENT 'Unit types for developments',
  
  -- Furnishing & Features
  `furnishing_status` ENUM('furnished', 'semi-furnished', 'unfurnished') NULL,
  `tags` TEXT NULL COMMENT 'JSON array of features/amenities',
  
  -- Location
  `address` VARCHAR(255) NULL,
  `neighborhood` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `google_maps_url` TEXT NULL,
  
  -- Admin & Display
  `is_active` TINYINT(1) DEFAULT 0 COMMENT 'Published status',
  `featured` TINYINT(1) DEFAULT 0,
  `order` INT DEFAULT 0 COMMENT 'Display order in lists',
  `views_count` INT DEFAULT 0,
  
  -- Notes
  `internal_notes` TEXT NULL COMMENT 'Private admin notes',
  
  -- Audit Trail
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL COMMENT 'Soft delete support',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_property_id_ref` (`property_id_reference`),
  UNIQUE KEY `unique_slug` (`slug`),
  
  INDEX `idx_status` (`status`),
  INDEX `idx_property_type` (`property_type`),
  INDEX `idx_property_category` (`property_category`),
  INDEX `idx_featured` (`featured`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_city` (`city`),
  INDEX `idx_country` (`country`),
  INDEX `idx_furnishing_status` (`furnishing_status`),
  INDEX `idx_price_usd` (`price_usd`),
  INDEX `idx_order` (`order`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_deleted_at` (`deleted_at`),
  
  FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  
  CHECK (`price_usd` IS NULL OR `price_usd` >= 0),
  CHECK (`bedrooms` IS NULL OR `bedrooms` >= 0),
  CHECK (`bathrooms` IS NULL OR `bathrooms` >= 0),
  CHECK (`latitude` IS NULL OR (`latitude` BETWEEN -90 AND 90)),
  CHECK (`longitude` IS NULL OR (`longitude` BETWEEN -180 AND 180))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete properties table with all required fields';

-- ============================================================================
-- PROPERTY PHOTOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `property_photos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `url` VARCHAR(500) NOT NULL COMMENT 'Original image URL',
  `large_url` VARCHAR(500) NULL,
  `medium_url` VARCHAR(500) NULL,
  `thumbnail_url` VARCHAR(500) NULL,
  `alt_text` VARCHAR(255) NULL,
  `is_cover` TINYINT(1) DEFAULT 0,
  `order` INT DEFAULT 0 COMMENT 'Display order (first=cover)',
  `file_size` INT NULL COMMENT 'Size in bytes',
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_order` (`order`),
  INDEX `idx_is_cover` (`is_cover`),
  
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Property gallery images with multiple sizes';

-- ============================================================================
-- PROPERTY LANDING PAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `property_landing_pages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NOT NULL,
  `city_id` INT UNSIGNED NULL,
  `area_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_city_id` (`city_id`),
  INDEX `idx_area_id` (`area_id`),
  
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Property associations with landing pages';

-- ============================================================================
-- CITIES TABLE
-- ============================================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cities for landing pages';

-- ============================================================================
-- AREAS TABLE
-- ============================================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Areas/neighborhoods within cities';

-- ============================================================================
-- BLOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `blogs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `content` LONGTEXT NULL,
  
  -- SEO
  `seo_title` VARCHAR(160) NULL,
  `seo_description` TEXT NULL,
  `og_title` VARCHAR(160) NULL,
  `og_description` TEXT NULL,
  `og_image` VARCHAR(500) NULL,
  `canonical_url` VARCHAR(500) NULL,
  
  -- Images
  `featured_image` VARCHAR(255) NULL,
  `featured_image_alt` VARCHAR(255) NOT NULL DEFAULT '',
  `content_image` VARCHAR(255) NULL COMMENT 'Large content image',
  `content_image_alt` VARCHAR(255) NOT NULL DEFAULT '',
  
  -- Display
  `is_home` TINYINT(1) DEFAULT 0,
  `display_order` INT DEFAULT 0,
  `published_date` DATE NULL,
  
  -- Audit
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`),
  INDEX `idx_is_home` (`is_home`),
  INDEX `idx_display_order` (`display_order`),
  INDEX `idx_published_date` (`published_date`),
  INDEX `idx_deleted_at` (`deleted_at`),
  
  FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Blog posts with SEO support';

-- ============================================================================
-- VIDEOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `videos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `video_url` VARCHAR(500) NOT NULL COMMENT 'Vimeo/YouTube embed URL',
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
  INDEX `idx_is_active` (`is_active`),
  
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Video gallery with property associations';

-- ============================================================================
-- TESTIMONIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NULL COMMENT 'Job title or role',
  `content` TEXT NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `rating` INT NULL COMMENT '1-5 stars',
  `is_active` TINYINT(1) DEFAULT 1,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Client testimonials';

-- ============================================================================
-- REDIRECTS TABLE
-- ============================================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='SEO redirects for deleted/moved content';

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `token` VARCHAR(512) NOT NULL,
  `refresh_token` VARCHAR(512) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_token` (`token`(255)),
  INDEX `idx_expires_at` (`expires_at`),
  
  FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Admin user sessions with JWT tokens';

-- ============================================================================
-- ACTIVITY LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL COMMENT 'create, update, delete, login, etc.',
  `entity_type` VARCHAR(50) NULL COMMENT 'property, video, blog, user',
  `entity_id` INT UNSIGNED NULL,
  `description` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_entity` (`entity_type`, `entity_id`),
  INDEX `idx_created_at` (`created_at`),
  
  FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for all admin actions';

-- ============================================================================
-- ENABLE FOREIGN KEY CHECKS
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- DEFAULT ADMIN USER
-- ============================================================================
-- Email: admin@dalila.com
-- Password: admin123 (MUST BE CHANGED IN PRODUCTION!)
-- ============================================================================
INSERT INTO `admin_users` (`id`, `email`, `password_hash`, `first_name`, `last_name`, `role`, `is_active`)
VALUES (1, 'admin@dalila.com', '$2y$10$Wy/DX5zbz/7hhGnXzjZItuoBdYFarw.wVBSj0Pzu9VlPAdI1gMrLK', 'Admin', 'User', 'admin', 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- END OF INIT SCRIPT
-- ============================================================================
