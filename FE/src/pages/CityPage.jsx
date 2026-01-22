import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import ContactSection from '../components/ContactSection';
import SEO from '../components/SEO';
import { api } from '../config/api';

const mockProperties = [
  { title: 'Luxury Beachfront Condo', price: '$1,200,000', location: 'Riviera Maya' },
  { title: 'Modern Villa with Pool', price: '$980,000', location: 'Tulum' },
  { title: 'Downtown Penthouse', price: '$1,450,000', location: 'Playa del Carmen' },
  { title: 'Cozy Jungle Retreat', price: '$720,000', location: 'Tulum' },
  { title: 'Golf Course Residence', price: '$1,050,000', location: 'Playacar' },
  { title: 'Oceanview Apartment', price: '$890,000', location: 'Cancun' },
];

export default function CityPage() {
  const { citySlug } = useParams();
  const [city, setCity] = useState(null);
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
        <Link to="/communities">← Back to Communities</Link>
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
            <a href="/communities">Communities</a>
            {' '}<span>»</span>{' '}
            <span>{city.title}</span>
          </>
        } 
      />

      <section className="community-detail">
        <div className="community-detail-wrapper">
          <div className="community-header">
            <h1 className="community-page-title">{city.title}</h1>
            {city.subtitle && <p className="community-page-subtitle">{city.subtitle}</p>}
          </div>
          
          <div className="community-hero">
            {city.cover_image && !coverError ? (
              <img
                src={toAbsoluteUrl(city.cover_image)}
                alt={city.cover_image_alt || city.title}
                onError={() => setCoverError(true)}
              />
            ) : (
              <div className="blog-placeholder">
                <div className="placeholder-box" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="community-copy">
            {city.fullContent && (
              <div
                className="community-content"
                dangerouslySetInnerHTML={{ __html: city.fullContent }}
              />
            )}
            {city.content_image && !contentError ? (
              <div className="community-content-image">
                <img
                  src={toAbsoluteUrl(city.content_image)}
                  alt={city.content_image_alt || city.title}
                  onError={() => setContentError(true)}
                />
              </div>
            ) : (
              city.content_image && (
                <div className="community-content-image">
                  <div className="blog-placeholder">
                    <div className="placeholder-box" aria-hidden="true" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="community-properties">
        <div className="community-detail-wrapper">
          <h2 className="community-props-title">Featured Properties</h2>
          <div className="community-props-grid">
            {mockProperties.map((p, idx) => (
              <div key={idx} className="property-card">
                <div className="property-thumb">
                  <div className="placeholder-box" aria-hidden="true" />
                </div>
                <div className="property-body">
                  <p className="property-location text-muted-foreground text-xs uppercase tracking-wide">{p.location}</p>
                  <h3 className="property-title">{p.title}</h3>
                  <p className="property-price">{p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
