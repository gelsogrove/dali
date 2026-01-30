import { useState, useEffect, useMemo } from 'react';
import PageHero from '../components/PageHero';
import ContactWithCta from '../components/ContactWithCta';
import TitleHeader from '../components/TitleHeader';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';
import ButtonDali from '../components/ButtonDali';
import { Link } from 'react-router-dom';
import { api, endpoints } from '../config/api';
import './SearchPage.css';

const COUNTRIES = {
  italy: { name: 'Italy', states: ['Florence', 'Milan', 'Venice'] },
  mexico: { name: 'Mexico', states: ['Quintana Roo', 'Yucatan'] },
  'united-states': { name: 'United States', states: ['Florida', 'New York'] }
};

const CITIES = {
  quintana_roo: ['Bacalar', 'Cancún', 'Playa del Carmen', 'Puerto Morelos', 'Tulum'],
  yucatan: ['Mérida'],
  florida: ['Miami', 'Naples', 'Orlando', 'Tampa', 'Key West'],
  'new-york': ['New York City', 'Buffalo', 'Albany'],
  milan: ['Milan', 'Monza', 'Como'],
  florence: ['Florence', 'Siena'],
  venice: ['Venice', 'Padua', 'Verona', 'Treviso']
};

const NEIGHBORHOODS = {
  tulum: ['Region 8', 'La Veleta', 'Hotel Zone', 'Downtown', 'Aldea Zama'],
  cancun: ['Costa Mujeres', 'Isla Dorada', 'Puerto Cancun'],
  'playa-del-carmen': ['Golden Zone', 'Playacar', 'Center', 'Corasol', 'Centro Maya'],
  miami: ['Brickell', 'Coconut Grove', 'Wynwood', 'South Beach']
};

const FEATURES = [
  '24/7 Security', 'Pool', 'Gym', 'Parking', 'Rooftop',
  'Beach Access', 'Concierge', 'Elevator', 'Garage', 'Spa',
  'Restaurant', 'Club House', 'Basement', 'Central AC', 'Fireplace',
  'Kids Playroom', 'Co-Working', 'Yoga Room', 'Sauna', 'Cinema'
];

const PRICE_OPTIONS = [
  '100000', '150000', '200000', '250000', '300000', '400000', '500000',
  '600000', '750000', '1000000', '1500000', '2000000', '3000000', '5000000',
  '7500000', '10000000', '15000000', '20000000', '30000000', '50000000'
];

export default function SearchPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = useMemo(() => apiBase.replace(/\/api$/, ''), [apiBase]);

  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${assetBase}${url}`;
  };

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    category: '',
    furnishing: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.furnishing) params.append('furnishing', filters.furnishing);
      
      const queryString = params.toString();
      const endpoint = queryString ? `${endpoints.properties}?${queryString}` : endpoints.properties;
      
      const response = await api.get(endpoint);
      
      if (!response?.success) {
        setError('Failed to load properties');
        setProperties([]);
      } else {
        const list = response?.data?.properties || [];
        setProperties(list);
        setShowResults(true);
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties. Please try again.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      search: '',
      status: '',
      type: '',
      category: '',
      furnishing: ''
    });
    setProperties([]);
    setShowResults(false);
    setError(null);
  };

  const handleBackToSearch = () => {
    setShowResults(false);
  };

  const getStates = () => {
    return filters.country && COUNTRIES[filters.country]
      ? COUNTRIES[filters.country].states
      : [];
  };

  const getCities = () => {
    if (!filters.state) return [];
    const stateKey = filters.state.toLowerCase().replace(/\s/g, '-');
    return CITIES[stateKey] || [];
  };

  const getNeighborhoods = () => {
    if (!filters.city) return [];
    const cityKey = filters.city.toLowerCase().replace(/\s/g, '-');
    return NEIGHBORHOODS[cityKey] || [];
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: filters.currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
      <SEO 
        title="Search Properties"
        description="Search luxury real estate in Riviera Maya, Tulum, Playa del Carmen. Filter by price, location, bedrooms, and amenities to find your dream property."
        keywords="search properties Riviera Maya, Tulum real estate search, property finder Playa del Carmen, luxury homes search Mexico"
        canonicalUrl="https://buywithdali.com/search"
      />
      <PageHero breadcrumb="» Search" />
      
      <section className="search-page">
        <div className="search-container">
          <div className="search-header">
            <TitleHeader kicker="Search" title="Properties" />
          </div>

          {!showResults ? (
            <form onSubmit={handleSubmit} className="search-form">
            {/* Currency */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  value={filters.currency}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="USD">USD ($)</option>
                  <option value="MXN">Mexican Peso (₱)</option>
                  <option value="EUR">Euros (€)</option>
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="minPrice">Min Price</label>
                <select
                  id="minPrice"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Any</option>
                  {PRICE_OPTIONS.map(price => (
                    <option key={price} value={price}>
                      {formatPrice(price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="maxPrice">Max Price</label>
                <select
                  id="maxPrice"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Any</option>
                  {PRICE_OPTIONS.map(price => (
                    <option key={price} value={price}>
                      {formatPrice(price)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  name="country"
                  value={filters.country}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">All Countries</option>
                  {Object.entries(COUNTRIES).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>
                <select
                  id="state"
                  name="state"
                  value={filters.state}
                  onChange={handleChange}
                  disabled={!filters.country}
                  className="form-input"
                >
                  <option value="">All States</option>
                  {getStates().map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">City</label>
                <select
                  id="city"
                  name="city"
                  value={filters.city}
                  onChange={handleChange}
                  disabled={!filters.state}
                  className="form-input"
                >
                  <option value="">All Cities</option>
                  {getCities().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="neighborhood">Neighborhood</label>
                <select
                  id="neighborhood"
                  name="neighborhood"
                  value={filters.neighborhood}
                  onChange={handleChange}
                  disabled={!filters.city}
                  className="form-input"
                >
                  <option value="">All Neighborhoods</option>
                  {getNeighborhoods().map(neighborhood => (
                    <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Beds & Baths */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="beds">Bedrooms</label>
                <select
                  id="beds"
                  name="beds"
                  value={filters.beds}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="baths">Bathrooms</label>
                <select
                  id="baths"
                  name="baths"
                  value={filters.baths}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
            </div>

            {/* Property Types */}
            <div className="form-section">
              <h3>Property Type</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="types"
                    value="active-properties"
                    checked={filters.types.includes('active-properties')}
                    onChange={handleChange}
                  />
                  <span>Active Properties</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="types"
                    value="commercial"
                    checked={filters.types.includes('commercial')}
                    onChange={handleChange}
                  />
                  <span>Commercial</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="types"
                    value="new-developments"
                    checked={filters.types.includes('new-developments')}
                    onChange={handleChange}
                  />
                  <span>New Developments</span>
                </label>
              </div>
            </div>

            {/* Features */}
            <div className="form-section">
              <h3>Features & Amenities</h3>
              <div className="checkbox-grid">
                {FEATURES.map(feature => (
                  <label key={feature} className="checkbox-label">
                    <input
                      type="checkbox"
                      name="features"
                      value={feature}
                      checked={filters.features.includes(feature)}
                      onChange={handleChange}
                    />
                    <span>{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="form-section">
              <h3>Status</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="status"
                    value="active"
                    checked={filters.status.includes('active')}
                    onChange={handleChange}
                  />
                  <span>For Sale</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="status"
                    value="sold"
                    checked={filters.status.includes('sold')}
                    onChange={handleChange}
                  />
                  <span>Sold</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button type="submit" className="btn-search">
                <span>Search Properties</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters({
                    currency: 'USD',
                    minPrice: '',
                    maxPrice: '',
                    country: '',
                    state: '',
                    city: '',
                    neighborhood: '',
                    beds: '',
                    baths: '',
                    types: [],
                    features: [],
                    status: ['active']
                  });
                }}
                className="btn-reset"
              >
                Reset Filters
              </button>
            </div>
          </form>
          ) : (
            <div className="search-results">
              <div className="results-header">
                <button onClick={handleBackToSearch} className="btn-back">
                  ← Back to Search
                </button>
                <p className="results-count">
                  {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
                </p>
              </div>

              {loading && <LoadingSpinner />}

              {error && (
                <div className="search-error">
                  <p>{error}</p>
                </div>
              )}

              {!loading && !error && properties.length === 0 && (
                <div className="search-empty">
                  <p>No properties found matching your criteria.</p>
                  <ButtonDali onClick={handleBackToSearch}>Adjust Filters</ButtonDali>
                </div>
              )}

              {!loading && !error && properties.length > 0 && (
                <div className="property-listing">
                  {properties.map((property) => {
                    const statusBadgeClass = 
                      property.status === 'for_sale' ? 'status-available' :
                      property.status === 'sold' ? 'status-sold' :
                      property.status === 'reserved' ? 'status-reserved' : '';
                    
                    const statusLabel = 
                      property.status === 'for_sale' ? 'For Sale' :
                      property.status === 'sold' ? 'Sold' :
                      property.status === 'reserved' ? 'Reserved' : property.status;

                    return (
                      <article key={property.id} className="property-row">
                        <div className="property-row-media">
                          <Link to={`/properties/${property.slug}`}>
                            {property.cover_image_url && !imageErrors[property.id] ? (
                              <img 
                                src={toAbsoluteUrl(property.cover_image_url)} 
                                alt={property.title}
                                loading="lazy"
                                onError={() =>
                                  setImageErrors((prev) => ({ ...prev, [property.id]: true }))
                                }
                              />
                            ) : (
                              <div className="property-placeholder">
                                <div className="placeholder-box" aria-hidden="true" />
                              </div>
                            )}
                            {property.status && (
                              <span className={`property-status ${statusBadgeClass}`}>
                                {statusLabel}
                              </span>
                            )}
                          </Link>
                        </div>
                        <div className="property-row-body">
                          <div className="property-meta">
                            {property.city && <span className="property-location">{property.city}</span>}
                          </div>
                          <h2>
                            <Link to={`/properties/${property.slug}`}>
                              {property.title}
                            </Link>
                          </h2>
                          {property.description && (
                            <p className="property-description">
                              {property.description.length > 150 
                                ? `${property.description.substring(0, 150)}...` 
                                : property.description}
                            </p>
                          )}
                          <div className="property-details">
                            {property.price_usd && (
                              <span className="property-price">
                                ${property.price_usd.toLocaleString('en-US')} USD
                              </span>
                            )}
                            <div className="property-features">
                              {property.bedrooms && (
                                <span className="feature-item">
                                  🛏️ {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                                </span>
                              )}
                              {property.bathrooms && (
                                <span className="feature-item">
                                  🚿 {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="property-row-actions">
                            <ButtonDali to={`/properties/${property.slug}`}>
                              View Details
                            </ButtonDali>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ContactWithCta />
    </>
  );
}
