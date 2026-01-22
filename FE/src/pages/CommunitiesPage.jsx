import { useEffect, useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import ContactSection from '../components/ContactSection';
import TitlePage from '../components/TitlePage';
import { api } from '../config/api';

const toSlug = (href) => {
  if (!href) return '';
  const parts = href.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
};

export default function CommunitiesPage() {
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [thumbErrors, setThumbErrors] = useState({});

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = useMemo(() => {
    if (apiBase.startsWith('http')) return apiBase.replace(/\/api$/, '');
    return window.location.origin;
  }, [apiBase]);
  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${assetBase}${url}`;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [cRes, aRes] = await Promise.all([api.get('/cities'), api.get('/areas')]);
        const cList = cRes?.data?.cities ?? cRes?.data?.data?.cities ?? [];
        const aList = aRes?.data?.areas ?? aRes?.data?.data?.areas ?? [];
        setCities(cList);
        setAreas(aList);
      } catch (e) {
        console.error('Failed to load communities', e);
        setError('Unable to load communities right now.');
        setCities([]);
        setAreas([]);
      } finally {
        setLoading(false);
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

  return (
    <>
      <PageHero breadcrumb="» Communities" />

      <section className="communities-intro">
        <TitlePage kicker="Neighborhood Guide" title="Communities" variant="accent" />
        <div className="communities-intro-copy">
          <p>
            Browse curated enclaves across Cancún, Playa del Carmen, and Tulum to find the vibe and lifestyle that fit you.
          </p>
        </div>
      </section>

      <section className="communities-grid-section">
        <div className="communities-grid-wrapper">
          {loading && <div className="text-center text-muted-foreground">Loading communities…</div>}
          {!loading && error && <div className="text-center text-muted-foreground">{error}</div>}
          {!loading && !error && grouped.length === 0 && (
            <div className="text-center text-muted-foreground">Communities coming soon.</div>
          )}
          {!loading &&
            !error &&
            grouped.map(({ city, areas: cityAreas, count, idx }) => (
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
                                src={toAbsoluteUrl(community.cover_image)}
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

      <ContactSection />
    </>
  );
}
