import { useState, useMemo } from 'react';
import PageHero from '../components/PageHero';
import ContactWithCta from '../components/ContactWithCta';
import TitleHeader from '../components/TitleHeader';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';
import ButtonDali from '../components/ButtonDali';
import { Link } from 'react-router-dom';
import { api, endpoints } from '../config/api';
import './SearchPage.css';

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
      
      // Il parametro 'q' cerca su: title, subtitle, description, neighborhood, city, country, tags
      if (filters.search) params.append('q', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('property_type', filters.type);
      if (filters.category) params.append('property_category', filters.category);
      if (filters.furnishing) params.append('furnishing_status', filters.furnishing);
      
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
            <form onSubmit={handleSubmit} className="search-form-simple">
              <div className="search-bar-row">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleChange}
                  placeholder="Search by title, city, country, tags..."
                  className="search-input"
                />

                <select
                  name="type"
                  value={filters.type}
                  onChange={handleChange}
                  className="search-select"
                >
                  <option value="">All Types</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="villa">Villa</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>

                <select
                  name="category"
                  value={filters.category}
                  onChange={handleChange}
                  className="search-select"
                >
                  <option value="">All Categories</option>
                  <option value="luxury">Luxury</option>
                  <option value="beachfront">Beachfront</option>
                  <option value="investment">Investment</option>
                  <option value="new_development">New Development</option>
                </select>

                <select
                  name="furnishing"
                  value={filters.furnishing}
                  onChange={handleChange}
                  className="search-select"
                >
                  <option value="">All Furnishing</option>
                  <option value="furnished">Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi_furnished">Semi-Furnished</option>
                </select>

                <button type="submit" className="btn-search-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>

                <button type="button" onClick={handleReset} className="btn-reset-icon" title="Reset filters">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
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
