-- Remove problematic trigger on property_photos table
-- This trigger is causing: "Can't update table 'property_photos' in stored function/trigger"

DROP TRIGGER IF EXISTS after_property_photo_insert;
DROP TRIGGER IF EXISTS before_property_photo_insert;
DROP TRIGGER IF EXISTS after_property_photo_update;
DROP TRIGGER IF EXISTS before_property_photo_update;
