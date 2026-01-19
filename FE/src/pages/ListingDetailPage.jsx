import { useEffect, useMemo, useRef, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import CanvasImage from '../components/CanvasImage';
import ContactSection from '../components/ContactSection';
import { properties } from '../data/propertiesData';
import { listingDetails } from '../data/listingDetails';
import { listingContent } from '../data/listingContent';

export default function ListingDetailPage() {
  const mainSliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadingImages, setLoadingImages] = useState({});
  const [showRequestInfo, setShowRequestInfo] = useState(false);
  const [showScheduleShowing, setShowScheduleShowing] = useState(false);
  const [expandedAmenities, setExpandedAmenities] = useState(false);
  const [expandedAdditional, setExpandedAdditional] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const slug = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts[1] || '';
  }, [pathname]);

  const property = properties.find((p) => p.slug === slug) || {};
  const detail =
    listingDetails[slug] ||
    (property.title
      ? {
          title: property.title,
          location: property.location || property.city || '',
          priceLabel: property.price || 'Contact for pricing',
          heroImage: property.image,
          highlights: [],
          content: listingContent[slug] || '<p>Contact us to learn more about this property.</p>',
        }
      : null);

  useEffect(() => {
    if (detail?.title) {
      document.title = `${detail.title} | Buy With Dali`;
    }
  }, [detail]);

  useEffect(() => {
    if (mainSliderRef.current && mainSliderRef.current.splide) {
      const splide = mainSliderRef.current.splide;
      splide.on('moved', (newIndex) => {
        setActiveSlide(newIndex);
      });
    }
  }, []);

  if (!detail) {
    return (
      <section className="listing-not-found">
        <div className="container">
          <h1>Listing not found</h1>
          <p>The listing you are looking for is unavailable.</p>
          <a href="/properties" className="default-button">
            Back to Properties
          </a>
        </div>
      </section>
    );
  }

  const galleryUrls = (property.galleryUrls && property.galleryUrls.length ? property.galleryUrls : []).filter(Boolean);
  const heroImage = detail.heroImage || galleryUrls[0] || property.image;
  const heroGallery = heroImage ? [heroImage, ...galleryUrls.filter((url) => url !== heroImage)] : galleryUrls;
  const scheduleLink = 'https://calendar.app.google/QoV7AeK9d3B62hqm7';
  const brochureLink = property.href || '#';
  
  // Format price - remove prefixes like "STARTING AT", "FROM"
  const formatPrice = (price) => {
    if (!price) return 'Contact for pricing';
    const priceStr = String(price);
    // Remove common prefixes
    const cleaned = priceStr
      .replace(/^(STARTING AT|FROM|PRICE:?)\s*/i, '')
      .replace(/^\$/, '')
      .trim();
    // If it's a number, format it
    if (/^\d+$/.test(cleaned)) {
      return `$${Number(cleaned).toLocaleString('en-US')}`;
    }
    // If it already has USD or $, return as is
    if (cleaned.includes('USD') || cleaned.includes('$')) {
      return cleaned;
    }
    return `$${cleaned}`;
  };
  
  const priceLabel = formatPrice(property.rawPrice || property.price || detail.priceLabel);
  const neighborhood = property.city || detail.location || property.location || '';
  const propertyType = 'ACTIVE PROPERTIES';
  const statusLabel = 'FOR SALE';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : property.href || '';
  const amenities =
    detail.amenities && detail.amenities.length
      ? detail.amenities
      : (() => {
          const html = detail.content || '';
          const matches = [...html.matchAll(new RegExp('<li[^>]*>(.*?)</li>', 'gis'))];
          return matches.slice(0, 12).map((m) => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
        })();
  const additionalInfo = detail.additionalInfo || [];

  const shareLinks = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}`,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`,
    },
    {
      label: 'Email',
      href: `mailto:?subject=${encodeURIComponent(detail.title)}&body=${encodeURIComponent(currentUrl)}`,
    },
  ];

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).catch(() => {});
    } else if (typeof window !== 'undefined') {
      window.prompt('Copy this link', currentUrl);
    }
  };

  const handleImageLoad = (index) => {
    setLoadingImages(prev => ({ ...prev, [index]: false }));
  };

  const handleImageLoadStart = (index) => {
    setLoadingImages(prev => ({ ...prev, [index]: true }));
  };

  const handleThumbnailClick = (index) => {
    if (mainSliderRef.current) {
      mainSliderRef.current.go(index);
      setActiveSlide(index);
      // Scroll to the slider
      const sliderElement = document.querySelector('.listing-hero-slider');
      if (sliderElement) {
        sliderElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <section className="listing-hero-slider">
        <Splide
          ref={mainSliderRef}
          options={{
            type: 'loop',
            perPage: 1,
            arrows: true,
            pagination: false,
            autoplay: true,
            interval: 5000,
            speed: 900,
          }}
          className="listing-hero-splide"
        >
          {heroGallery.map((url, idx) => (
            <SplideSlide key={`${url}-${idx}`}>
              <div className="listing-hero-frame">
                <img src={url} alt={`${detail.title} hero ${idx + 1}`} loading="lazy" />
                <div className="listing-hero-overlay"></div>
              </div>
            </SplideSlide>
          ))}
        </Splide>
      </section>

      {heroGallery.length ? (
        <div className="listing-gallery-strip" data-aos="fade-up" data-aos-duration="900" data-aos-delay="50">
          <Splide
            options={{
              perPage: 6,
              gap: '6px',
              arrows: true,
              pagination: false,
              breakpoints: {
                1100: { perPage: 5 },
                900: { perPage: 4 },
                700: { perPage: 3 },
                500: { perPage: 2 },
              },
            }}
            className="listing-thumbs"
          >
            {heroGallery.map((url, idx) => (
              <SplideSlide key={`thumb-${idx}`}>
                <div 
                  className={`listing-gallery-thumb ${activeSlide === idx ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(idx)} 
                  style={{ cursor: 'pointer' }}
                >
                  {loadingImages[idx] !== false && (
                    <div className="thumb-loading">
                      <div className="thumb-spinner"></div>
                    </div>
                  )}
                  <img 
                    src={url} 
                    alt={`${detail.title} image ${idx + 1}`} 
                    loading="lazy"
                    onLoadStart={() => handleImageLoadStart(idx)}
                    onLoad={() => handleImageLoad(idx)}
                  />
                </div>
              </SplideSlide>
            ))}
          </Splide>
        </div>
      ) : null}

      <section className="listing-main-wrap">
        <div className="listing-main-inner">
          <div className="listing-breadcrumb-line">
            <a href="/">Home</a> <span>›</span> <a href="/properties">Properties</a> <span>›</span> <span>{detail.title}</span>
          </div>
          
          <div className="listing-title-fullwidth">
            <h1>{detail.title}</h1>
          </div>
          
          <div className="listing-main-grid">
            <div className="listing-copy" data-aos="fade-up" data-aos-duration="900">
              <div className="listing-title-block">
                <div className="listing-stats-row">
                  {property.beds && property.beds > 0 ? (
                    <div className="listing-stat">
                      <span>Beds</span>
                      <strong>{property.beds}</strong>
                    </div>
                  ) : null}
                  {property.baths && property.baths > 0 ? (
                    <div className="listing-stat">
                      <span>Baths</span>
                      <strong>{property.baths}</strong>
                    </div>
                  ) : null}
                  {property.size ? (
                    <div className="listing-stat">
                      <span>Appx. Living Area</span>
                      <strong>{property.size}</strong>
                    </div>
                  ) : null}
                </div>
                <div className="listing-action-row">
                  <button onClick={() => setShowRequestInfo(true)} className="default-button active">
                    Request Info
                  </button>
                  <button onClick={() => setShowScheduleShowing(true)} className="default-button active">
                    Schedule a Showing
                  </button>
                  <a href={brochureLink} target="_blank" rel="noopener noreferrer" className="default-button ghost">
                    Printable Flyer
                  </a>
                </div>
              </div>

              <div className="listing-about-block" data-aos="fade-up" data-aos-duration="900" data-aos-delay="100">
                <h3>About this Property</h3>
                <div className="listing-content" dangerouslySetInnerHTML={{ __html: detail.content }}></div>
              </div>

              <div className="listing-details-panel" data-aos="fade-up" data-aos-duration="900" data-aos-delay="200">
                <h3>Property Details</h3>
                <div className="listing-section">
                  <button 
                    className={`listing-section-head accordion-trigger ${expandedAmenities ? 'active' : ''}`}
                    onClick={() => setExpandedAmenities(!expandedAmenities)}
                  >
                    <span>Amenities and Features</span>
                    <span className="accordion-icon">{expandedAmenities ? '↑' : '↓'}</span>
                  </button>
                  <div className={`accordion-body ${expandedAmenities ? 'active' : ''}`}>
                  {amenities.length ? (
                    <ul className="listing-amenities table">
                      {amenities.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="listing-muted">Contact us for full amenities list.</p>
                  )}
                  </div>
                </div>
                <div className="listing-section">
                  <button 
                    className={`listing-section-head accordion-trigger ${expandedAdditional ? 'active' : ''}`}
                    onClick={() => setExpandedAdditional(!expandedAdditional)}
                  >
                    <span>Additional Information</span>
                    <span className="accordion-icon">{expandedAdditional ? '↑' : '↓'}</span>
                  </button>
                  <div className={`accordion-body ${expandedAdditional ? 'active' : ''}`}>
                  <ul className="listing-additional">
                    <li>
                      <span>Property Type</span>
                      <strong>{propertyType}</strong>
                    </li>
                    <li>
                      <span>Status</span>
                      <strong>{statusLabel}</strong>
                    </li>
                    {property.size ? (
                      <li>
                        <span>Appx. Living Area</span>
                        <strong>{property.size}</strong>
                      </li>
                    ) : null}
                    {additionalInfo.map((item) => (
                      <li key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </li>
                    ))}
                  </ul>
                  </div>
                </div>
              </div>

              <div className="listing-map-form">
                <div className="listing-map-card">
                  <iframe
                    title="Property map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14937.581829612898!2d-87.08963175000001!3d20.612731699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f4e436c6ba8d5ff%3A0x20b898efa93c75bd!2sPlayacar%2C%20Playa%20del%20Carmen!5e0!3m2!1sen!2sph!4v1701826627668!5m2!1sen!2sph"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <div className="listing-form-card">
                  <div className="listing-form-title">
                    <span>Interested in</span>
                    <strong>{detail.title}</strong>
                  </div>
                  <form className="listing-form-grid">
                    <input type="text" placeholder="First Name" required />
                    <input type="text" placeholder="Last Name" required />
                    <input type="tel" placeholder="Phone" />
                    <input type="email" placeholder="Email" required />
                    <textarea placeholder="Message"></textarea>
                    <button type="submit" className="default-button active">
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <aside className="listing-side" data-aos="fade-up" data-aos-duration="900" data-aos-delay="100">
              <div className="listing-price-card">
                <div className="listing-price-value">{priceLabel}</div>
                <ul className="listing-facts">
                  <li>
                    <span>Status</span>
                    <strong>{statusLabel}</strong>
                  </li>
                  <li>
                    <span>Property Type</span>
                    <strong>{propertyType}</strong>
                  </li>
                  {neighborhood ? (
                    <li>
                      <span>Neighborhood</span>
                      <strong>{neighborhood}</strong>
                    </li>
                  ) : null}
                  {property.beds && property.beds > 0 ? (
                    <li>
                      <span>Bedrooms</span>
                      <strong>{property.beds}</strong>
                    </li>
                  ) : null}
                  {property.baths && property.baths > 0 ? (
                    <li>
                      <span>Bathrooms</span>
                      <strong>{property.baths}</strong>
                    </li>
                  ) : null}
              {property.size ? (
                <li>
                  <span>Size</span>
                  <strong>{property.size}</strong>
                </li>
              ) : null}
            </ul>
                <a href="/contact-us" className="listing-mortgage-btn">
                  Mortgage Calculator
                </a>
                <div className="listing-share">
                  <h3>SHARE:</h3>
                  <div className="listing-share-list">
                    <a
                      className="listing-share-link"
                      href={shareLinks[0].href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Facebook"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z"/>
                      </svg>
                    </a>
                    <a
                      className="listing-share-link"
                      href={shareLinks[1].href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on LinkedIn"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z"/>
                      </svg>
                    </a>
                    <a
                      className="listing-share-link"
                      href={shareLinks[2].href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on X"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <a
                      className="listing-share-link"
                      href={shareLinks[3].href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share via Email"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Request Info Popup */}
      {showRequestInfo && (
        <div className="listing-popup-overlay" onClick={() => setShowRequestInfo(false)}>
          <div className="listing-popup" onClick={(e) => e.stopPropagation()}>
            <button className="listing-popup-close" onClick={() => setShowRequestInfo(false)}>×</button>
            <h2>REQUEST INFO</h2>
            <p className="listing-popup-subtitle">Tell us how to reach you and we'll get back in touch.</p>
            <form className="listing-popup-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="req-first-name">First Name*</label>
                  <input id="req-first-name" type="text" required />
                </div>
                <div className="form-group">
                  <label htmlFor="req-last-name">Last Name*</label>
                  <input id="req-last-name" type="text" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="req-email">Email Address*</label>
                  <input id="req-email" type="email" required />
                </div>
                <div className="form-group">
                  <label htmlFor="req-phone">Phone Number</label>
                  <input id="req-phone" type="tel" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="req-purpose">What's the purpose of your investment?</label>
                  <input id="req-purpose" type="text" required />
                </div>
                <div className="form-group">
                  <label htmlFor="req-contact">Best way to reach you?</label>
                  <select id="req-contact">
                    <option>Email and Phone</option>
                    <option>Email</option>
                    <option>Phone</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="req-know">Do you already know Riviera Maya?</label>
                  <input id="req-know" type="text" />
                </div>
                <div className="form-group">
                  <label htmlFor="req-budget">What budget range do you want to be in?</label>
                  <input id="req-budget" type="text" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="req-message">Your Message</label>
                  <textarea id="req-message" rows="4"></textarea>
                </div>
              </div>
              <button type="submit" className="popup-submit-btn">SEND</button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Showing Popup */}
      {showScheduleShowing && (
        <div className="listing-popup-overlay" onClick={() => setShowScheduleShowing(false)}>
          <div className="listing-popup" onClick={(e) => e.stopPropagation()}>
            <button className="listing-popup-close" onClick={() => setShowScheduleShowing(false)}>×</button>
            <h2>SCHEDULE A SHOWING</h2>
            <p className="listing-popup-subtitle">Tell us how to reach you and we'll get back in touch.</p>
            <form className="listing-popup-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sch-first-name">First Name*</label>
                  <input id="sch-first-name" type="text" required />
                </div>
                <div className="form-group">
                  <label htmlFor="sch-last-name">Last Name*</label>
                  <input id="sch-last-name" type="text" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sch-email">Email Address*</label>
                  <input id="sch-email" type="email" required />
                </div>
                <div className="form-group">
                  <label htmlFor="sch-phone">Phone Number</label>
                  <input id="sch-phone" type="tel" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sch-date1">When are you available?</label>
                  <input id="sch-date1" type="date" />
                </div>
                <div className="form-group">
                  <label htmlFor="sch-date2">Are you available at another time?</label>
                  <input id="sch-date2" type="date" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="sch-message">Your Message</label>
                  <textarea id="sch-message" rows="4"></textarea>
                </div>
              </div>
              <button type="submit" className="popup-submit-btn">SEND</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
