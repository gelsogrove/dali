-- Migration 039: Create landing_pages table
-- Created: 2026-04-02
-- Purpose: Create landing pages with SEO support and slug URL management

-- Create landing_pages table
CREATE TABLE IF NOT EXISTS `landing_pages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  
  -- Basic Info
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE COMMENT 'URL-friendly slug, must be unique',
  `subtitle` VARCHAR(255) NULL,
  `description` TEXT NULL COMMENT 'Short description for listings/previews',
  `content` LONGTEXT NULL COMMENT 'Rich text content (WYSIWYG)',
  
  -- SEO Fields
  `seo_title` VARCHAR(160) NULL COMMENT 'Title tag for search engines',
  `seo_description` TEXT NULL COMMENT 'Meta description for search engines',
  `seo_keywords` VARCHAR(255) NULL COMMENT 'Meta keywords (comma-separated)',
  `og_title` VARCHAR(160) NULL COMMENT 'Open Graph title for social sharing',
  `og_description` TEXT NULL COMMENT 'Open Graph description for social sharing',
  `og_image` VARCHAR(500) NULL COMMENT 'Open Graph image URL',
  
  -- Media
  `cover_image` VARCHAR(500) NULL COMMENT 'Cover/hero image URL',
  `cover_image_alt` VARCHAR(255) NULL COMMENT 'Alt text for cover image',
  
  -- Display Control
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Published status',
  `display_order` INT DEFAULT 0 COMMENT 'Sort order for listings',
  `featured` TINYINT(1) DEFAULT 0 COMMENT 'Show in homepage featured sections',
  
  -- Audit Trail
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL COMMENT 'Soft delete support',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_slug` (`slug`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_featured` (`featured`),
  INDEX `idx_display_order` (`display_order`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_deleted_at` (`deleted_at`)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Landing pages with SEO support and dynamic slug URLs';

-- Insert initial landing pages if they don't exist
INSERT INTO `landing_pages` (
  `title`, `slug`, `subtitle`, `description`, `content`,
  `seo_title`, `seo_description`, `seo_keywords`,
  `is_active`, `featured`, `display_order`
) VALUES
(
  'Investment Hub',
  'investment-hub',
  'Private access to curated real estate opportunities',
  'Join our private WhatsApp channel for exclusive real estate investment opportunities',
  '<h2>Investment Hub</h2><p>Private Access to Curated Real Estate Opportunities</p><p>A private WhatsApp channel created for those actively exploring investment opportunities in Riviera Maya and Miami.</p><p>This is not a group. It is a curated private channel where we share only relevant opportunities, filtered by city and budget.</p><p>A simple and discreet way to stay informed.</p><p><strong>Request Access</strong></p><p>Select your categories and receive tailored opportunities directly.</p>',
  'Investment Hub - Access to Curated Real Estate Opportunities in Riviera Maya and Miami',
  'Join our private WhatsApp channel for exclusive real estate investment opportunities in Riviera Maya and Miami. Filtered by city and budget.',
  'real estate investment, Riviera Maya, Miami, WhatsApp channel',
  1, 1, 1
),
(
  'Developers Services',
  'developers-services',
  'Exclusive consulting and support for software developers',
  'Discover exclusive consulting services tailored for software developers',
  '<h2>Developers Services</h2><p>Exclusive Consulting and Support for Software Development</p><p>We offer exclusive consulting services tailored for software developers. Our expert team provides the support you need to elevate your projects and achieve success.</p><p><strong>Request a Consultation</strong></p><p>Get in touch with our experts today to discuss how we can assist you.</p>',
  'Developers Services - Exclusive Consulting and Support for Software Development',
  'Discover exclusive consulting services tailored for software developers. Get expert support to elevate your projects.',
  'developers, consulting, software development, exclusive support',
  1, 1, 2
)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- Confirmation
SELECT 'Migration 039 applied: landing_pages table created successfully' AS status;
