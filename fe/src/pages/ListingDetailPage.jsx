import { useEffect, useMemo, useRef, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import ImageWithOverlay from '../components/ImageWithOverlay';
import SafeImage from '../components/SafeImage';
import OffMarketGate from '../components/OffMarketGate';
import TitleHeader from '../components/TitleHeader';
import { api } from '../config/api';
import { listingDetails } from '../data/listingDetails';
import { listingContent } from '../data/listingContent';
import { formatSize, formatBedrooms, formatBathrooms } from '../utils/propertyFormatters';
import './ListingDetailPage.css';

// Normalize YouTube or Vimeo URL into an embeddable src
const getVideoEmbed = (url) => {
  if (!url) return null;
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();

  // YouTube
  if (host.includes('youtube.com') || host.includes('youtu.be')) {
    // youtube.com/watch?v=ID
    const watchId = parsed.searchParams.get('v');
    if (watchId) return { provider: 'youtube', src: `https://www.youtube.com/embed/${watchId}` };

    // youtu.be/ID or youtube.com/embed/ID or /shorts/ID
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length) {
      const id = pathParts[pathParts.length - 1];
      return { provider: 'youtube', src: `https://www.youtube.com/embed/${id}` };
    }
  }

  // Vimeo
  if (host.includes('vimeo.com')) {
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    // Standard vimeo.com/VIDEOID or /channels/.../VIDEOID
    const id = pathParts[pathParts.length - 1];
    if (id && /^\d+$/.test(id)) {
      return { provider: 'vimeo', src: `https://player.vimeo.com/video/${id}` };
    }
  }

  return null;
};

export default function ListingDetailPage() {
  const mainSliderRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadingImages, setLoadingImages] = useState({});
  const [showRequestInfo, setShowRequestInfo] = useState(false);
  const [showScheduleShowing, setShowScheduleShowing] = useState(false);

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [contactStartedAt, setContactStartedAt] = useState(() => Date.now());
  const [requestStatus, setRequestStatus] = useState({ type: '', message: '' });
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [requestStartedAt, setRequestStartedAt] = useState(() => Date.now());
  const [scheduleStatus, setScheduleStatus] = useState({ type: '', message: '' });
  const [isScheduleSubmitting, setIsScheduleSubmitting] = useState(false);
  const [scheduleStartedAt, setScheduleStartedAt] = useState(() => Date.now());

  // Related properties
  const [relatedProperties, setRelatedProperties] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Currency toggle: 'USD', 'MXN', 'EUR'
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  // Size unit toggle: 'sqm' or 'sqft'
  const [selectedUnit, setSelectedUnit] = useState('sqm');

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const slug = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts[1] || '';
  }, [pathname]);

  // Off Market: read token from URL query param
  const offMarketToken = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || null;
  }, []);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setNotFound(false);
        const tokenParam = offMarketToken ? `?token=${encodeURIComponent(offMarketToken)}` : '';
        const response = await api.get(`/properties/${slug}${tokenParam}`);
        if (response.success && response.data) {
          setProperty(response.data);
          // Set default currency based on property
          if (response.data.price_base_currency) {
            setSelectedCurrency(response.data.price_base_currency);
          }
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [slug]);

  // Load related properties based on city/neighborhood
  useEffect(() => {
    if (!property) return;

    const fetchRelated = async () => {
      setLoadingRelated(true);
      try {
        // Try neighborhood first, then city
        let response;
        if (property.neighborhood) {
          response = await api.get(`/properties?is_active=1&per_page=6&neighborhood=${encodeURIComponent(property.neighborhood)}`);
        }

        // If no results with neighborhood, try city
        if (!response?.data?.properties?.length && property.city) {
          response = await api.get(`/properties?is_active=1&per_page=6&city=${encodeURIComponent(property.city)}`);
        }

        if (response?.success && response.data?.properties) {
          // Filter out current property
          const filtered = response.data.properties.filter(p => p.id !== property.id).slice(0, 4);
          setRelatedProperties(filtered);
        }
      } catch (err) {
        console.error('Error loading related properties:', err);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [property]);

  useEffect(() => {
    if (showRequestInfo) {
      setRequestStartedAt(Date.now());
      setRequestStatus({ type: '', message: '' });
    }
  }, [showRequestInfo]);

  useEffect(() => {
    if (showScheduleShowing) {
      setScheduleStartedAt(Date.now());
      setScheduleStatus({ type: '', message: '' });
    }
  }, [showScheduleShowing]);

  const detail = property
    ? {
      title: property.title,
      location: property.location || property.city || '',
      priceLabel: property.price ? `$${Number(property.price).toLocaleString()}` : 'Contact for pricing',
      heroImage: property.featured_image,
      highlights: [],
      content: property.content || property.description || listingContent[slug] || '<p>Contact us to learn more about this property.</p>',
    }
    : listingDetails[slug];

  // Base URL for canonical and OG URLs
  const siteUrl = "https://buywithdali.com";
  const propertyUrl = `${siteUrl}/listings/${slug}/`;

  const sectionMap = {
    active: { label: 'Active Properties', link: '/active-properties', typeLabel: 'Active Property' },
    development: { label: 'New Developments', link: '/new-developments', typeLabel: 'New Development' },
    hot_deal: { label: 'Hot Deals', link: '/hot-deals', typeLabel: 'Hot Deal' },
    off_market: { label: 'Off Market', link: '/off-market', typeLabel: 'Off Market' },
    land: { label: 'Land', link: '/land', typeLabel: 'Land' },
  };

  const sectionInfo = property ? sectionMap[property.property_type] || sectionMap.active : sectionMap.active;
  const sectionUrl = `${siteUrl}${sectionInfo.link}`;

  const handlePropertyContact = async (event) => {
    event.preventDefault();
    if (isContactSubmitting) return;

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }
    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get('first-name') || '').trim(),
      lastName: String(formData.get('last-name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      page: window.location.href,
      ts: contactStartedAt,
      source: 'listing-detail',
      propertyTitle: detail?.title || property?.title || '',
      propertySlug: slug,
      propertyId: property?.id ? String(property.id) : '',
      propertyPrice: detail?.priceLabel || '',
      propertyUrl,
    };

    setIsContactSubmitting(true);
    setContactStatus({ type: 'sending', message: 'Sending...' });

    try {
      await api.post('/contact', payload);
      form.reset();
      setContactStartedAt(Date.now());
      setContactStatus({ type: 'success', message: "Message sent. We'll get back to you soon." });
    } catch (error) {
      console.error('Listing contact error', error);
      setContactStatus({ type: 'error', message: 'Error sending message. Please try again later.' });
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const handleRequestInfoSubmit = async (event) => {
    event.preventDefault();
    if (isRequestSubmitting) return;

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }
    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get('first-name') || '').trim(),
      lastName: String(formData.get('last-name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      page: window.location.href,
      ts: requestStartedAt,
      source: 'request-info',
      propertyTitle: detail?.title || property?.title || '',
      propertySlug: slug,
      propertyId: property?.id ? String(property.id) : '',
      propertyPrice: detail?.priceLabel || '',
      propertyUrl,
      purpose: String(formData.get('purpose') || '').trim(),
      preferredContact: String(formData.get('preferred-contact') || '').trim(),
      knowsRiviera: String(formData.get('knows-riviera') || '').trim(),
      budgetRange: String(formData.get('budget-range') || '').trim(),
    };

    setIsRequestSubmitting(true);
    setRequestStatus({ type: 'sending', message: 'Sending...' });

    try {
      await api.post('/contact', payload);
      form.reset();
      setRequestStartedAt(Date.now());
      setRequestStatus({ type: 'success', message: "Message sent. We'll get back to you soon." });
    } catch (error) {
      console.error('Request info error', error);
      setRequestStatus({ type: 'error', message: 'Error sending message. Please try again later.' });
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const handleScheduleShowingSubmit = async (event) => {
    event.preventDefault();
    if (isScheduleSubmitting) return;

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }
    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get('first-name') || '').trim(),
      lastName: String(formData.get('last-name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      page: window.location.href,
      ts: scheduleStartedAt,
      source: 'schedule-showing',
      propertyTitle: detail?.title || property?.title || '',
      propertySlug: slug,
      propertyId: property?.id ? String(property.id) : '',
      propertyPrice: detail?.priceLabel || '',
      propertyUrl,
      availability1: String(formData.get('availability-1') || '').trim(),
      availability2: String(formData.get('availability-2') || '').trim(),
    };

    setIsScheduleSubmitting(true);
    setScheduleStatus({ type: 'sending', message: 'Sending...' });

    try {
      await api.post('/contact', payload);
      form.reset();
      setScheduleStartedAt(Date.now());
      setScheduleStatus({ type: 'success', message: "Message sent. We'll get back to you soon." });
    } catch (error) {
      console.error('Schedule showing error', error);
      setScheduleStatus({ type: 'error', message: 'Error sending message. Please try again later.' });
    } finally {
      setIsScheduleSubmitting(false);
    }
  };

  // Build absolute image URL
  const getAbsoluteImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // SEO fields from database - COMPLETE
  const seoData = property ? {
    title: property.seo_title || `${property.title}${property.city ? ` in ${property.city}` : ''}`,
    description: property.seo_description || (() => {
      const parts = [];
      const typeBlurb = {
        development: 'New development',
        hot_deal: 'Hot deal',
        off_market: 'Off market property',
        land: 'Land for sale',
        active: 'Property for sale',
      };
      parts.push(typeBlurb[property.property_type] || 'Property for sale');
      if (property.city) parts.push(`in ${property.city}`);
      if (property.bedrooms) parts.push(`${property.bedrooms} bedrooms`);
      if (property.bathrooms) parts.push(`${property.bathrooms} bathrooms`);
      if (property.sqm) parts.push(`${property.sqm} sqm`);
      if (property.price_usd && !property.price_on_demand) {
        parts.push(`USD ${Number(property.price_usd).toLocaleString('en-US')}`);
      }
      return parts.join(' • ') + '. Contact Buy With Dali for more information.';
    })(),
    keywords: property.seo_keywords || [
      property.title,
      property.city,
      property.neighborhood,
      property.country,
      ...(property.property_categories || (property.property_category ? [property.property_category] : [])),
      'real estate',
      'property for sale',
      'Riviera Maya',
      ...(property.tags || [])
    ].filter(Boolean).join(', '),
    ogTitle: property.og_title || property.title,
    ogDescription: property.og_description || property.seo_description || property.description?.replace(/<[^>]+>/g, '').slice(0, 200),
    ogImage: getAbsoluteImageUrl(property.og_image || property.cover_image_url || property.featured_image),
    ogImageAlt: property.cover_image_alt || `${property.title} - ${property.city || 'Riviera Maya'} property`,
    canonicalUrl: propertyUrl,
    property: property,
    breadcrumbs: [
      { name: 'Home', url: siteUrl },
      { name: sectionInfo.label, url: sectionUrl },
      { name: property.city || 'Property', url: propertyUrl },
      { name: property.title, url: propertyUrl }
    ]
  } : null;

  useEffect(() => {
    if (mainSliderRef.current && mainSliderRef.current.splide) {
      const splide = mainSliderRef.current.splide;
      splide.on('moved', (newIndex) => {
        setActiveSlide(newIndex);
      });
    }
  }, []);

  if (loading) {
    return (
      <section className="listing-loading">
        <div className="container" style={{ padding: '100px 5%', textAlign: 'center' }}>
          <p>Loading property...</p>
        </div>
      </section>
    );
  }

  if (notFound || !detail) {
    return (
      <>
        <SEO
          title="Property Not Found"
          description="The property you are looking for is no longer available or has been moved."
          canonicalUrl={`https://buywithdali.com${pathname}`}
        />
        <section className="listing-not-found">
          <div className="container" style={{ padding: '100px 5%', textAlign: 'center' }}>
            <h1>Property Not Found</h1>
            <p>The property you are looking for is no longer available or has been moved.</p>
            <p style={{ marginTop: '20px' }}>
              <a href="/active-properties" className="default-button">
                View Active Properties
              </a>
            </p>
            <p style={{ marginTop: '15px' }}>
              <a href="/new-developments" className="default-button" style={{ marginLeft: '10px' }}>
                View New Developments
              </a>
            </p>
          </div>
        </section>
      </>
    );
  }

  const galleryUrls = (property.galleryUrls && property.galleryUrls.length ? property.galleryUrls : []).filter(Boolean);

  // Use photos array with alt_text if available, otherwise fallback to galleryUrls
  const photos = property.photos && property.photos.length > 0
    ? property.photos.map(photo => ({
      url: photo.url,
      alt: photo.alt_text || `${property.title} - ${property.city || 'Riviera Maya'} property image`
    }))
    : galleryUrls.map((url, idx) => ({
      url,
      alt: `${property.title} - Image ${idx + 1}`
    }));

  const heroImage = detail.heroImage || (photos[0]?.url) || property.image;
  const heroGallery = photos.length > 0
    ? photos
    : (heroImage ? [{ url: heroImage, alt: property.title }] : []);

  const scheduleLink = 'https://calendar.app.google/QoV7AeK9d3B62hqm7';

  // Format price with currency
  const getPriceForCurrency = () => {
    if (property.price_on_demand) return 'Price on Request';

    let price = null;
    let symbol = '$';

    if (selectedCurrency === 'USD' && property.price_usd) {
      price = property.price_usd;
      symbol = '$';
    } else if (selectedCurrency === 'MXN' && property.price_mxn) {
      price = property.price_mxn;
      symbol = '$';
    } else if (selectedCurrency === 'EUR' && property.price_eur) {
      price = property.price_eur;
      symbol = '€';
    }

    if (!price) return 'Contact for Pricing';

    return `${symbol}${Number(price).toLocaleString('en-US')} ${selectedCurrency}`;
  };

  const priceLabel = getPriceForCurrency();
  const neighborhood = property.city || detail.location || property.location || '';

  // Property Type: active or development
  const propertyType = sectionInfo.typeLabel;

  // Status label
  const getStatusLabel = (status) => {
    if (status === 'for_sale') return 'For Sale';
    if (status === 'sold') return 'Sold';
    if (status === 'reserved') return 'Reserved';
    return 'For Sale';
  };
  const statusLabel = getStatusLabel(property.status);

  // Property Categories (unified: always an array)
  const categoriesArr = property.property_categories?.length
    ? property.property_categories
    : property.property_category
      ? [property.property_category]
      : [];
  const propertyCategories = categoriesArr.length
    ? categoriesArr.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
    : null;

  // Use formatters from utils with unit toggle
  const bedroomsLabel = formatBedrooms(property);
  const bathroomsLabel = formatBathrooms(property);

  // Size with toggle
  const getSizeLabel = () => {
    if (selectedUnit === 'sqm' && property.sqm) {
      return `${property.sqm} m²`;
    } else if (selectedUnit === 'sqft' && property.sqft) {
      return `${property.sqft} sq ft`;
    } else if (property.sqm) {
      return `${property.sqm} m²`;
    } else if (property.sqft) {
      return `${property.sqft} sq ft`;
    }
    return null;
  };
  const sizeLabel = getSizeLabel();

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
  const attachments = property.attachments || [];

  const attachmentIcon = (filename = '', mime = '') => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (mime.includes('pdf') || ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📑';
    return '📁';
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

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
      navigator.clipboard.writeText(currentUrl).catch(() => { });
    } else if (typeof window !== 'undefined') {
      window.prompt('Copy this link', currentUrl);
    }
  };

  const handleImageLoad = (index) => {
    setLoadingImages(prev => ({ ...prev, [index]: false }));
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

  const isOffMarket = property?.property_type === 'off_market';

  // Off Market: wrap entire page behind OffMarketGate (token + code verification)
  const pageContent = (
    <>
      {seoData && (
        <SEO
          title={seoData.title}
          description={seoData.description}
          keywords={seoData.keywords}
          ogTitle={seoData.ogTitle}
          ogDescription={seoData.ogDescription}
          ogImage={seoData.ogImage}
          ogImageAlt={seoData.ogImageAlt}
          canonicalUrl={seoData.canonicalUrl}
          ogType="product"
          property={seoData.property}
          breadcrumbs={seoData.breadcrumbs}
          robots={isOffMarket ? 'noindex, nofollow' : 'index, follow'}
        />
      )}

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
          {heroGallery.map((photo, idx) => (
            <SplideSlide key={`hero-${idx}`}>
              <div className="listing-hero-frame">
                <SafeImage
                  src={photo.url}
                  alt={photo.alt || `${detail.title} - Image ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  placeholder="gradient"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="listing-hero-overlay"></div>
              </div>
            </SplideSlide>
          ))}
        </Splide>
      </section>

      {heroGallery.length > 1 && (
        <div className="listing-gallery-thumbnails" data-aos="fade-up" data-aos-duration="900" data-aos-delay="50">
          <div className="listing-gallery-container">
            <Splide
              options={{
                type: 'loop',
                perPage: 6,
                gap: '12px',
                arrows: true,
                pagination: false,
                rewind: true,
                breakpoints: {
                  1100: { perPage: 5 },
                  900: { perPage: 4 },
                  700: { perPage: 3 },
                  500: { perPage: 2 },
                },
              }}
              className="listing-thumbs"
            >
              {heroGallery.map((photo, idx) => (
                <SplideSlide key={`thumb-${idx}`}>
                  <div
                    className={`listing-gallery-thumb ${activeSlide === idx ? 'active' : ''}`}
                    onClick={() => handleThumbnailClick(idx)}
                  >
                    {loadingImages[idx] !== false && (
                      <div className="thumb-loading">
                        <div className="thumb-spinner"></div>
                      </div>
                    )}
                    <SafeImage
                      src={photo.url}
                      alt={photo.alt || `${detail.title} - Thumbnail ${idx + 1}`}
                      loading="lazy"
                      placeholder="gradient"
                      onLoad={() => handleImageLoad(idx)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="page-breadcrumbs-wrap">
        <div className="page-breadcrumbs">
          <span className="breadcrumbs-content">
            <Link to="/">Home</Link>
            {' » '}
            <Link to={sectionInfo.link}>
              {sectionInfo.label}
            </Link>
            {' » '}
            {property?.title}
          </span>
        </div>
      </div>

      <section className="listing-detail-section">
        <div className="listing-detail-container">

          {/* Title and Subtitle */}
          <TitleHeader
            kicker={propertyType}
            title={detail.title}
            subtitle={property.subtitle || ''}
          />

          <div className="listing-content-grid">

            {/* Main Content - Description, Video, Map ONLY */}
            <div className="listing-main-content" data-aos="fade-up" data-aos-duration="900" data-aos-delay="100">

              {/* Property Description */}
              <div className="listing-about">
                <div className="listing-description" dangerouslySetInnerHTML={{ __html: detail.content }}></div>
              </div>

              {/* Video (YouTube or Vimeo) */}
              {property.youtube_video_url && getVideoEmbed(property.youtube_video_url) && (
                <div className="listing-video">
                  <h4>Property Video</h4>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '2px' }}>
                    {(() => {
                      const embed = getVideoEmbed(property.youtube_video_url);
                      if (!embed) return null;
                      return (
                        <iframe
                          title="Property video"
                          src={embed.src}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="listing-map">
                <iframe
                  title="Property map"
                  src={property.google_maps_url
                    ? property.google_maps_url.replace('/maps/place/', '/maps/embed/v1/place?key=&q=').includes('embed')
                      ? property.google_maps_url
                      : `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${property.longitude || '-87.0896'}!3d${property.latitude || '20.6127'}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s!2s${encodeURIComponent(property.city || 'Playa del Carmen')}!5e0!3m2!1sen!2smx`
                    : (property.latitude && property.longitude)
                      ? `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${property.longitude}!3d${property.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s!2s${encodeURIComponent(property.city || 'Property Location')}!5e0!3m2!1sen!2smx`
                      : `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14937.581829612898!2d-87.08963175000001!3d20.612731699999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f4e436c6ba8d5ff%3A0x20b898efa93c75bd!2sPlayacar%2C%20Playa%20del%20Carmen!5e0!3m2!1sen!2sph!4v1701826627668!5m2!1sen!2sph`
                  }
                  width="100%"
                  height="450"
                  style={{ border: 0, borderRadius: '2px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            {/* Sidebar - ALL property details, amenities, attachments, contact form */}
            <aside className="listing-sidebar" data-aos="fade-up" data-aos-duration="900" data-aos-delay="200">

              {/* Price Card */}
              <div className="price-card">
                <div className="price-display">
                  <div className="price-value">{priceLabel}</div>

                  {/* Currency and Unit Toggles */}
                  <div className="price-controls">
                    {/* Currency Toggle */}
                    {!property.price_on_demand && (
                      <div className="currency-toggle">
                        {['USD', 'MXN', 'EUR'].map(curr => {
                          const hasPrice = curr === 'USD' ? property.price_usd : curr === 'MXN' ? property.price_mxn : property.price_eur;
                          if (!hasPrice) return null;
                          return (
                            <button
                              key={curr}
                              className={`currency-btn ${selectedCurrency === curr ? 'active' : ''}`}
                              onClick={() => setSelectedCurrency(curr)}
                            >
                              {curr}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Unit Toggle */}
                    {(property.sqm || property.sqft) && (
                      <div className="unit-toggle">
                        <button
                          className={`unit-btn ${selectedUnit === 'sqm' ? 'active' : ''}`}
                          onClick={() => setSelectedUnit('sqm')}
                        >
                          m²
                        </button>
                        <button
                          className={`unit-btn ${selectedUnit === 'sqft' ? 'active' : ''}`}
                          onClick={() => setSelectedUnit('sqft')}
                        >
                          sq ft
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <ul className="property-facts">
                  {neighborhood && (
                    <li>
                      <span>Neighborhood</span>
                      <strong>{neighborhood}</strong>
                    </li>
                  )}
                  {bedroomsLabel && (
                    <li>
                      <span>Bedrooms</span>
                      <strong>{bedroomsLabel}</strong>
                    </li>
                  )}
                  {bathroomsLabel && (
                    <li>
                      <span>Bathrooms</span>
                      <strong>{bathroomsLabel}</strong>
                    </li>
                  )}
                  {sizeLabel && (
                    <li>
                      <span>{selectedUnit === 'sqm' ? 'Mq2' : 'Sq Ft'}</span>
                      <strong>{sizeLabel}</strong>
                    </li>
                  )}
                  <li>
                    <span>Status</span>
                    <strong>{statusLabel}</strong>
                  </li>
                  {property.furnishing_status && (
                    <li>
                      <span>Furnishing</span>
                      <strong>{property.furnishing_status.charAt(0).toUpperCase() + property.furnishing_status.slice(1)}</strong>
                    </li>
                  )}
                  {propertyCategories && (
                    <li>
                      <span>Category</span>
                      <strong>{propertyCategories}</strong>
                    </li>
                  )}
                  {property.lot_size_sqm && (
                    <li>
                      <span>Lot Size</span>
                      <strong>{property.lot_size_sqm} m²</strong>
                    </li>
                  )}
                  {property.year_built && (
                    <li>
                      <span>Year Built</span>
                      <strong>{property.year_built}</strong>
                    </li>
                  )}
                </ul>

                {/* Amenities */}
                {amenities.length > 0 && (
                  <div className="listing-amenities-section" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Amenities & Features
                    </h4>
                    <ul className="amenities-list">
                      {amenities.map((item, idx) => (
                        <li key={`amenity-${idx}`}>
                          <svg className="check-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
                    {property.property_type === 'hot_deal' ? (
                      <PropertyAccessGate
                        property={property}
                        attachments={attachments}
                        attachmentIcon={attachmentIcon}
                        formatBytes={formatBytes}
                      />
                    ) : (
                      <div className="listing-attachments">
                        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: '#333', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Downloads
                        </h4>
                        <ul className="attachments-list">
                          {attachments.map((file) => (
                            <li key={file.id} className="attachment-item">
                              <span className="attachment-icon" aria-hidden="true">{attachmentIcon(file.filename, file.mime_type)}</span>
                              <div className="attachment-meta">
                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                  {file.title || file.filename}
                                </a>
                                <span className="attachment-info">
                                  {file.filename} {file.size_bytes ? `· ${formatBytes(file.size_bytes)}` : ''}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="listing-actions">
                <button onClick={() => setShowRequestInfo(true)} className="default-button active">
                  Request Info
                </button>
                <button onClick={() => setShowScheduleShowing(true)} className="default-button active">
                  Schedule a Showing
                </button>
              </div>

              {/* Contact Form */}

              {/* Share Section */}
              <div className="share-card">
                <h4>Share Property</h4>
                <div className="share-buttons">
                  {shareLinks.map((link, idx) => (
                    <a
                      key={idx}
                      className="share-btn"
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Share on ${link.label}`}
                      title={link.label}
                    >
                      {link.label === 'Facebook' && (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                        </svg>
                      )}
                      {link.label === 'LinkedIn' && (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002ZM7 8.48H3V21h4V8.48Zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68Z" />
                        </svg>
                      )}
                      {link.label === 'X' && (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      )}
                      {link.label === 'Email' && (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                        </svg>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related Properties Section */}
      {
        relatedProperties.length > 0 && (
          <section className="related-properties" style={{ padding: '80px 5%', backgroundColor: '#f9f9f9' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '40px', textAlign: 'center' }}>
                Vedi anche
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                {relatedProperties.map((prop) => {
                  const priceLabel = prop.price_on_demand
                    ? 'Price on Request'
                    : prop.price_usd
                      ? `USD ${Number(prop.price_usd).toLocaleString('en-US')}`
                      : 'Contact for pricing';

                  return (
                    <div key={prop.id} className="property-card">
                      <Link to={`/listings/${prop.slug}/`}>
                        <div className="property-thumb">
                          <ImageWithOverlay
                            src={prop.cover_image_url}
                            alt={prop.title}
                            beds={prop.bedrooms}
                            baths={prop.bathrooms}
                            size={prop.sqm ? `${prop.sqm} m²` : null}
                            status={prop.status === 'sold' ? 'SOLD' : prop.status === 'reserved' ? 'RESERVED' : 'FOR SALE'}
                            location={prop.neighborhood || prop.city}
                          >
                            <div className="property-price">
                              <h3>{priceLabel}</h3>
                            </div>
                            <div className="property-title">
                              <h4>{prop.title}</h4>
                            </div>
                          </ImageWithOverlay>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )
      }

      {/* Request Info Popup */}
      {
        showRequestInfo && (
          <div className="listing-popup-overlay" onClick={() => setShowRequestInfo(false)}>
            <div className="listing-popup" onClick={(e) => e.stopPropagation()}>
              <button className="listing-popup-close" onClick={() => setShowRequestInfo(false)}>×</button>
              <h2>REQUEST INFO</h2>
              <p className="listing-popup-subtitle">Tell us how to reach you and we'll get back in touch.</p>
              <form className="listing-popup-form" onSubmit={handleRequestInfoSubmit}>
                <div className="form-honeypot" aria-hidden="true">
                  <label htmlFor="req-company">Company</label>
                  <input id="req-company" name="company" type="text" tabIndex="-1" autoComplete="off" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="req-first-name">First Name*</label>
                    <input id="req-first-name" name="first-name" type="text" autoComplete="given-name" minLength={2} maxLength={100} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="req-last-name">Last Name*</label>
                    <input id="req-last-name" name="last-name" type="text" autoComplete="family-name" minLength={2} maxLength={100} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="req-email">Email Address*</label>
                    <input id="req-email" name="email" type="email" autoComplete="email" maxLength={254} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="req-phone">Phone Number</label>
                    <input id="req-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[0-9+()\\-\\s]*" maxLength={40} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="req-purpose">What's the purpose of your investment?</label>
                    <input id="req-purpose" name="purpose" type="text" maxLength={200} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="req-contact">Best way to reach you?</label>
                    <select id="req-contact" name="preferred-contact">
                      <option>Email and Phone</option>
                      <option>Email</option>
                      <option>Phone</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="req-know">Do you already know Riviera Maya?</label>
                    <input id="req-know" name="knows-riviera" type="text" maxLength={80} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="req-budget">What budget range do you want to be in?</label>
                    <input id="req-budget" name="budget-range" type="text" maxLength={120} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="req-message">Your Message</label>
                    <textarea id="req-message" name="message" rows="4" maxLength={2000}></textarea>
                  </div>
                </div>
                <button type="submit" className="popup-submit-btn" disabled={isRequestSubmitting} aria-busy={isRequestSubmitting}>
                  {isRequestSubmitting ? 'Sending...' : 'Send'}
                </button>
                {requestStatus.message && (
                  <div className={`popup-form-status popup-form-status--${requestStatus.type}`} role="status" aria-live="polite">
                    {requestStatus.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        )
      }

      {/* Schedule Showing Popup */}
      {
        showScheduleShowing && (
          <div className="listing-popup-overlay" onClick={() => setShowScheduleShowing(false)}>
            <div className="listing-popup" onClick={(e) => e.stopPropagation()}>
              <button className="listing-popup-close" onClick={() => setShowScheduleShowing(false)}>×</button>
              <h2>SCHEDULE A SHOWING</h2>
              <p className="listing-popup-subtitle">Tell us how to reach you and we'll get back in touch.</p>
              <form className="listing-popup-form" onSubmit={handleScheduleShowingSubmit}>
                <div className="form-honeypot" aria-hidden="true">
                  <label htmlFor="sch-company">Company</label>
                  <input id="sch-company" name="company" type="text" tabIndex="-1" autoComplete="off" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sch-first-name">First Name*</label>
                    <input id="sch-first-name" name="first-name" type="text" autoComplete="given-name" minLength={2} maxLength={100} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sch-last-name">Last Name*</label>
                    <input id="sch-last-name" name="last-name" type="text" autoComplete="family-name" minLength={2} maxLength={100} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sch-email">Email Address*</label>
                    <input id="sch-email" name="email" type="email" autoComplete="email" maxLength={254} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sch-phone">Phone Number</label>
                    <input id="sch-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" pattern="[0-9+()\\-\\s]*" maxLength={40} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sch-date1">When are you available?</label>
                    <input id="sch-date1" name="availability-1" type="date" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sch-date2">Are you available at another time?</label>
                    <input id="sch-date2" name="availability-2" type="date" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="sch-message">Your Message</label>
                    <textarea id="sch-message" name="message" rows="4" maxLength={2000}></textarea>
                  </div>
                </div>
                <button type="submit" className="popup-submit-btn" disabled={isScheduleSubmitting} aria-busy={isScheduleSubmitting}>
                  {isScheduleSubmitting ? 'Sending...' : 'Send'}
                </button>
                {scheduleStatus.message && (
                  <div className={`popup-form-status popup-form-status--${scheduleStatus.type}`} role="status" aria-live="polite">
                    {scheduleStatus.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        )
      }
    </>
  );

  // Off Market properties require token + code gate
  if (isOffMarket) {
    return (
      <OffMarketGate
        token={offMarketToken}
        propertyId={property.id}
        slug={slug}
      >
        {pageContent}
      </OffMarketGate>
    );
  }

  return pageContent;
}
