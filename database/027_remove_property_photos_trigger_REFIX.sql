-- Remove problematic trigger on property_photos table (Refix with correct name)
-- The previous migration 009 had a singular/plural typo: after_property_photo_insert vs after_property_photos_insert
-- This trigger causes: "Can't update table 'property_photos' in stored function/trigger"

DROP TRIGGER IF EXISTS after_property_photos_insert;
DROP TRIGGER IF EXISTS after_property_photo_insert;
DROP TRIGGER IF EXISTS before_property_photos_insert;
DROP TRIGGER IF EXISTS before_property_photo_insert;
DROP TRIGGER IF EXISTS after_property_photos_update;
DROP TRIGGER IF EXISTS after_property_photo_update;
DROP TRIGGER IF EXISTS before_property_photos_update;
DROP TRIGGER IF EXISTS before_property_photo_update;
