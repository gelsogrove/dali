-- ============================================================================
-- DALILA PROPERTIES - COMPLETE UPGRADE MIGRATION
-- ============================================================================
-- Date: 2026-02-04
-- Version: 2.1.0
-- Description: Upgrade completo per gestione New Developments
--
-- Features Incluse:
-- 1. Property Categories Multiple (per developments)
-- 2. Price Base Currency (USD/MXN toggle)
-- 3. Bedrooms/Bathrooms Range (per developments)
-- 4. Tags/Amenities illimitati (già implementato, no DB changes)
--
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- PARTE 1: PROPERTY CATEGORIES MULTIPLE
-- ============================================================================
-- Per developments: permettere selezione multipla di categorie
-- (es. un development può avere Apartment + Penthouse + Villa)

-- Creare tabella relazione many-to-many
CREATE TABLE IF NOT EXISTS `property_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `property_id` INT UNSIGNED NOT NULL,
  `category` ENUM('apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_property_category` (`property_id`, `category`),
  INDEX `idx_property` (`property_id`),
  INDEX `idx_category` (`category`),
  CONSTRAINT `fk_property_categories_property` 
    FOREIGN KEY (`property_id`) 
    REFERENCES `properties` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Multiple categories for development properties';

-- Rendere property_category NULL (active properties usano questo, developments usano la tabella)
ALTER TABLE `properties` 
MODIFY COLUMN `property_category` ENUM('apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial') NULL
COMMENT 'Single category for active properties. Developments use property_categories table';

-- Migrare dati esistenti per developments
INSERT INTO `property_categories` (`property_id`, `category`)
SELECT `id`, `property_category` 
FROM `properties` 
WHERE `property_type` = 'development' 
  AND `property_category` IS NOT NULL
ON DUPLICATE KEY UPDATE `category` = VALUES(`category`);

-- ============================================================================
-- PARTE 2: PRICE BASE CURRENCY (USD/MXN)
-- ============================================================================
-- Permettere inserimento prezzi in MXN con conversione automatica

-- Aggiungere colonna base currency
ALTER TABLE `properties` 
ADD COLUMN IF NOT EXISTS `price_base_currency` ENUM('USD', 'MXN') DEFAULT 'USD' 
  COMMENT 'Primary currency for price input (USD or MXN)'
AFTER `exchange_rate`;

-- Aggiungere colonne MXN per developments
ALTER TABLE `properties` 
ADD COLUMN IF NOT EXISTS `price_from_mxn` DECIMAL(15,2) DEFAULT NULL 
  COMMENT 'Starting price in MXN for developments'
AFTER `price_to_usd`,
ADD COLUMN IF NOT EXISTS `price_to_mxn` DECIMAL(15,2) DEFAULT NULL 
  COMMENT 'Max price in MXN for developments'
AFTER `price_from_mxn`;

-- Drop vecchi trigger se esistono
DROP TRIGGER IF EXISTS properties_price_calculation;
DROP TRIGGER IF EXISTS properties_price_update;
DROP TRIGGER IF EXISTS properties_price_calculation_bidirectional;
DROP TRIGGER IF EXISTS properties_price_update_bidirectional;

-- Creare trigger bidirezionale INSERT
DELIMITER $$

CREATE TRIGGER properties_price_calculation_bidirectional
BEFORE INSERT ON properties
FOR EACH ROW
BEGIN
    -- Validazione exchange rate (richiesto per conversioni)
    IF NEW.exchange_rate IS NULL OR NEW.exchange_rate <= 0 THEN
        -- Fallback conservativo solo se manca
        SET NEW.exchange_rate = 20.0;
    END IF;
    
    -- Default base currency
    IF NEW.price_base_currency IS NULL THEN
        SET NEW.price_base_currency = 'USD';
    END IF;
    
    -- Skip se price_on_demand
    IF NEW.price_on_demand = 0 OR NEW.price_on_demand IS NULL THEN
        
        -- Base Currency = USD: calcolare MXN da USD
        IF NEW.price_base_currency = 'USD' THEN
            IF NEW.price_usd IS NOT NULL AND NEW.price_usd > 0 THEN
                SET NEW.price_mxn = ROUND(NEW.price_usd * NEW.exchange_rate, 2);
            END IF;
            
            IF NEW.price_from_usd IS NOT NULL AND NEW.price_from_usd > 0 THEN
                SET NEW.price_from_mxn = ROUND(NEW.price_from_usd * NEW.exchange_rate, 2);
            END IF;
            
            IF NEW.price_to_usd IS NOT NULL AND NEW.price_to_usd > 0 THEN
                SET NEW.price_to_mxn = ROUND(NEW.price_to_usd * NEW.exchange_rate, 2);
            END IF;
        END IF;
        
        -- Base Currency = MXN: calcolare USD da MXN
        IF NEW.price_base_currency = 'MXN' THEN
            IF NEW.price_mxn IS NOT NULL AND NEW.price_mxn > 0 THEN
                SET NEW.price_usd = ROUND(NEW.price_mxn / NEW.exchange_rate, 2);
            END IF;
            
            IF NEW.price_from_mxn IS NOT NULL AND NEW.price_from_mxn > 0 THEN
                SET NEW.price_from_usd = ROUND(NEW.price_from_mxn / NEW.exchange_rate, 2);
            END IF;
            
            IF NEW.price_to_mxn IS NOT NULL AND NEW.price_to_mxn > 0 THEN
                SET NEW.price_to_usd = ROUND(NEW.price_to_mxn / NEW.exchange_rate, 2);
            END IF;
        END IF;
        
    END IF;
    
    -- Auto-calcolare sqft da sqm
    IF NEW.sqm IS NOT NULL AND NEW.sqm > 0 THEN
        SET NEW.sqft = ROUND(NEW.sqm * 10.764, 2);
    END IF;
END$$

DELIMITER ;

-- Creare trigger bidirezionale UPDATE
DELIMITER $$

CREATE TRIGGER properties_price_update_bidirectional
BEFORE UPDATE ON properties
FOR EACH ROW
BEGIN
    -- Validazione exchange rate (richiesto per conversioni)
    IF NEW.exchange_rate IS NULL OR NEW.exchange_rate <= 0 THEN
        -- Fallback conservativo solo se manca
        SET NEW.exchange_rate = 20.0;
    END IF;
    
    -- Skip se price_on_demand
    IF NEW.price_on_demand = 0 OR NEW.price_on_demand IS NULL THEN
        
        -- Base Currency = USD
        IF NEW.price_base_currency = 'USD' THEN
            IF NEW.price_usd != OLD.price_usd OR NEW.exchange_rate != OLD.exchange_rate THEN
                IF NEW.price_usd IS NOT NULL AND NEW.price_usd > 0 THEN
                    SET NEW.price_mxn = ROUND(NEW.price_usd * NEW.exchange_rate, 2);
                END IF;
            END IF;
            
            IF NEW.price_from_usd != OLD.price_from_usd OR NEW.exchange_rate != OLD.exchange_rate THEN
                IF NEW.price_from_usd IS NOT NULL AND NEW.price_from_usd > 0 THEN
                    SET NEW.price_from_mxn = ROUND(NEW.price_from_usd * NEW.exchange_rate, 2);
                END IF;
            END IF;
            
            IF NEW.price_to_usd != OLD.price_to_usd OR NEW.exchange_rate != OLD.exchange_rate THEN
                IF NEW.price_to_usd IS NOT NULL AND NEW.price_to_usd > 0 THEN
                    SET NEW.price_to_mxn = ROUND(NEW.price_to_usd * NEW.exchange_rate, 2);
                END IF;
            END IF;
        END IF;
        
        -- Base Currency = MXN
        IF NEW.price_base_currency = 'MXN' THEN
            IF NEW.price_mxn != OLD.price_mxn OR NEW.exchange_rate != OLD.exchange_rate THEN
                IF NEW.price_mxn IS NOT NULL AND NEW.price_mxn > 0 THEN
                    SET NEW.price_usd = ROUND(NEW.price_mxn / NEW.exchange_rate, 2);
                END IF;
            END IF;
            
            IF NEW.price_from_mxn != OLD.price_from_mxn OR NEW.exchange_rate != OLD.exchange_rate THEN
                IF NEW.price_from_mxn IS NOT NULL AND NEW.price_from_mxn > 0 THEN
                    SET NEW.price_from_usd = ROUND(NEW.price_from_mxn / NEW.exchange_rate, 2);
                END IF;
            END IF;
            
            IF NEW.price_to_mxn != OLD.price_to_mxn OR NEW.exchange_rate != OLD.exchange_rate THEN
                IF NEW.price_to_mxn IS NOT NULL AND NEW.price_to_mxn > 0 THEN
                    SET NEW.price_to_usd = ROUND(NEW.price_to_mxn / NEW.exchange_rate, 2);
                END IF;
            END IF;
        END IF;
        
    END IF;
    
    -- Auto-calcolare sqft da sqm
    IF NEW.sqm IS NOT NULL AND NEW.sqm > 0 AND NEW.sqm != OLD.sqm THEN
        SET NEW.sqft = ROUND(NEW.sqm * 10.764, 2);
    END IF;
END$$

DELIMITER ;

-- Set default per properties esistenti
UPDATE `properties` 
SET `price_base_currency` = 'USD' 
WHERE `price_base_currency` IS NULL;

-- ============================================================================
-- PARTE 3: BEDROOMS/BATHROOMS RANGE
-- ============================================================================
-- Per developments: permettere range (es. Studio to 3 bedrooms)

-- Aggiungere colonne range bedrooms
ALTER TABLE `properties` 
ADD COLUMN IF NOT EXISTS `bedrooms_min` ENUM('studio', '1', '2', '3', '4', '5+') DEFAULT NULL 
  COMMENT 'Minimum bedrooms for developments'
AFTER `bedrooms`,
ADD COLUMN IF NOT EXISTS `bedrooms_max` ENUM('studio', '1', '2', '3', '4', '5+') DEFAULT NULL 
  COMMENT 'Maximum bedrooms for developments'
AFTER `bedrooms_min`;

-- Aggiungere colonne range bathrooms
ALTER TABLE `properties` 
ADD COLUMN IF NOT EXISTS `bathrooms_min` ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') DEFAULT NULL 
  COMMENT 'Minimum bathrooms for developments'
AFTER `bathrooms`,
ADD COLUMN IF NOT EXISTS `bathrooms_max` ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') DEFAULT NULL 
  COMMENT 'Maximum bathrooms for developments'
AFTER `bathrooms_min`;

-- Aggiungere indici per filtraggio
ALTER TABLE `properties` 
ADD INDEX IF NOT EXISTS `idx_bedrooms_min` (`bedrooms_min`),
ADD INDEX IF NOT EXISTS `idx_bedrooms_max` (`bedrooms_max`),
ADD INDEX IF NOT EXISTS `idx_bathrooms_min` (`bathrooms_min`),
ADD INDEX IF NOT EXISTS `idx_bathrooms_max` (`bathrooms_max`);

-- ============================================================================
-- VERIFICATION & TESTING
-- ============================================================================
-- Query di verifica (commentate, eseguire manualmente se necessario)

-- Verificare property_categories table
-- SELECT COUNT(*) FROM property_categories;

-- Verificare developments con categorie multiple
-- SELECT p.id, p.title, p.property_type, GROUP_CONCAT(pc.category) as categories
-- FROM properties p
-- LEFT JOIN property_categories pc ON p.id = pc.property_id
-- WHERE p.property_type = 'development'
-- GROUP BY p.id LIMIT 10;

-- Verificare nuove colonne esistono
-- SHOW COLUMNS FROM properties WHERE 
--   Field LIKE '%price%' OR 
--   Field LIKE '%bedroom%' OR 
--   Field LIKE '%bathroom%';

-- Verificare trigger
-- SHOW TRIGGERS LIKE 'properties';

-- Test conversione MXN → USD
-- INSERT INTO properties (slug, title, property_type, city, country, price_base_currency, price_mxn, exchange_rate)
-- VALUES ('test-mxn', 'Test MXN', 'active', 'Test', 'Mexico', 'MXN', 5000000, 18.5);
-- SELECT title, price_base_currency, price_mxn, price_usd, ROUND(price_mxn / exchange_rate, 2) as expected_usd
-- FROM properties WHERE slug = 'test-mxn';
-- DELETE FROM properties WHERE slug = 'test-mxn';

-- Test development con range
-- INSERT INTO properties (slug, title, property_type, city, country, bedrooms_min, bedrooms_max, bathrooms_min, bathrooms_max)
-- VALUES ('test-range', 'Test Range', 'development', 'Tulum', 'Mexico', 'studio', '3', '1', '3');
-- SELECT title, bedrooms_min, bedrooms_max, bathrooms_min, bathrooms_max FROM properties WHERE slug = 'test-range';
-- DELETE FROM properties WHERE slug = 'test-range';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- ROLLBACK (se necessario - ATTENZIONE: perderai i dati!)
-- ============================================================================
-- DROP TABLE IF EXISTS property_categories;
-- DROP TRIGGER IF EXISTS properties_price_calculation_bidirectional;
-- DROP TRIGGER IF EXISTS properties_price_update_bidirectional;
-- ALTER TABLE properties MODIFY COLUMN property_category ENUM(...) NOT NULL;
-- ALTER TABLE properties DROP COLUMN price_base_currency;
-- ALTER TABLE properties DROP COLUMN price_from_mxn;
-- ALTER TABLE properties DROP COLUMN price_to_mxn;
-- ALTER TABLE properties DROP COLUMN bedrooms_min;
-- ALTER TABLE properties DROP COLUMN bedrooms_max;
-- ALTER TABLE properties DROP COLUMN bathrooms_min;
-- ALTER TABLE properties DROP COLUMN bathrooms_max;

-- ============================================================================
-- MIGRATION COMPLETED
-- ============================================================================
-- Next steps:
-- 1. Restart API: docker-compose restart api
-- 2. Restart Admin: docker-compose restart admin
-- 3. Test creating a development with:
--    - Multiple categories (apartment + penthouse)
--    - Price in MXN
--    - Bedrooms range (studio to 3)
-- 4. Verify search/filters work correctly
