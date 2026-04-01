-- ============================================================================
-- Add DELIVERY field for NEW DEVELOPMENTS
-- ============================================================================
-- Version: 037
-- Date: 2026-03-23
-- Description: Aggiunge campo per data di consegna (delivery)
-- ============================================================================

ALTER TABLE `properties` 
ADD COLUMN IF NOT EXISTS `delivery` VARCHAR(255) DEFAULT NULL 
  COMMENT 'Delivery info for developments (e.g., Q4 2025, Immediate, etc.)'
AFTER `internal_notes`;
