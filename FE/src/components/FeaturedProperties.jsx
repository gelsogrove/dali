import { useState, useEffect } from 'react';
import ImageWithOverlay from './ImageWithOverlay';
import TitleHeader from './TitleHeader';
import ButtonDali from './ButtonDali';
import LoadingSpinner from './LoadingSpinner';
import { api, endpoints } from '../config/api';
import { formatBedrooms, formatBathrooms, getShortSize } from '../utils/propertyFormatters';

/**
 * FeaturedProperties - Mostra griglia di proprietà da API
 * 
 * Props:
 * - activeTab: 'properties' | 'active' | 'new' - Tab attivo
 * - paginate: boolean - Mostra paginazione
 * - pageSize: number - Elementi per pagina
 * - showTitle: boolean - Mostra header "Properties"
 * - disableAnimations: boolean - Disabilita animazioni AOS
 */
export default function FeaturedProperties({ 
  activeTab = 'properties', 
  paginate = false, 
  pageSize = 12,
  showTitle = true,
  disableAnimations = false,
  titleKicker = 'Featured',
  titleText = 'Properties'
}) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // Costruire query params
        const params = new URLSearchParams();
        params.append('is_active', '1');
        params.append('per_page', pageSize.toString());
        params.append('page', page.toString());
        
        // Filtrare per tipo se specificato
        if (activeTab === 'active') {
          params.append('property_type', 'active');
        } else if (activeTab === 'new') {
          params.append('property_type', 'development');
        } else {
          // Homepage: solo show_in_home, ordinati per order
          params.append('show_in_home', '1');
        }
        
        const response = await api.get(`${endpoints.properties}?${params.toString()}`);
        
        if (response.success && response.data) {
          setProperties(response.data.properties || []);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.total_pages || 1);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Unable to load properties');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [page, pageSize, activeTab]);

  const isActive = (tab) => activeTab === tab;

  // Formattare prezzo in USD
  const formatPrice = (property) => {
    if (property.price_on_demand) {
      return 'Price on Request';
    }
    
    // Se development con range
    if (property.property_type === 'development' && property.price_from_usd && property.price_to_usd) {
      return `USD ${Number(property.price_from_usd).toLocaleString('en-US')} - ${Number(property.price_to_usd).toLocaleString('en-US')}`;
    }
    
    // Prezzo singolo
    const price = property.price_usd;
    if (price) {
      return `USD ${Number(price).toLocaleString('en-US')}`;
    }
    
    return 'Price on Request';
  };

  // Status label
  const getStatusLabel = (property) => {
    if (property.status === 'sold') return 'SOLD';
    if (property.status === 'reserved') return 'RESERVED';
    return 'FOR SALE';
  };

  if (loading && properties.length === 0) {
    return (
      <section id="featured-properties">
        <div className="fp-container">
          {showTitle && <TitleHeader kicker={titleKicker} title={titleText} className="fp-title" />}
          <div className="fp-links" {...(!disableAnimations && showTitle && { 'data-aos': 'fade-up', 'data-aos-duration': '1000', 'data-aos-delay': '300' })}>
            <ButtonDali href="/active-properties" className={isActive('active') ? 'active' : ''}>
              Active Properties
            </ButtonDali>
            <ButtonDali href="/new-developments" className={isActive('new') ? 'active' : ''}>
              New Developments
            </ButtonDali>
          </div>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (error || properties.length === 0) {
    return (
      <section id="featured-properties">
        <div className="fp-container">
          {showTitle && <TitleHeader kicker={titleKicker} title={titleText} className="fp-title" />}
          <div className="fp-links" {...(!disableAnimations && showTitle && { 'data-aos': 'fade-up', 'data-aos-duration': '1000', 'data-aos-delay': '300' })}>
            <ButtonDali href="/active-properties" className={isActive('active') ? 'active' : ''}>
              Active Properties
            </ButtonDali>
            <ButtonDali href="/new-developments" className={isActive('new') ? 'active' : ''}>
              New Developments
            </ButtonDali>
          </div>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p>{error || 'No properties available'}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured-properties">
      <div className="fp-container">
        {showTitle && <TitleHeader kicker={titleKicker} title={titleText} className="fp-title" />}
        <div className="fp-links" {...(!disableAnimations && showTitle && { 'data-aos': 'fade-up', 'data-aos-duration': '1000', 'data-aos-delay': '300' })}>
          <ButtonDali href="/active-properties" className={isActive('active') ? 'active' : ''}>
            Active Properties
          </ButtonDali>
          <ButtonDali href="/new-developments" className={isActive('new') ? 'active' : ''}>
            New Developments
          </ButtonDali>
        </div>
        <div className="fp-grid" {...(!disableAnimations && showTitle && { 'data-aos': 'fade-up', 'data-aos-duration': '1000', 'data-aos-delay': '300' })}>
          {properties.map((property) => {
            const link = `/listings/${property.slug}/`;
            const location = property.city || property.neighborhood || '';
            const coverImage = property.cover_image_url; // SafeImage gestirà il fallback

            return (
              <div className="fp-list" key={property.id}>
                <a href={link}>
                  <ImageWithOverlay 
                    src={coverImage} 
                    alt={property.title}
                    className="fp-list-item-image"
                    beds={formatBedrooms(property)}
                    baths={formatBathrooms(property)}
                    size={getShortSize(property)}
                    status={getStatusLabel(property)}
                    location={location}
                  >
                    <div className="fp-item-price">
                      <h3>{formatPrice(property)}</h3>
                    </div>
                    <div className="fp-item-address">
                      <h4>{property.title}</h4>
                    </div>
                  </ImageWithOverlay>
                </a>
              </div>
            );
          })}
        </div>
        {paginate && totalPages > 1 && (
          <div className="fp-pagination" {...(!disableAnimations && showTitle && { 'data-aos': 'fade-up', 'data-aos-duration': '800', 'data-aos-delay': '300' })}>
            <button
              className="fp-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="fp-page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="fp-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
