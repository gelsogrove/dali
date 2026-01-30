-- Add missing columns to properties table
-- Execute these one by one, skipping those that give "Duplicate column" error

-- Location field
ALTER TABLE properties ADD COLUMN state VARCHAR(100) DEFAULT NULL AFTER city;

-- Price fields
ALTER TABLE properties ADD COLUMN price_mxn DECIMAL(15,2) DEFAULT NULL COMMENT 'Auto-calculated from USD' AFTER price_usd;
ALTER TABLE properties ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 17.5000 COMMENT 'Used for conversion' AFTER price_mxn;
ALTER TABLE properties ADD COLUMN price_negotiable BOOLEAN DEFAULT FALSE AFTER price_on_demand;
ALTER TABLE properties ADD COLUMN price_from_usd DECIMAL(15,2) DEFAULT NULL AFTER price_negotiable;
ALTER TABLE properties ADD COLUMN price_to_usd DECIMAL(15,2) DEFAULT NULL AFTER price_from_usd;

-- Property characteristics
ALTER TABLE properties ADD COLUMN sqft DECIMAL(10,2) DEFAULT NULL COMMENT 'Auto-calculated from sqm' AFTER sqm;

-- Already added in previous migration
-- ALTER TABLE properties ADD COLUMN show_in_home TINYINT(1) DEFAULT 0 AFTER `order`;

-- Publishing fields
ALTER TABLE properties ADD COLUMN views_count INT DEFAULT 0 COMMENT 'Page views counter' AFTER `order`;

-- Internal notes
ALTER TABLE properties ADD COLUMN internal_notes TEXT DEFAULT NULL COMMENT 'Private admin notes' AFTER og_description;
