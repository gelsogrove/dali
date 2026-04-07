-- Migration 042: Improve Landing Page Content Blocks
-- Add subtitle to each content block
-- Remove cover_image (will use content_block_1_image instead)

ALTER TABLE landing_pages 
ADD COLUMN content_block_1_subtitle TEXT AFTER content_block_1_title,
ADD COLUMN content_block_2_subtitle TEXT AFTER content_block_2_title,
ADD COLUMN content_block_3_subtitle TEXT AFTER content_block_3_title,
ADD COLUMN content_block_4_subtitle TEXT AFTER content_block_4_title;

-- Note: We keep cover_image for backward compatibility but will reference content_block_1_image in the app
