/**
 * Format property size based on property type
 * For active properties: show single value
 * For developments: show range
 * 
 * @param {Object} property - Property object
 * @returns {string} Formatted size string
 */
export function formatSize(property) {
  if (!property) return '';

  const isDevelopment = property.property_type === 'development';

  if (isDevelopment) {
    // Development: show range
    const hasSqmRange = property.sqm_min && property.sqm_max;
    const hasSqftRange = property.sqft_min && property.sqft_max;

    if (hasSqmRange) {
      const min = parseFloat(property.sqm_min);
      const max = parseFloat(property.sqm_max);
      const sqftMin = parseFloat(property.sqft_min);
      const sqftMax = parseFloat(property.sqft_max);

      return `${min.toFixed(0)} - ${max.toFixed(0)} m² (${sqftMin.toFixed(0)} - ${sqftMax.toFixed(0)} sq ft)`;
    }

    if (hasSqftRange) {
      const min = parseFloat(property.sqft_min);
      const max = parseFloat(property.sqft_max);
      return `${min.toFixed(0)} - ${max.toFixed(0)} sq ft`;
    }

    return '';
  } else {
    // Active property: show single value
    if (property.sqm && property.sqft) {
      const sqm = parseFloat(property.sqm);
      const sqft = parseFloat(property.sqft);
      return `${sqm.toFixed(0)} m² (${sqft.toFixed(0)} sq ft)`;
    }

    if (property.sqm) {
      return `${parseFloat(property.sqm).toFixed(0)} m²`;
    }

    if (property.sqft) {
      return `${parseFloat(property.sqft).toFixed(0)} sq ft`;
    }

    return '';
  }
}

/**
 * Get size value for simple display (just the number)
 * For active properties: return sqm
 * For developments: return sqm_min or null
 * 
 * @param {Object} property - Property object
 * @returns {number|null} Size value
 */
export function getSizeValue(property) {
  if (!property) return null;

  const isDevelopment = property.property_type === 'development';

  if (isDevelopment) {
    return property.sqm_min ? parseFloat(property.sqm_min) : null;
  }

  return property.sqm ? parseFloat(property.sqm) : null;
}

/**
 * Format bedrooms based on property type
 * For active properties: show single value
 * For developments: show range
 * 
 * @param {Object} property - Property object
 * @returns {string} Formatted bedrooms string
 */
export function formatBedrooms(property) {
  if (!property) return '';

  const isDevelopment = property.property_type === 'development';

  if (isDevelopment) {
    if (property.bedrooms_min && property.bedrooms_max) {
      return property.bedrooms_min === property.bedrooms_max
        ? property.bedrooms_min
        : `${property.bedrooms_min} - ${property.bedrooms_max}`;
    }
    return property.bedrooms_min || property.bedrooms_max || '';
  }

  return property.bedrooms || '';
}

/**
 * Format bathrooms based on property type
 * For active properties: show single value
 * For developments: show range
 * 
 * @param {Object} property - Property object
 * @returns {string} Formatted bathrooms string
 */
export function formatBathrooms(property) {
  if (!property) return '';

  const isDevelopment = property.property_type === 'development';

  if (isDevelopment) {
    if (property.bathrooms_min && property.bathrooms_max) {
      return property.bathrooms_min === property.bathrooms_max
        ? property.bathrooms_min
        : `${property.bathrooms_min} - ${property.bathrooms_max}`;
    }
    return property.bathrooms_min || property.bathrooms_max || '';
  }

  return property.bathrooms || '';
}

/**
 * Get a short size display for overlays (just m²)
 * 
 * @param {Object} property - Property object
 * @returns {string} Short size string
 */
export function getShortSize(property) {
  if (!property) return '';

  const isDevelopment = property.property_type === 'development';

  if (isDevelopment) {
    if (property.sqm_min && property.sqm_max) {
      const min = parseFloat(property.sqm_min).toFixed(0);
      const max = parseFloat(property.sqm_max).toFixed(0);
      return min === max ? min : `${min}-${max}`;
    }
    return property.sqm_min ? parseFloat(property.sqm_min).toFixed(0) : '';
  }

  return property.sqm ? parseFloat(property.sqm).toFixed(0) : '';
}

/**
 * Format price based on property type
 * For developments: show range (price_from_usd - price_to_usd)
 * For other types: show single price (price_usd)
 * 
 * @param {Object} property - Property object
 * @returns {string} Formatted price string
 */
export function formatPrice(property) {
  if (!property) return 'Contact for pricing';
  if (property.price_on_demand) return 'Price on Request';

  // Development: show from/to range
  if (property.property_type === 'development' && property.price_from_usd && property.price_to_usd) {
    return `USD ${Number(property.price_from_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })} - ${Number(property.price_to_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  // Non-development: show single price
  if (property.price_usd) {
    return `USD ${Number(property.price_usd).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  return 'Contact for pricing';
}
