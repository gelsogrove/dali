import { useState, useMemo, useEffect } from 'react';
import PageHero from '../components/PageHero';
import ContactWithCta from '../components/ContactWithCta';
import TitleHeader from '../components/TitleHeader';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';
import ButtonDali from '../components/ButtonDali';
import { Link } from 'react-router-dom';
import { api, endpoints } from '../config/api';
import SafeImage from '../components/SafeImage';
import './SearchPage.css';
import './CommunitiesPage.css';

const toSlug = (href) => {
  if (!href) return '';
  const parts = href.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
};

export default function SearchPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  // Units and Currency preferences
  const [selectedCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferredCurrency') || 'USD';
    }
    return 'USD';
  });

  const [selectedUnit] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('preferredSizeUnit') || 'sqm';
    }
    return 'sqm';
  });
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = useMemo(() => apiBase.replace(/\/api$/, ''), [apiBase]);

  // Cities / areas for communities section
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [thumbErrors, setThumbErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      setCitiesLoading(true);
      try {
        const [cRes, aRes] = await Promise.all([api.get('/cities'), api.get('/areas')]);
        const cList = cRes?.data?.cities ?? cRes?.data?.data?.cities ?? [];
        const aList = aRes?.data?.areas ?? aRes?.data?.data?.areas ?? [];
        setCities(cList);
        setAreas(aList);
      } catch (e) {
        console.error('Failed to load communities', e);
      } finally {
        setCitiesLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    if (!cities.length) return [];
    return cities.map((city, idx) => {
      const cityAreas = areas.filter((a) => a.city_id === city.id);
      return { city, areas: cityAreas, count: cityAreas.length, idx };
    });
  }, [cities, areas]);

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
        const filtered = filters.type
          ? list
          : list.filter((property) => !['hot_deal', 'off_market'].includes(property.property_type));
        setProperties(filtered);
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
        description="Search luxury real estate in Riviera Maya, Tulum, Playa del Carmen. Filter by property type, category, price, and location to find your dream property in Mexico."
        keywords="search properties Riviera Maya, Tulum real estate search, property finder Playa del Carmen, luxury homes search Mexico, condos for sale, villas Mexico"
        ogTitle="Search Properties - Buy With Dali"
        ogDescription="Find your perfect property in Mexico's Riviera Maya. Advanced search with filters for type, category, and location."
        canonicalUrl="https://buywithdali.com/search"
        breadcrumbs={[
          { name: 'Home', url: 'https://buywithdali.com/' },
          { name: 'Search Properties', url: 'https://buywithdali.com/search' }
        ]}
      />
      <PageHero breadcrumb="» Search" />
      
      <section className="search-page">
        <div className="search-container">
          <div className="search-header">
            <TitleHeader kicker="Search" title="Properties" />
          </div>

          {/* Search form — always visible */}
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
                  <option value="active">Active Property</option>
                  <option value="development">New Development</option>
                  <option value="land">Land</option>
                </select>

                <select
                  name="category"
                  value={filters.category}
                  onChange={handleChange}
                  className="search-select"
                >
                  <option value="">All Categories</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                  <option value="condo">Condo</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
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

          {/* Communities grid — shown when no search is active */}
          {!showResults && (
            <section className="communities-grid-section" style={{ marginTop: '48px', padding: '0' }}>
              <div className="communities-grid-wrapper" style={{ padding: '0' }}>
                {citiesLoading && <div className="text-center text-muted-foreground">Loading communities…</div>}
                {!citiesLoading && grouped.map(({ city, areas: cityAreas, count, idx }) => (
                  <div className="communities-city" key={city.id || idx}>
                    <div className="communities-city-head">
                      <div>
                        <p className="communities-city-kicker">City</p>
                        <a href={`/community/${city.slug}`} className="communities-city-title-link">
                          <h3>{city.title || city.name}</h3>
                        </a>
                      </div>
                      <span className="communities-count">{count || cityAreas.length} communities</span>
                    </div>
                    {cityAreas.length === 0 ? (
                      <div className="text-muted-foreground" style={{ padding: '10px 0 20px' }}>
                        No areas yet for this city.
                      </div>
                    ) : (
                      <div className="communities-card-grid">
                        {cityAreas.map((community) => {
                          const slug = community.slug || toSlug(community.href);
                          const link =
                            slug && (community.city_slug || city.slug)
                              ? `/community/${community.city_slug || city.slug}/${slug}`
                              : community.href || '#';
                          const thumbKey = `${community.slug || community.title}-${community.city_id || idx}`;
                          const hasImage = community.cover_image && !thumbErrors[thumbKey];
                          return (
                            <a href={link} className="community-card" key={thumbKey}>
                              <div className="community-card-image">
                                {hasImage ? (
                                  <img
                                    src={community.cover_image.startsWith('http') ? community.cover_image : `${assetBase}${community.cover_image}`}
                                    alt={community.title}
                                    loading="lazy"
                                    onError={() => setThumbErrors((prev) => ({ ...prev, [thumbKey]: true }))}
                                  />
                                ) : (
                                  <div className="blog-placeholder">
                                    <div className="placeholder-box" aria-hidden="true" />
                                  </div>
                                )}
                                <div className="community-card-gradient" />
                              </div>
                              <div className="community-card-body">
                                <h4>{community.title}</h4>
                                <span className="community-card-link">View neighborhood</span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search results — shown after a search */}
          {showResults && (
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

                    // Format price with user's preferred currency
                    const formatPrice = () => {
                      if (property.price_on_demand) return 'Price on Request';
                      
                      let price = null;
                      let priceFrom = null;
                      let priceTo = null;
                      let symbol = '$';
                      
                      if (selectedCurrency === 'USD') {
                        price = property.price_usd;
                        priceFrom = property.price_from_usd;
                        priceTo = property.price_to_usd;
                        symbol = '$';
                      } else if (selectedCurrency === 'MXN') {
                        price = property.price_mxn ? Math.round(Number(property.price_mxn)) : null;
                        priceFrom = property.price_from_mxn ? Math.round(Number(property.price_from_mxn)) : null;
                        priceTo = property.price_to_mxn ? Math.round(Number(property.price_to_mxn)) : null;
                        symbol = '$';
                      } else if (selectedCurrency === 'EUR') {
                        price = property.price_eur;
                        priceFrom = property.price_from_eur;
                        priceTo = property.price_to_eur;
                        symbol = '€';
                      }

                      if (property.property_type === 'development' && priceFrom && priceTo) {
                        return `${symbol}${Number(priceFrom).toLocaleString('en-US', { maximumFractionDigits: 0 })} - ${symbol}${Number(priceTo).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${selectedCurrency}`;
                      }
                      
                      if (price) {
                        return `${symbol}${Number(price).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${selectedCurrency}`;
                      }
                      
                      return 'Price on Request';
                    };

                    // Format beds/baths for developments
                    const formatBeds = () => {
                      if (property.property_type === 'development') {
                        if (property.bedrooms_min && property.bedrooms_max && property.bedrooms_min !== property.bedrooms_max) {
                          return `${property.bedrooms_min}-${property.bedrooms_max}`;
                        }
                        return property.bedrooms_min || property.bedrooms_max || property.bedrooms;
                      }
                      return property.bedrooms;
                    };

                    const formatBaths = () => {
                      if (property.property_type === 'development') {
                        if (property.bathrooms_min && property.bathrooms_max && property.bathrooms_min !== property.bathrooms_max) {
                          return `${property.bathrooms_min}-${property.bathrooms_max}`;
                        }
                        return property.bathrooms_min || property.bathrooms_max || property.bathrooms;
                      }
                      return property.bathrooms;
                    };

                    const beds = formatBeds();
                    const baths = formatBaths();
                    const propertyLink = `/listings/${property.slug}/`;
                    
                    // Format size
                    // Format size with user's preferred unit
                    const formatSize = () => {
                      if (selectedUnit === 'sqm' && property.sqm) {
                        return `${parseFloat(property.sqm).toLocaleString('en-US', { maximumFractionDigits: 0 })} m²`;
                      } else if (selectedUnit === 'sqft' && property.sqft) {
                        return `${parseFloat(property.sqft).toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft`;
                      } else if (property.sqm) {
                        return `${parseFloat(property.sqm).toLocaleString('en-US', { maximumFractionDigits: 0 })} m²`;
                      } else if (property.sqft) {
                        return `${parseFloat(property.sqft).toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft`;
                      }
                      return null;
                    };
                    const size = formatSize();

                    return (
                      <article key={property.id} className="property-row">
                        <div className="property-row-media">
                          <Link to={propertyLink}>
                            <SafeImage
                              src={toAbsoluteUrl(property.cover_image_url)}
                              alt={property.title}
                              loading="lazy"
                              placeholder="gradient"
                              style={{ width: '100%', height: 'auto' }}
                            />
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
                            <Link to={propertyLink}>
                              {property.title}
                            </Link>
                          </h2>
                          {property.description && (
                            <p className="property-description">
                              {property.description.replace(/<[^>]+>/g, '').length > 150 
                                ? `${property.description.replace(/<[^>]+>/g, '').substring(0, 150)}...` 
                                : property.description.replace(/<[^>]+>/g, '')}
                            </p>
                          )}
                          <div className="property-details">
                            <span className="property-price">{formatPrice()}</span>
                            <div className="property-features">
                              {beds && (
                                <span className="feature-item">
                                  🛏️ {beds} {beds === 1 ? 'Bed' : 'Beds'}
                                </span>
                              )}
                              {baths && (
                                <span className="feature-item">
                                  🚿 {baths} {baths === 1 ? 'Bath' : 'Baths'}
                                </span>
                              )}
                              {size && (
                                <span className="feature-item">
                                  📏 {size}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="property-row-actions">
                            <ButtonDali to={propertyLink}>
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
