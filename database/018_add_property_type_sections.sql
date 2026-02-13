-- ============================================================================
-- ADD NEW PROPERTY TYPE SECTIONS
-- Hot Deals, Off Market, Land
-- Date: 2026-02-12
-- ============================================================================

ALTER TABLE `properties`
  MODIFY COLUMN `property_type` ENUM('active', 'development', 'hot_deal', 'off_market', 'land')
  NOT NULL DEFAULT 'active';

-- Optional: backfill land properties if needed (manual)
-- UPDATE properties SET property_type = 'land' WHERE property_category = 'land';
