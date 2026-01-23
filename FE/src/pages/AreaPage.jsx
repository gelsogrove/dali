import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import ContactWithCta from '../components/ContactWithCta';
import SEO from '../components/SEO';
import { api } from '../config/api';

const mockProperties = [
  { title: 'Boutique Villa', price: '$780,000', location: 'Tulum' },
  { title: 'Canal-view Condo', price: '$640,000', location: 'Playa del Carmen' },
  { title: 'Jungle Loft', price: '$520,000', location: 'Tulum' },
  { title: 'Beachfront Suite', price: '$1,050,000', location: 'Riviera Maya' },
  { title: 'Modern Duplex', price: '$690,000', location: 'Cancun' },
  { title: 'Golf Residence', price: '$880,000', location: 'Playacar' },
];

export default function AreaPage() {
  const { citySlug, areaSlug } = useParams();
  const [area, setArea] = useState(null);
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
      const [areaRes, cityRes] = await Promise.all([
        api.get(`/areas/slug/${citySlug}/${areaSlug}`),
        api.get(`/cities/slug/${citySlug}`)
      ]);
      
      if (areaRes?.success) {
        setArea(areaRes.data);
      } else {
        setError('Area not found');
      }
      
      if (cityRes?.success) {
        setCity(cityRes.data);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load area');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [citySlug, areaSlug]);

  const meta = useMemo(() => {
    if (!area) return null;
    const title = area.seoTitle || area.title;
    const description =
      area.seoDescription ||
      area.subtitle ||
      `Explore ${area.title} in ${area.city_slug || ''} with curated properties and lifestyle highlights.`;
    const ogImage =
      area.ogImage
        ? toAbsoluteUrl(area.ogImage)
        : area.content_image
        ? toAbsoluteUrl(area.content_image)
        : area.cover_image
        ? toAbsoluteUrl(area.cover_image)
        : undefined;
    return {
      title,
      description,
      ogTitle: area.ogTitle || title,
      ogDescription: area.ogDescription || description,
      ogImage,
      canonical: area.canonicalUrl || `https://buywithdali.com/community/${area.city_slug}/${area.slug}`,
    };
  }, [area]);

  if (loading) {
    return <div style={{ padding: '100px 5%', textAlign: 'center' }}>Loading...</div>;
  }

  if (error || !area) {
    return (
      <div style={{ padding: '100px 5%', textAlign: 'center' }}>
        <h1>Area not found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/communities">← Back to Communities</a>
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
          keywords={area.keywords || ''}
          ogType="article"
        />
      )}
      <PageHero 
        breadcrumb={
          <>
            <span>»</span>{' '}
            <a href="/communities">Communities</a>
            {' '}<span>»</span>{' '}
            <a href={`/community/${citySlug}`}>
              {city?.title || citySlug}
            </a>
            {' '}<span>»</span>{' '}
            <span>{area.title}</span>
          </>
        } 
      />

      <section className="community-detail">
        <div className="community-detail-wrapper">
          <div className="community-header">
            <h1 className="community-page-title">{area.title}</h1>
            {area.subtitle && <p className="community-page-subtitle">{area.subtitle}</p>}
          </div>
          
          <div className="community-hero">
            {(() => {
              // Priorità: content_image > cover_image
              const imageUrl = area.content_image || area.cover_image;
              const imageAlt = area.content_image 
                ? (area.content_image_alt || area.title)
                : (area.cover_image_alt || area.title);
              const hasError = area.content_image ? contentError : coverError;
              
              if (imageUrl && !hasError) {
                return (
                  <img
                    src={toAbsoluteUrl(imageUrl)}
                    alt={imageAlt}
                    onError={() => {
                      if (area.content_image) {
                        setContentError(true);
                      } else {
                        setCoverError(true);
                      }
                    }}
                  />
                );
              }
              
              return (
                <div className="blog-placeholder">
                  <div className="placeholder-box" aria-hidden="true" />
                </div>
              );
            })()}
          </div>
          <div className="community-copy">
            {area.fullContent && (
              <div
                className="community-content"
                dangerouslySetInnerHTML={{ __html: area.fullContent }}
              />
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

      <ContactWithCta />
    </>
  );
}
