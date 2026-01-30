-- ============================================================================
-- DALILA PROPERTY MANAGEMENT SYSTEM - TRIGGERS & STORED PROCEDURES
-- ============================================================================
-- Version: 2.0.0
-- Date: 2026-01-30
-- ============================================================================

DELIMITER $$

-- ============================================================================
-- FUNCTION: Generate Property ID Reference
-- ============================================================================
-- Generates unique property reference like: PROP-2026-001, PROP-2026-002, etc.
-- ============================================================================
DROP FUNCTION IF EXISTS `generate_property_id`$$

CREATE FUNCTION `generate_property_id`()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE next_num INT;
    DECLARE current_year VARCHAR(4);
    DECLARE new_id VARCHAR(50);
    
    SET current_year = YEAR(NOW());
    
    -- Find the highest number for the current year
    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(property_id_reference, '-', -1) AS UNSIGNED)), 0) + 1
    INTO next_num
    FROM properties
    WHERE property_id_reference LIKE CONCAT('PROP-', current_year, '-%');
    
    -- Generate the new ID with zero-padding (3 digits)
    SET new_id = CONCAT('PROP-', current_year, '-', LPAD(next_num, 3, '0'));
    
    RETURN new_id;
END$$

-- ============================================================================
-- TRIGGER: Auto-generate property ID on INSERT
-- ============================================================================
DROP TRIGGER IF EXISTS `before_property_insert`$$

CREATE TRIGGER `before_property_insert`
BEFORE INSERT ON `properties`
FOR EACH ROW
BEGIN
    -- Generate property_id_reference if not provided
    IF NEW.property_id_reference IS NULL OR NEW.property_id_reference = '' THEN
        SET NEW.property_id_reference = generate_property_id();
    END IF;
    
    -- Calculate sqft from sqm (1 sqm = 10.7639 sqft)
    IF NEW.sqm IS NOT NULL AND NEW.sqm > 0 THEN
        SET NEW.sqft = ROUND(NEW.sqm * 10.7639, 2);
    END IF;
    
    -- Calculate price_mxn from price_usd using exchange_rate
    IF NEW.price_usd IS NOT NULL AND NEW.price_usd > 0 THEN
        IF NEW.exchange_rate IS NULL OR NEW.exchange_rate <= 0 THEN
            SET NEW.exchange_rate = 18.50; -- Default rate
        END IF;
        SET NEW.price_mxn = ROUND(NEW.price_usd * NEW.exchange_rate, 2);
    END IF;
    
    -- Initialize views_count
    IF NEW.views_count IS NULL THEN
        SET NEW.views_count = 0;
    END IF;
    
    -- Initialize order if not set
    IF NEW.`order` IS NULL THEN
        SET NEW.`order` = 0;
    END IF;
END$$

-- ============================================================================
-- TRIGGER: Auto-update calculations on UPDATE
-- ============================================================================
DROP TRIGGER IF EXISTS `before_property_update`$$

CREATE TRIGGER `before_property_update`
BEFORE UPDATE ON `properties`
FOR EACH ROW
BEGIN
    -- Recalculate sqft if sqm changes
    IF NEW.sqm IS NOT NULL AND NEW.sqm > 0 AND (OLD.sqm IS NULL OR NEW.sqm <> OLD.sqm) THEN
        SET NEW.sqft = ROUND(NEW.sqm * 10.7639, 2);
    END IF;
    
    -- Recalculate price_mxn if price_usd or exchange_rate changes
    IF NEW.price_usd IS NOT NULL AND NEW.price_usd > 0 THEN
        IF NEW.exchange_rate IS NULL OR NEW.exchange_rate <= 0 THEN
            SET NEW.exchange_rate = 18.50;
        END IF;
        IF OLD.price_usd IS NULL OR NEW.price_usd <> OLD.price_usd OR 
           OLD.exchange_rate IS NULL OR NEW.exchange_rate <> OLD.exchange_rate THEN
            SET NEW.price_mxn = ROUND(NEW.price_usd * NEW.exchange_rate, 2);
        END IF;
    END IF;
END$$

-- ============================================================================
-- TRIGGER: Auto-set first photo as cover
-- ============================================================================
DROP TRIGGER IF EXISTS `after_property_photos_insert`$$

CREATE TRIGGER `after_property_photos_insert`
AFTER INSERT ON `property_photos`
FOR EACH ROW
BEGIN
    DECLARE photo_count INT;
    
    -- Count photos for this property
    SELECT COUNT(*) INTO photo_count
    FROM property_photos
    WHERE property_id = NEW.property_id;
    
    -- If this is the first photo, make it the cover
    IF photo_count = 1 THEN
        UPDATE property_photos
        SET is_cover = 1, `order` = 1
        WHERE id = NEW.id;
    END IF;
END$$

-- ============================================================================
-- TRIGGER: Clean up old sessions (optional - runs on insert)
-- ============================================================================
DROP TRIGGER IF EXISTS `after_session_insert`$$

CREATE TRIGGER `after_session_insert`
AFTER INSERT ON `sessions`
FOR EACH ROW
BEGIN
    -- Delete expired sessions older than 30 days
    DELETE FROM sessions
    WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$

DELIMITER ;

-- ============================================================================
-- STORED PROCEDURE: Clean Expired Sessions
-- ============================================================================
-- Run this procedure periodically (e.g., daily cron job)
-- ============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `clean_expired_sessions`$$

CREATE PROCEDURE `clean_expired_sessions`()
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
    SELECT ROW_COUNT() AS deleted_sessions;
END$$

DELIMITER ;

-- ============================================================================
-- STORED PROCEDURE: Soft Delete Property
-- ============================================================================
-- Marks property as deleted without removing from database
-- ============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `soft_delete_property`$$

CREATE PROCEDURE `soft_delete_property`(IN prop_id INT UNSIGNED)
BEGIN
    UPDATE properties
    SET deleted_at = NOW(), is_active = 0
    WHERE id = prop_id AND deleted_at IS NULL;
    
    SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;

-- ============================================================================
-- STORED PROCEDURE: Restore Soft Deleted Property
-- ============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `restore_property`$$

CREATE PROCEDURE `restore_property`(IN prop_id INT UNSIGNED)
BEGIN
    UPDATE properties
    SET deleted_at = NULL
    WHERE id = prop_id AND deleted_at IS NOT NULL;
    
    SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;

-- ============================================================================
-- STORED PROCEDURE: Get Property Statistics
-- ============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `get_property_stats`$$

CREATE PROCEDURE `get_property_stats`()
BEGIN
    SELECT 
        COUNT(*) AS total_properties,
        SUM(CASE WHEN is_active = 1 AND deleted_at IS NULL THEN 1 ELSE 0 END) AS active_properties,
        SUM(CASE WHEN status = 'for_sale' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS for_sale,
        SUM(CASE WHEN status = 'sold' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS sold,
        SUM(CASE WHEN status = 'reserved' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS reserved,
        SUM(CASE WHEN property_type = 'active' THEN 1 ELSE 0 END) AS active_type,
        SUM(CASE WHEN property_type = 'development' THEN 1 ELSE 0 END) AS development_type,
        SUM(CASE WHEN featured = 1 AND deleted_at IS NULL THEN 1 ELSE 0 END) AS featured,
        SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS soft_deleted,
        AVG(price_usd) AS avg_price_usd,
        MAX(price_usd) AS max_price_usd,
        MIN(price_usd) AS min_price_usd
    FROM properties;
END$$

DELIMITER ;

-- ============================================================================
-- END OF TRIGGERS & PROCEDURES
-- ============================================================================
