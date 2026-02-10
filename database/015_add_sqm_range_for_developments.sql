-- ============================================================================
-- Add SQM/SQFT Range Fields for Developments
-- ============================================================================
-- Version: 015
-- Date: 2026-02-07
-- Description: Aggiunge campi per range di metratura nei developments
-- ============================================================================

-- Add range fields for square meters (developments)
ALTER TABLE `properties`
ADD COLUMN `sqm_min` DECIMAL(10,2) NULL COMMENT 'Minimum sqm for developments' AFTER `sqft`,
ADD COLUMN `sqm_max` DECIMAL(10,2) NULL COMMENT 'Maximum sqm for developments' AFTER `sqm_min`,
ADD COLUMN `sqft_min` DECIMAL(10,2) NULL COMMENT 'Auto-calculated from sqm_min' AFTER `sqm_max`,
ADD COLUMN `sqft_max` DECIMAL(10,2) NULL COMMENT 'Auto-calculated from sqft_max' AFTER `sqft_min`;

-- Add indexes for range queries
ALTER TABLE `properties`
ADD INDEX `idx_sqm_min` (`sqm_min`),
ADD INDEX `idx_sqm_max` (`sqm_max`);

-- ============================================================================
-- Comentarios sobre el uso:
-- ============================================================================
-- 1. Para "Active Properties": usar sqm y sqft (valores únicos)
-- 2. Para "Developments": usar sqm_min/sqm_max y sqft_min/sqft_max (rangos)
-- 3. La conversión m² ↔ sq ft es automática en el form admin
--    Fórmula: 1 m² = 10.7639 sq ft
-- ============================================================================
