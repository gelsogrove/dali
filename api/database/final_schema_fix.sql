-- FINAL SCHEMA FIX FOR PROPERTIES TABLE
-- Adds range columns and other potentially missing fields

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `properties`
  -- Price ranges
  ADD COLUMN IF NOT EXISTS `price_from_usd` DECIMAL(15,2) NULL AFTER `price_usd`,
  ADD COLUMN IF NOT EXISTS `price_to_usd` DECIMAL(15,2) NULL AFTER `price_from_usd`,
  ADD COLUMN IF NOT EXISTS `price_from_mxn` DECIMAL(15,2) NULL AFTER `price_mxn`,
  ADD COLUMN IF NOT EXISTS `price_to_mxn` DECIMAL(15,2) NULL AFTER `price_from_mxn`,
  ADD COLUMN IF NOT EXISTS `price_from_eur` DECIMAL(15,2) NULL AFTER `price_eur`,
  ADD COLUMN IF NOT EXISTS `price_to_eur` DECIMAL(15,2) NULL AFTER `price_from_eur`,
  
  -- Beds/Baths ranges
  ADD COLUMN IF NOT EXISTS `bedrooms_min` ENUM('studio', '1', '2', '3', '4', '5+') NULL AFTER `bedrooms`,
  ADD COLUMN IF NOT EXISTS `bedrooms_max` ENUM('studio', '1', '2', '3', '4', '5+') NULL AFTER `bedrooms_min`,
  ADD COLUMN IF NOT EXISTS `bathrooms_min` ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') NULL AFTER `bathrooms`,
  ADD COLUMN IF NOT EXISTS `bathrooms_max` ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') NULL AFTER `bathrooms_min`,
  
  -- SQM/SQFT ranges
  ADD COLUMN IF NOT EXISTS `sqm_min` DECIMAL(10,2) NULL AFTER `sqft`,
  ADD COLUMN IF NOT EXISTS `sqm_max` DECIMAL(10,2) NULL AFTER `sqm_min`,
  ADD COLUMN IF NOT EXISTS `sqft_min` DECIMAL(10,2) NULL AFTER `sqm_max`,
  ADD COLUMN IF NOT EXISTS `sqft_max` DECIMAL(10,2) NULL AFTER `sqft_min`,
  
  -- Missing display fields
  ADD COLUMN IF NOT EXISTS `show_in_home` TINYINT(1) DEFAULT 0 AFTER `featured`,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 0 AFTER `id`;

SET FOREIGN_KEY_CHECKS = 1;
