-- Database initialization script for Dalila Property Management System
-- MariaDB 10.6.23 compatible

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- Admin Users Table
-- =============================================
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `role` ENUM('admin', 'editor', 'viewer') DEFAULT 'editor',
  `is_active` TINYINT(1) DEFAULT 1,
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Properties Table
-- =============================================
CREATE TABLE IF NOT EXISTS `properties` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  `bedrooms` INT NULL,
  `bathrooms` DECIMAL(3,1) NULL,
  `square_feet` INT NULL,
  `lot_size` VARCHAR(50) NULL,
  `year_built` INT NULL,
  `property_type` VARCHAR(50) NULL COMMENT 'Single Family, Condo, Townhouse, etc.',
  `status` ENUM('active', 'pending', 'sold', 'draft') DEFAULT 'draft',
  `address` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(50) NULL,
  `zip_code` VARCHAR(20) NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `featured` TINYINT(1) DEFAULT 0,
  `featured_image` VARCHAR(255) NULL,
  `mls_number` VARCHAR(100) NULL,
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_slug` (`slug`),
  INDEX `idx_status` (`status`),
  INDEX `idx_featured` (`featured`),
  INDEX `idx_city` (`city`),
  INDEX `idx_price` (`price`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Photo Galleries Table
-- =============================================
CREATE TABLE IF NOT EXISTS `photogallery` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `thumbnail_url` VARCHAR(255) NULL,
  `medium_url` VARCHAR(255) NULL,
  `caption` VARCHAR(255) NULL,
  `alt_text` VARCHAR(255) NULL,
  `display_order` INT DEFAULT 0,
  `is_featured` TINYINT(1) DEFAULT 0,
  `file_size` INT NULL COMMENT 'Size in bytes',
  `width` INT NULL,
  `height` INT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_display_order` (`display_order`),
  INDEX `idx_is_featured` (`is_featured`),
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Videos Table
-- =============================================
CREATE TABLE IF NOT EXISTS `videos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `video_url` VARCHAR(500) NOT NULL COMMENT 'URL to video file or YouTube/Vimeo embed',
  `video_type` ENUM('upload', 'youtube', 'vimeo') DEFAULT 'upload',
  `thumbnail_url` VARCHAR(255) NULL,
  `duration` INT NULL COMMENT 'Duration in seconds',
  `display_order` INT DEFAULT 0,
  `is_featured` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_display_order` (`display_order`),
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Property Amenities Table
-- =============================================
CREATE TABLE IF NOT EXISTS `property_amenities` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NOT NULL,
  `amenity_name` VARCHAR(100) NOT NULL,
  `amenity_value` VARCHAR(255) NULL,
  `category` VARCHAR(50) NULL COMMENT 'Interior, Exterior, Community, etc.',
  PRIMARY KEY (`id`),
  INDEX `idx_property_id` (`property_id`),
  INDEX `idx_category` (`category`),
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sessions Table (for JWT token management)
-- =============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Activity Log Table
-- =============================================
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `action` VARCHAR(100) NOT NULL COMMENT 'create, update, delete, login, etc.',
  `entity_type` VARCHAR(50) NULL COMMENT 'property, video, photogallery, user',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Insert Default Admin User
-- Password: Admin@123 (CHANGE THIS IN PRODUCTION!)
-- =============================================
INSERT INTO `admin_users` (`email`, `password_hash`, `first_name`, `last_name`, `role`, `is_active`) 
VALUES ('admin@dalila.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', 1)
ON DUPLICATE KEY UPDATE `email` = `email`;

-- =============================================
-- Sample Properties Data
-- =============================================
INSERT INTO `properties` (`title`, `slug`, `description`, `price`, `bedrooms`, `bathrooms`, `square_feet`, `property_type`, `status`, `address`, `city`, `state`, `zip_code`, `featured`, `created_by`) VALUES
('Luxury Waterfront Villa', 'luxury-waterfront-villa', 'Stunning waterfront property with panoramic ocean views. Features high-end finishes, gourmet kitchen, and infinity pool.', 2500000.00, 5, 4.5, 4800, 'Single Family', 'active', '123 Ocean Drive', 'Miami Beach', 'FL', '33139', 1, 1),
('Modern Downtown Condo', 'modern-downtown-condo', 'Contemporary condo in the heart of downtown. Walking distance to restaurants, shops, and entertainment.', 650000.00, 2, 2.0, 1400, 'Condo', 'active', '456 Main Street', 'Miami', 'FL', '33130', 1, 1),
('Charming Family Home', 'charming-family-home', 'Beautifully maintained family home in quiet neighborhood. Large backyard perfect for entertaining.', 485000.00, 4, 3.0, 2600, 'Single Family', 'active', '789 Oak Avenue', 'Coral Gables', 'FL', '33134', 0, 1)
ON DUPLICATE KEY UPDATE `slug` = `slug`;

-- =============================================
-- Sample Videos Data (for homepage)
-- =============================================
INSERT INTO `videos` (`property_id`, `title`, `description`, `video_url`, `video_type`, `thumbnail_url`, `display_order`, `is_featured`) VALUES
(1, 'Luxury Villa Tour', 'Complete walkthrough of the stunning waterfront villa', 'https://player.vimeo.com/video/1042515673', 'vimeo', '/uploads/videos/thumbnails/villa-tour.jpg', 1, 1),
(2, 'Downtown Condo Showcase', 'Modern living in the heart of Miami', 'https://player.vimeo.com/video/1042515674', 'vimeo', '/uploads/videos/thumbnails/condo-tour.jpg', 2, 1),
(3, 'Family Home Experience', 'Discover this perfect family property', 'https://player.vimeo.com/video/1042515675', 'vimeo', '/uploads/videos/thumbnails/home-tour.jpg', 3, 1)
ON DUPLICATE KEY UPDATE `title` = `title`;

SET FOREIGN_KEY_CHECKS = 1;
