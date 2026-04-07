-- Migration 044: Create landing_page_content_blocks table for dynamic blocks
-- Drop old fixed columns and create flexible table

-- Create new content blocks table
CREATE TABLE IF NOT EXISTS landing_page_content_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  landing_page_id INT NOT NULL,
  title VARCHAR(255) NULL,
  subtitle VARCHAR(255) NULL,
  description TEXT NULL,
  image VARCHAR(500) NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (landing_page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
  INDEX idx_landing_page_id (landing_page_id),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing data from old columns to new table
-- Only migrate if there's actual content (title or description or image)
INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id, content_block_1_title, content_block_1_subtitle, content_block_1_description, content_block_1_image, 1
FROM landing_pages
WHERE content_block_1_title IS NOT NULL OR content_block_1_description IS NOT NULL OR content_block_1_image IS NOT NULL;

INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id, content_block_2_title, content_block_2_subtitle, content_block_2_description, content_block_2_image, 2
FROM landing_pages
WHERE content_block_2_title IS NOT NULL OR content_block_2_description IS NOT NULL OR content_block_2_image IS NOT NULL;

INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id, content_block_3_title, content_block_3_subtitle, content_block_3_description, content_block_3_image, 3
FROM landing_pages
WHERE content_block_3_title IS NOT NULL OR content_block_3_description IS NOT NULL OR content_block_3_image IS NOT NULL;

INSERT INTO landing_page_content_blocks (landing_page_id, title, subtitle, description, image, display_order)
SELECT id, content_block_4_title, content_block_4_subtitle, content_block_4_description, content_block_4_image, 4
FROM landing_pages
WHERE content_block_4_title IS NOT NULL OR content_block_4_description IS NOT NULL OR content_block_4_image IS NOT NULL;

-- Drop old columns (commented out for safety - uncomment after verifying data migration)
-- ALTER TABLE landing_pages 
-- DROP COLUMN content_block_1_title,
-- DROP COLUMN content_block_1_subtitle,
-- DROP COLUMN content_block_1_description,
-- DROP COLUMN content_block_1_image,
-- DROP COLUMN content_block_2_title,
-- DROP COLUMN content_block_2_subtitle,
-- DROP COLUMN content_block_2_description,
-- DROP COLUMN content_block_2_image,
-- DROP COLUMN content_block_3_title,
-- DROP COLUMN content_block_3_subtitle,
-- DROP COLUMN content_block_3_description,
-- DROP COLUMN content_block_3_image,
-- DROP COLUMN content_block_4_title,
-- DROP COLUMN content_block_4_subtitle,
-- DROP COLUMN content_block_4_description,
-- DROP COLUMN content_block_4_image;
