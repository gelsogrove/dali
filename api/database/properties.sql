-- ============================================
-- PROPERTIES MODULE - DATABASE MIGRATION
-- ============================================
-- Created: 2026-01-30
-- Description: Schema completo per gestione properties
-- Tables: properties, property_photos
-- ============================================

-- Drop tables if exist (per re-run puliti)
DROP TABLE IF EXISTS property_landing_pages;
DROP TABLE IF EXISTS property_photos;
DROP TABLE IF EXISTS properties;

-- ============================================
-- TABLE: properties
-- ============================================
CREATE TABLE properties (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Property Identification
    property_id_reference VARCHAR(50) UNIQUE NOT NULL COMMENT 'Auto-generated: PROP-2026-001',
    slug VARCHAR(255) UNIQUE NOT NULL COMMENT 'URL-friendly, auto-generated from title',
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) DEFAULT NULL,
    property_type ENUM('active', 'development') NOT NULL DEFAULT 'active' COMMENT 'Active Property | New Development',
    status ENUM('for_sale', 'sold', 'reserved') NOT NULL DEFAULT 'for_sale',
    property_category ENUM('apartment', 'house', 'villa', 'condo', 'penthouse', 'land', 'commercial') NOT NULL,
    
    -- Descriptions
    description TEXT DEFAULT NULL COMMENT 'Short description (textarea)',
    content LONGTEXT DEFAULT NULL COMMENT 'Rich text content (WYSIWYG)',
    
    -- Pricing
    price_usd DECIMAL(15,2) DEFAULT NULL,
    price_mxn DECIMAL(15,2) DEFAULT NULL COMMENT 'Auto-calculated from USD',
    exchange_rate DECIMAL(10,4) DEFAULT 17.5000 COMMENT 'Used for conversion',
    price_on_demand BOOLEAN DEFAULT FALSE,
    price_negotiable BOOLEAN DEFAULT FALSE,
    
    -- Development specific (if property_type = development)
    price_from_usd DECIMAL(15,2) DEFAULT NULL,
    price_to_usd DECIMAL(15,2) DEFAULT NULL,
    
    -- Property Characteristics
    bedrooms ENUM('studio', '1', '2', '3', '4', '5+') DEFAULT NULL,
    bathrooms ENUM('1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5+') DEFAULT NULL,
    sqm DECIMAL(10,2) DEFAULT NULL COMMENT 'Square meters',
    sqft DECIMAL(10,2) DEFAULT NULL COMMENT 'Auto-calculated from sqm',
    lot_size_sqm DECIMAL(10,2) DEFAULT NULL,
    year_built YEAR DEFAULT NULL,
    furnishing_status ENUM('furnished', 'semi-furnished', 'unfurnished') DEFAULT 'unfurnished',
    
    -- Location
    neighborhood VARCHAR(255) DEFAULT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) DEFAULT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Mexico',
    address TEXT DEFAULT NULL,
    latitude DECIMAL(10,8) DEFAULT NULL COMMENT 'Required for map',
    longitude DECIMAL(11,8) DEFAULT NULL COMMENT 'Required for map',
    google_maps_url TEXT DEFAULT NULL COMMENT 'Optional embed URL',
    
    -- Tags/Features (JSON)
    tags TEXT DEFAULT NULL COMMENT 'JSON array: ["Pool","Gym","Security"]',
    
    -- SEO
    seo_title VARCHAR(160) DEFAULT NULL,
    seo_description VARCHAR(320) DEFAULT NULL,
    og_title VARCHAR(160) DEFAULT NULL,
    og_description VARCHAR(320) DEFAULT NULL,
    
    -- Publishing
    is_active BOOLEAN DEFAULT FALSE COMMENT 'Published/Draft',
    featured BOOLEAN DEFAULT FALSE COMMENT 'Featured property',
    `order` INT DEFAULT 0 COMMENT 'Display order',
    views_count INT DEFAULT 0 COMMENT 'Page views counter',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_slug (slug),
    INDEX idx_property_type (property_type),
    INDEX idx_status (status),
    INDEX idx_category (property_category),
    INDEX idx_city (city),
    INDEX idx_country (country),
    INDEX idx_active (is_active),
    INDEX idx_featured (featured),
    INDEX idx_price (price_usd),
    INDEX idx_bedrooms (bedrooms),
    INDEX idx_created (created_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: property_photos
-- ============================================
CREATE TABLE property_photos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    filename VARCHAR(255) NOT NULL COMMENT 'Stored filename',
    original_filename VARCHAR(255) DEFAULT NULL,
    filepath VARCHAR(500) NOT NULL COMMENT 'Full path in uploads/',
    url TEXT NOT NULL COMMENT 'Public URL',
    alt_text VARCHAR(255) DEFAULT NULL,
    is_cover BOOLEAN DEFAULT FALSE COMMENT 'Main property image',
    `order` INT DEFAULT 0 COMMENT 'Display order in gallery',
    filesize INT DEFAULT NULL COMMENT 'Bytes',
    mime_type VARCHAR(50) DEFAULT NULL,
    width INT DEFAULT NULL,
    height INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_property (property_id),
    INDEX idx_cover (is_cover),
    INDEX idx_order (`order`)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLE: property_landing_pages (Many-to-Many)
-- ============================================
CREATE TABLE property_landing_pages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    property_id INT UNSIGNED NOT NULL,
    landing_page_slug VARCHAR(255) NOT NULL COMMENT 'Landing page slug (e.g., tulum, playa-del-carmen)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    INDEX idx_property (property_id),
    INDEX idx_landing_slug (landing_page_slug),
    UNIQUE KEY unique_property_landing (property_id, landing_page_slug) COMMENT 'Prevent duplicate associations'
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STORED PROCEDURE: Generate Property ID
-- ============================================
DROP PROCEDURE IF EXISTS generate_property_id;

DELIMITER //

CREATE PROCEDURE generate_property_id(OUT new_id VARCHAR(50))
BEGIN
    DECLARE year INT;
    DECLARE next_num INT;
    DECLARE padded_num VARCHAR(3);
    
    SET year = YEAR(NOW());
    
    -- Get next sequential number for current year
    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(property_id_reference, '-', -1) AS UNSIGNED)), 0) + 1 
    INTO next_num
    FROM properties
    WHERE property_id_reference LIKE CONCAT('PROP-', year, '-%');
    
    -- Pad with zeros (001, 002, etc.)
    SET padded_num = LPAD(next_num, 3, '0');
    
    -- Generate final ID: PROP-2026-001
    SET new_id = CONCAT('PROP-', year, '-', padded_num);
END//

DELIMITER ;

-- ============================================
-- TRIGGER: Auto-generate property_id_reference
-- ============================================
DELIMITER //

CREATE TRIGGER before_property_insert 
BEFORE INSERT ON properties
FOR EACH ROW
BEGIN
    DECLARE new_prop_id VARCHAR(50);
    
    -- Generate property ID if not provided
    IF NEW.property_id_reference IS NULL OR NEW.property_id_reference = '' THEN
        CALL generate_property_id(new_prop_id);
        SET NEW.property_id_reference = new_prop_id;
    END IF;
    
    -- Auto-calculate SQFT from SQM if not provided
    IF NEW.sqm IS NOT NULL AND (NEW.sqft IS NULL OR NEW.sqft = 0) THEN
        SET NEW.sqft = NEW.sqm * 10.7639;
    END IF;
    
    -- Auto-calculate MXN from USD if not provided
    IF NEW.price_usd IS NOT NULL AND (NEW.price_mxn IS NULL OR NEW.price_mxn = 0) THEN
        SET NEW.price_mxn = NEW.price_usd * NEW.exchange_rate;
    END IF;
END//

DELIMITER ;

-- ============================================
-- TRIGGER: Update calculations on UPDATE
-- ============================================
DELIMITER //

CREATE TRIGGER before_property_update 
BEFORE UPDATE ON properties
FOR EACH ROW
BEGIN
    -- Auto-calculate SQFT from SQM if changed
    IF NEW.sqm != OLD.sqm OR (NEW.sqm IS NOT NULL AND OLD.sqft IS NULL) THEN
        SET NEW.sqft = NEW.sqm * 10.7639;
    END IF;
    
    -- Auto-calculate MXN from USD if changed
    IF NEW.price_usd != OLD.price_usd OR NEW.exchange_rate != OLD.exchange_rate THEN
        SET NEW.price_mxn = NEW.price_usd * NEW.exchange_rate;
    END IF;
END//

DELIMITER ;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================
INSERT INTO properties (
    slug,
    title,
    subtitle,
    property_type,
    status,
    property_category,
    description,
    content,
    price_usd,
    exchange_rate,
    bedrooms,
    bathrooms,
    sqm,
    furnishing_status,
    neighborhood,
    city,
    country,
    latitude,
    longitude,
    tags,
    seo_title,
    seo_description,
    is_active,
    featured
) VALUES (
    'luxury-beachfront-villa-in-tulum',
    'Luxury Beachfront Villa in Tulum',
    'Modern 3BR villa with private pool and ocean views',
    'active',
    'for_sale',
    'villa',
    'Stunning beachfront villa located in the heart of Tulum, offering unparalleled luxury and breathtaking ocean views.',
    '<h2>Welcome to Paradise</h2><p>This exquisite villa features modern architecture, high-end finishes, and direct beach access. Perfect for those seeking a tropical retreat with all modern amenities.</p><ul><li>Private infinity pool</li><li>Gourmet kitchen</li><li>Smart home technology</li></ul>',
    850000.00,
    17.50,
    '3',
    '3.5',
    250.00,
    'furnished',
    'Tulum Beach',
    'Tulum',
    'Mexico',
    20.2114185,
    -87.4653502,
    '["Ocean View","Private Pool","Beach Access","Security 24/7","Smart Home","Rooftop Terrace","Garden"]',
    'Luxury Beachfront Villa in Tulum - 3BR with Pool | Dalila Real Estate',
    'Discover this stunning 3-bedroom beachfront villa in Tulum with private pool, ocean views, and modern amenities. Direct beach access in prime location.',
    TRUE,
    TRUE
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check table structure
-- DESCRIBE properties;
-- DESCRIBE property_photos;

-- Check triggers
-- SHOW TRIGGERS LIKE 'properties';

-- Test property_id generation
-- SELECT property_id_reference, title FROM properties;

-- Test JSON tags query
-- SELECT title, tags FROM properties WHERE JSON_CONTAINS(tags, '"Pool"');

-- ============================================
-- END OF MIGRATION
-- ============================================
