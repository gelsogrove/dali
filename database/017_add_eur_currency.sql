-- Add EUR currency support
-- This migration adds EUR as a third base currency option

-- 1. Modify price_base_currency ENUM to include EUR
ALTER TABLE `properties` 
MODIFY COLUMN `price_base_currency` ENUM('USD', 'MXN', 'EUR') DEFAULT 'USD';

-- 2. Add EUR price columns (single price for active properties)
ALTER TABLE `properties` 
ADD COLUMN `price_eur` DECIMAL(15,2) NULL AFTER `price_mxn`;

-- 3. Add EUR price range columns (for developments)
ALTER TABLE `properties` 
ADD COLUMN `price_from_eur` DECIMAL(15,2) NULL AFTER `price_from_mxn`,
ADD COLUMN `price_to_eur` DECIMAL(15,2) NULL AFTER `price_to_mxn`;

-- 4. Add EUR to exchange_rates table currency pairs
-- The exchange_rates table already supports any currency pair
-- We just need to add USD→EUR and EUR→MXN rates

-- Insert default USD→EUR rate (1 USD = 0.92 EUR approximately)
INSERT INTO `exchange_rates` (`currency_from`, `currency_to`, `rate`, `date`, `is_active`)
VALUES ('USD', 'EUR', 0.92, CURDATE(), 1)
ON DUPLICATE KEY UPDATE 
  `rate` = VALUES(`rate`),
  `is_active` = 1,
  `updated_at` = CURRENT_TIMESTAMP;

-- Insert default EUR→MXN rate (1 EUR = 19.10 MXN approximately, based on EUR≈1.09 USD and USD=17.5 MXN)
INSERT INTO `exchange_rates` (`currency_from`, `currency_to`, `rate`, `date`, `is_active`)
VALUES ('EUR', 'MXN', 19.10, CURDATE(), 1)
ON DUPLICATE KEY UPDATE 
  `rate` = VALUES(`rate`),
  `is_active` = 1,
  `updated_at` = CURRENT_TIMESTAMP;

-- Note: The system will calculate cross-rates automatically
-- EUR→USD will be calculated as 1/0.92 = 1.087
-- MXN→EUR will be calculated as 1/19.10 = 0.052
