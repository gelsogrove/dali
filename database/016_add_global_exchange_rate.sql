-- ============================================================================
-- Global Exchange Rate System
-- ============================================================================
-- Version: 016
-- Date: 2026-02-07
-- Description: Sistema di exchange rate globale giornaliero
-- ============================================================================

-- Create table for global exchange rates
CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `currency_from` VARCHAR(3) NOT NULL DEFAULT 'USD',
  `currency_to` VARCHAR(3) NOT NULL DEFAULT 'MXN',
  `rate` DECIMAL(10,4) NOT NULL COMMENT 'Exchange rate value',
  `date` DATE NOT NULL COMMENT 'Date for this rate',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Currently active rate',
  `created_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_currency_date` (`currency_from`, `currency_to`, `date`),
  INDEX `idx_date` (`date`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_currencies` (`currency_from`, `currency_to`),
  
  FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Global exchange rates - one rate applies to all properties';

-- Insert default rate
INSERT INTO `exchange_rates` 
  (`currency_from`, `currency_to`, `rate`, `date`, `is_active`) 
VALUES 
  ('USD', 'MXN', 17.50, CURDATE(), 1)
ON DUPLICATE KEY UPDATE 
  `rate` = 17.50,
  `is_active` = 1;

-- ============================================================================
-- Migration Strategy
-- ============================================================================
-- OPZIONE 1: Mantenere exchange_rate nelle properties per storicità
--   - Le properties mantengono il rate con cui sono state create
--   - Utile per tracking storico e audit
--   - La conversione display usa sempre il rate globale attuale
--
-- OPZIONE 2: Rimuovere exchange_rate dalle properties
--   - Tutte le properties usano il rate globale
--   - Più semplice ma si perde la storicità
--
-- DECISIONE: Mantenere entrambi
--   - properties.exchange_rate = rate al momento della creazione (snapshot)
--   - exchange_rates.rate = rate globale attuale (usato per display/conversioni)
-- ============================================================================

-- Add comment to existing column
ALTER TABLE `properties` 
MODIFY COLUMN `exchange_rate` DECIMAL(10,4) NULL DEFAULT 18.50 
COMMENT 'Historical rate at property creation - for reference only';

-- ============================================================================
-- Usage Notes
-- ============================================================================
-- 1. Admin panel: un solo campo "Exchange Rate" che aggiorna la tabella globale
-- 2. Quando si crea/modifica una property, salvare il rate globale corrente
-- 3. Frontend: usare sempre il rate globale per le conversioni display
-- 4. API: endpoint GET /api/exchange-rate/current per ottenere il rate attuale
-- ============================================================================
