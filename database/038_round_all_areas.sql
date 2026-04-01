-- ============================================================================
-- Round all area measurements to integers (no decimals)
-- ============================================================================
-- Description: Arrotonda tutti i valori di mq e sqft per coerenza con la UX
-- ============================================================================

UPDATE `properties` 
SET 
  `sqm` = ROUND(`sqm`, 0),
  `sqft` = ROUND(`sqft`, 0),
  `sqm_min` = ROUND(`sqm_min`, 0),
  `sqm_max` = ROUND(`sqm_max`, 0),
  `sqft_min` = ROUND(`sqft_min`, 0),
  `sqft_max` = ROUND(`sqft_max`, 0),
  `lot_size_sqm` = ROUND(`lot_size_sqm`, 0),
  `lot_size_sqft` = ROUND(`lot_size_sqft`, 0),
  `lot_size_sqm_min` = ROUND(`lot_size_sqm_min`, 0),
  `lot_size_sqm_max` = ROUND(`lot_size_sqm_max`, 0),
  `lot_size_sqft_min` = ROUND(`lot_size_sqft_min`, 0),
  `lot_size_sqft_max` = ROUND(`lot_size_sqft_max`, 0);
