-- Migration: Add content blocks to landing pages
ALTER TABLE landing_pages ADD COLUMN content_block_1_title VARCHAR(255) AFTER content;
ALTER TABLE landing_pages ADD COLUMN content_block_1_description TEXT AFTER content_block_1_title;
ALTER TABLE landing_pages ADD COLUMN content_block_1_image VARCHAR(500) AFTER content_block_1_description;

ALTER TABLE landing_pages ADD COLUMN content_block_2_title VARCHAR(255) AFTER content_block_1_image;
ALTER TABLE landing_pages ADD COLUMN content_block_2_description TEXT AFTER content_block_2_title;
ALTER TABLE landing_pages ADD COLUMN content_block_2_image VARCHAR(500) AFTER content_block_2_description;

ALTER TABLE landing_pages ADD COLUMN content_block_3_title VARCHAR(255) AFTER content_block_2_image;
ALTER TABLE landing_pages ADD COLUMN content_block_3_description TEXT AFTER content_block_3_title;
ALTER TABLE landing_pages ADD COLUMN content_block_3_image VARCHAR(500) AFTER content_block_3_description;

ALTER TABLE landing_pages ADD COLUMN content_block_4_title VARCHAR(255) AFTER content_block_3_image;
ALTER TABLE landing_pages ADD COLUMN content_block_4_description TEXT AFTER content_block_4_title;
ALTER TABLE landing_pages ADD COLUMN content_block_4_image VARCHAR(500) AFTER content_block_4_description;
