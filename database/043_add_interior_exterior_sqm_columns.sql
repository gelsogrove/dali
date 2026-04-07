-- Migration 043: Add interior/exterior sqm and sqft columns
-- These columns are used to distinguish between interior and exterior sizes

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS interior_sqm DECIMAL(10,2) DEFAULT NULL AFTER sqft_max,
ADD COLUMN IF NOT EXISTS interior_sqft DECIMAL(10,2) DEFAULT NULL AFTER interior_sqm,
ADD COLUMN IF NOT EXISTS exterior_sqm DECIMAL(10,2) DEFAULT NULL AFTER interior_sqft,
ADD COLUMN IF NOT EXISTS exterior_sqft DECIMAL(10,2) DEFAULT NULL AFTER exterior_sqm;
