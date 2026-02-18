-- FIX PROPERTIES TABLE SCHEMA
-- Adds all missing columns for production compatibility

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `properties`
  ADD COLUMN IF NOT EXISTS `property_id_reference` VARCHAR(50) NULL AFTER `id`,
  MODIFY COLUMN `property_type` ENUM('active', 'development', 'hot_deal', 'off_market', 'land') NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS `price_base_currency` ENUM('USD', 'MXN', 'EUR') DEFAULT 'USD' AFTER `price_mxn`,
  ADD COLUMN IF NOT EXISTS `exchange_rate` DECIMAL(10,4) DEFAULT 18.50 AFTER `price_base_currency`,
  ADD COLUMN IF NOT EXISTS `price_on_demand` TINYINT(1) DEFAULT 0 AFTER `price_to_eur`,
  ADD COLUMN IF NOT EXISTS `price_negotiable` TINYINT(1) DEFAULT 0 AFTER `price_on_demand`,
  ADD COLUMN IF NOT EXISTS `bedrooms_min` ENUM('studio', '1', '2', '3', '4', '5+') NULL AFTER `bedrooms`,
  ADD COLUMN IF NOT EXISTS `bedrooms_max` ENUM('studio', '1', '2', '3', '4', '5+') NULL AFTER `bedrooms_min`,
  ADD COLUMN IF NOT EXISTS `bathrooms_min` ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') NULL AFTER `bathrooms`,
  ADD COLUMN IF NOT EXISTS `bathrooms_max` ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') NULL AFTER `bathrooms_min`,
  ADD COLUMN IF NOT EXISTS `sqm` DECIMAL(10,2) NULL AFTER `square_feet`,
  ADD COLUMN IF NOT EXISTS `sqft` DECIMAL(10,2) NULL AFTER `sqm`,
  ADD COLUMN IF NOT EXISTS `lot_size_sqm` DECIMAL(10,2) NULL AFTER `lot_size`,
  ADD COLUMN IF NOT EXISTS `unit_typology` VARCHAR(255) NULL AFTER `year_built`,
  ADD COLUMN IF NOT EXISTS `furnishing_status` ENUM('furnished', 'semi-furnished', 'unfurnished') NULL AFTER `unit_typology`,
  ADD COLUMN IF NOT EXISTS `tags` TEXT NULL AFTER `furnishing_status`,
  ADD COLUMN IF NOT EXISTS `neighborhood` VARCHAR(255) NULL AFTER `address`,
  ADD COLUMN IF NOT EXISTS `country` VARCHAR(100) DEFAULT 'Mexico' AFTER `state`,
  ADD COLUMN IF NOT EXISTS `google_maps_url` TEXT NULL AFTER `longitude`,
  ADD COLUMN IF NOT EXISTS `internal_notes` TEXT NULL AFTER `show_in_home`,
  ADD COLUMN IF NOT EXISTS `deleted_at` DATETIME NULL AFTER `updated_at`;

-- Seed some test data if empty to avoid empty landing pages
INSERT INTO `cities` (`title`, `slug`, `is_home`) VALUES ('Tulum', 'tulum', 1), ('Playa del Carmen', 'playa-del-carmen', 1) 
ON DUPLICATE KEY UPDATE `is_home` = 1;

SET FOREIGN_KEY_CHECKS = 1;
