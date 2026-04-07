import { Link } from 'react-router-dom';
import ImageWithOverlay from './ImageWithOverlay';
import TitleHeader from './TitleHeader';
import { formatBedrooms, formatBathrooms, getShortSize, formatPrice } from '../utils/propertyFormatters';
import './PropertyGrid.css';

/**
 * Shared property grid used across landing pages, listing detail, etc.
 * Uses ImageWithOverlay for consistent card styling site-wide.
 *
 * Props:
 * - properties: array of property objects
 * - title: string (section title)
 * - subtitle: string (optional subtitle)
 */
export default function PropertyGrid({ properties = [], title, subtitle }) {
  if (!properties.length) return null;

  const getStatusLabel = (property) => {
    if (property.status === 'sold') return 'SOLD';
    if (property.status === 'reserved') return 'RESERVED';
    return 'FOR SALE';
  };

  return (
    <section className="property-grid-section">
      <div className="property-grid-container">
        {title && (
          <TitleHeader title={title} subtitle={subtitle} align="center" />
        )}
        <div className="property-grid">
          {properties.map((property) => (
            <div className="property-grid-item" key={property.id}>
              <Link to={`/listings/${property.slug}/`}>
                <ImageWithOverlay
                  src={property.cover_image_url}
                  alt={property.title}
                  beds={formatBedrooms(property)}
                  baths={formatBathrooms(property)}
                  size={getShortSize(property)}
                  status={getStatusLabel(property)}
                  location={[property.neighborhood, property.city].filter(Boolean).join(', ') || ''}
                >
                  <div className="property-price">
                    <h3>{formatPrice(property)}</h3>
                  </div>
                  <div className="property-title">
                    <h4>{property.title}</h4>
                  </div>
                </ImageWithOverlay>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
