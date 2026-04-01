-- ============================================================================
-- Add LOT_SIZE_SQFT and Automatic Conversion Triggers
-- ============================================================================
-- Version: 036
-- Date: 2026-03-23
-- Description: Aggiunge campi per lotto in sqft e automatizza la conversione
-- ============================================================================

-- 1. Add columns for exterior/lot size in sqft
ALTER TABLE `properties` 
ADD COLUMN IF NOT EXISTS `lot_size_sqft` DECIMAL(10,2) DEFAULT NULL 
  COMMENT 'Auto-calculated from lot_size_sqm'
AFTER `lot_size_sqm`;

-- 2. Add range columns for lot size (for developments)
ALTER TABLE `properties`
ADD COLUMN IF NOT EXISTS `lot_size_sqm_min` DECIMAL(10,2) NULL AFTER `lot_size_sqft`,
ADD COLUMN IF NOT EXISTS `lot_size_sqm_max` DECIMAL(10,2) NULL AFTER `lot_size_sqm_min`,
ADD COLUMN IF NOT EXISTS `lot_size_sqft_min` DECIMAL(10,2) NULL AFTER `lot_size_sqm_max`,
ADD COLUMN IF NOT EXISTS `lot_size_sqft_max` DECIMAL(10,2) NULL AFTER `lot_size_sqft_min`;

-- 3. Drop and Recreate Triggers to include Lot Size conversion (1 m² = 10.7639 sqft)
DROP TRIGGER IF EXISTS properties_price_calculation_bidirectional;
DROP TRIGGER IF EXISTS properties_price_update_bidirectional;

DELIMITER $$

-- INSERT TRIGGER
CREATE TRIGGER properties_price_calculation_bidirectional
BEFORE INSERT ON properties
FOR EACH ROW
BEGIN
    -- Validazione exchange rate (richiesto per conversioni)
    IF NEW.exchange_rate IS NULL OR NEW.exchange_rate <= 0 THEN
        SET NEW.exchange_rate = 20.0;
    END IF;
    
    -- Default base currency
    IF NEW.price_base_currency IS NULL THEN
        SET NEW.price_base_currency = 'USD';
    END IF;
    
    -- Price Conversions
    IF NEW.price_on_demand = 0 OR NEW.price_on_demand IS NULL THEN
        -- Base Currency = USD
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
        
        -- Base Currency = MXN
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
    
    -- SQM to SQFT (Construction)
    IF NEW.sqm IS NOT NULL AND NEW.sqm > 0 THEN
        SET NEW.sqft = ROUND(NEW.sqm * 10.7639, 0);
    END IF;
    IF NEW.sqm_min IS NOT NULL AND NEW.sqm_min > 0 THEN
        SET NEW.sqft_min = ROUND(NEW.sqm_min * 10.7639, 0);
    END IF;
    IF NEW.sqm_max IS NOT NULL AND NEW.sqm_max > 0 THEN
        SET NEW.sqft_max = ROUND(NEW.sqm_max * 10.7639, 0);
    END IF;

    -- LOT SIZE SQM to SQFT (Land/Exterior)
    IF NEW.lot_size_sqm IS NOT NULL AND NEW.lot_size_sqm > 0 THEN
        SET NEW.lot_size_sqft = ROUND(NEW.lot_size_sqm * 10.7639, 0);
    END IF;
    IF NEW.lot_size_sqm_min IS NOT NULL AND NEW.lot_size_sqm_min > 0 THEN
        SET NEW.lot_size_sqft_min = ROUND(NEW.lot_size_sqm_min * 10.7639, 0);
    END IF;
    IF NEW.lot_size_sqm_max IS NOT NULL AND NEW.lot_size_sqm_max > 0 THEN
        SET NEW.lot_size_sqft_max = ROUND(NEW.lot_size_sqm_max * 10.7639, 0);
    END IF;
END$$

-- UPDATE TRIGGER
CREATE TRIGGER properties_price_update_bidirectional
BEFORE UPDATE ON properties
FOR EACH ROW
BEGIN
    -- Validazione exchange rate
    IF NEW.exchange_rate IS NULL OR NEW.exchange_rate <= 0 THEN
        SET NEW.exchange_rate = 20.0;
    END IF;
    
    -- Price Conversions
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
    
    -- SQM to SQFT (Construction)
    IF NEW.sqm IS NOT NULL AND NEW.sqm > 0 AND (NEW.sqm != OLD.sqm OR OLD.sqft IS NULL) THEN
        SET NEW.sqft = ROUND(NEW.sqm * 10.7639, 0);
    END IF;
    IF NEW.sqm_min IS NOT NULL AND NEW.sqm_min > 0 AND (NEW.sqm_min != OLD.sqm_min OR OLD.sqft_min IS NULL) THEN
        SET NEW.sqft_min = ROUND(NEW.sqm_min * 10.7639, 0);
    END IF;
    IF NEW.sqm_max IS NOT NULL AND NEW.sqm_max > 0 AND (NEW.sqm_max != OLD.sqm_max OR OLD.sqft_max IS NULL) THEN
        SET NEW.sqft_max = ROUND(NEW.sqm_max * 10.7639, 0);
    END IF;

    -- LOT SIZE SQM to SQFT (Land/Exterior)
    IF NEW.lot_size_sqm IS NOT NULL AND NEW.lot_size_sqm > 0 AND (NEW.lot_size_sqm != OLD.lot_size_sqm OR OLD.lot_size_sqft IS NULL) THEN
        SET NEW.lot_size_sqft = ROUND(NEW.lot_size_sqm * 10.7639, 0);
    END IF;
    IF NEW.lot_size_sqm_min IS NOT NULL AND NEW.lot_size_sqm_min > 0 AND (NEW.lot_size_sqm_min != OLD.lot_size_sqm_min OR OLD.lot_size_sqft_min IS NULL) THEN
        SET NEW.lot_size_sqft_min = ROUND(NEW.lot_size_sqm_min * 10.7639, 0);
    END IF;
    IF NEW.lot_size_sqm_max IS NOT NULL AND NEW.lot_size_sqm_max > 0 AND (NEW.lot_size_sqm_max != OLD.lot_size_sqm_max OR OLD.lot_size_sqft_max IS NULL) THEN
        SET NEW.lot_size_sqft_max = ROUND(NEW.lot_size_sqm_max * 10.7639, 0);
    END IF;
END$$

DELIMITER ;
