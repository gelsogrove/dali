import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import ContactWithCta from '../components/ContactWithCta';
import SEO from '../components/SEO';
import PropertyGrid from '../components/PropertyGrid';
import SafeImage from '../components/SafeImage';
import { api, endpoints } from '../config/api';

export default function CityPage() {
  const { citySlug } = useParams();
  const [city, setCity] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = apiBase.startsWith('http') ? apiBase.replace(/\/api$/, '') : window.location.origin;

  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${assetBase}${url}`;
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/cities/slug/${citySlug}`);
      if (res?.success) {
        setCity(res.data);
      } else {
        setError('City not found');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load city');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [citySlug]);

  // Carica properties associate alla city
  useEffect(() => {
    if (!city) return;

    const loadProperties = async () => {
      setLoadingProperties(true);
      try {
        // Cerca properties per city
        const response = await api.get(`${endpoints.properties}?is_active=1&city=${encodeURIComponent(city.title)}&per_page=50`);
        if (response.success && response.data?.properties) {
          setProperties(response.data.properties);
        }
      } catch (err) {
        console.error('Error loading properties:', err);
      } finally {
        setLoadingProperties(false);
      }
    };

    loadProperties();
  }, [city]);

  const meta = useMemo(() => {
    if (!city) return null;
    const title = city.seoTitle || city.title;
    const description =
      city.seoDescription ||
      city.subtitle ||
      `Discover ${city.title} with curated properties and lifestyle highlights in Riviera Maya.`;
    const ogImage =
      city.ogImage
        ? toAbsoluteUrl(city.ogImage)
        : city.content_image
          ? toAbsoluteUrl(city.content_image)
          : city.cover_image
            ? toAbsoluteUrl(city.cover_image)
            : undefined;
    return {
      title,
      description,
      ogTitle: city.ogTitle || title,
      ogDescription: city.ogDescription || description,
      ogImage,
      canonical: city.canonicalUrl || `https://buywithdali.com/community/${city.slug}`,
    };
  }, [city]);

  if (loading) {
    return <div style={{ padding: '100px 5%', textAlign: 'center' }}>Loading...</div>;
  }

  if (error || !city) {
    return (
      <div style={{ padding: '100px 5%', textAlign: 'center' }}>
        <h1>City not found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/search">← Back to Communities</Link>
      </div>
    );
  }

  return (
    <>
      {meta && (
        <SEO
          title={meta.title}
          description={meta.description}
          ogTitle={meta.ogTitle}
          ogDescription={meta.ogDescription}
          ogImage={meta.ogImage}
          canonicalUrl={meta.canonical}
          keywords={city.keywords || ''}
          ogType="article"
        />
      )}
      <PageHero
        breadcrumb={
          <>
            <span>»</span>{' '}
            <a href="/search">Communities</a>
            {' '}<span>»</span>{' '}
            <span>{city.title}</span>
          </>
        }
      />

      <section className="community-detail">
        <div className="community-detail-wrapper">
          <div className="community-header community-header--left">
            <h1 className="community-page-title">{city.title}</h1>
            {city.subtitle && <p className="community-page-subtitle">{city.subtitle}</p>}
          </div>

          <div className="community-copy community-copy-wrap">
            <div className="community-float-image">
              {city.cover_image ? (
                <SafeImage
                  src={toAbsoluteUrl(city.cover_image)}
                  alt={city.cover_image_alt || city.title}
                  placeholder="gradient"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="blog-placeholder">
                  <div className="placeholder-box" aria-hidden="true" />
                </div>
              )}
            </div>

            {city.fullContent && (
              <div
                className="community-content"
                dangerouslySetInnerHTML={{ __html: city.fullContent }}
              />
            )}

            {city.content_image ? (
              <div className="community-content-image">
                <SafeImage
                  src={toAbsoluteUrl(city.content_image)}
                  alt={city.content_image_alt || city.title}
                  placeholder="gradient"
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>
            ) : null}
            <div className="community-clear" />
          </div>
        </div>
      </section>

      {!loadingProperties && properties.length > 0 && (
        <PropertyGrid
          properties={properties}
          title="Featured Properties"
          subtitle={`Explore properties in ${city.title}`}
        />
      )}

      <ContactWithCta />
    </>
  );
}
