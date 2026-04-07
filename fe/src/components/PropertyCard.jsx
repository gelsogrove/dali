import { Link } from 'react-router-dom';

export default function PropertyCard({ property }) {
  // Format price
  const getPrice = () => {
    if (property.price_on_demand) return 'Price On Demand';
    if (property.price_from_usd && property.price_to_usd) {
      return `$${property.price_from_usd.toLocaleString()} - $${property.price_to_usd.toLocaleString()} USD`;
    }
    if (property.price_usd) {
      return `$${property.price_usd.toLocaleString()} USD`;
    }
    return 'Contact for Price';
  };

  // Format size
  const getSize = () => {
    if (property.sqm) return `${property.sqm.toLocaleString()} m²`;
    if (property.sqft_min && property.sqft_max) return `${property.sqft_min}-${property.sqft_max} sq ft`;
    if (property.sqft) return `${property.sqft.toLocaleString()} sq ft`;
    return null;
  };

  return (
    <Link to={`/listings/${property.slug}/`} className="property-card block rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
      <div className="relative h-64">
        <img 
          src={property.cover_image_url} 
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-primary text-white px-3 py-1 rounded text-sm font-semibold">
          {property.status === 'sold' ? 'SOLD' : property.status === 'reserved' ? 'RESERVED' : 'FOR SALE'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-xl mb-2">{property.title}</h3>
        <p className="text-gray-600 mb-2">{property.neighborhood || property.city}</p>
        <div className="flex justify-between items-center">
          <span className="text-primary font-bold text-lg">{getPrice()}</span>
          {getSize() && <span className="text-gray-600 text-sm">{getSize()}</span>}
        </div>
        <div className="mt-2 flex gap-4 text-sm text-gray-600">
          {property.bedrooms && <span>🛏️ {property.bedrooms} beds</span>}
          {property.bathrooms && <span>🚿 {property.bathrooms} baths</span>}
        </div>
      </div>
    </Link>
  );
}
