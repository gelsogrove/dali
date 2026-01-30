-- Add missing columns to property_photos table for production database
-- Execute one by one to avoid conflicts if some columns already exist

-- ADD COLUMN original_filename VARCHAR(255) DEFAULT NULL AFTER filename;
-- ADD COLUMN filepath VARCHAR(500) DEFAULT NULL AFTER original_filename;
-- ADD COLUMN filesize INT DEFAULT NULL AFTER `order`;
-- ADD COLUMN mime_type VARCHAR(50) DEFAULT NULL AFTER filesize;
-- ADD COLUMN width INT DEFAULT NULL AFTER mime_type;
-- ADD COLUMN height INT DEFAULT NULL AFTER width;

-- Execute only the ones that don't exist yet. Check your table first with:
-- DESCRIBE property_photos;
