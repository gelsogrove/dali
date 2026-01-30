-- Add show_in_home column to properties table
-- This allows marking properties to be featured on the homepage

ALTER TABLE properties 
ADD COLUMN show_in_home TINYINT(1) DEFAULT 0 AFTER `order`;

-- Optional: Update some existing properties to show in home
-- UPDATE properties SET show_in_home = 1 WHERE id IN (1, 2, 3);
