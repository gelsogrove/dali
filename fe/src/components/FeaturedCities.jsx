import { useEffect, useMemo, useRef, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
import './FeaturedCities.css';
import ButtonDali from './ButtonDali';
import { api } from '../config/api';

export default function FeaturedCities() {
  const areaSliderRefs = useRef({});
  const citiesSliderRef = useRef(null);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
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
      try {
        const [citiesRes, areasRes] = await Promise.all([
          api.get('/cities?is_home=1'),
          api.get('/areas')
        ]);
        const cList = citiesRes?.data?.cities ?? citiesRes?.data?.data?.cities ?? [];
        const aList = areasRes?.data?.areas ?? areasRes?.data?.data?.areas ?? [];
        setCities(cList);
        setAreas(aList);
      } catch (e) {
        console.error('Failed to load cities/areas', e);
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
      return { city, areas: cityAreas, idx };
    });
  }, [cities, areas]);

  const handleAreaPrev = (cityId) => {
    const slider = areaSliderRefs.current[cityId];
    if (slider) slider.go('<');
  };

  const handleAreaNext = (cityId) => {
    const slider = areaSliderRefs.current[cityId];
    if (slider) slider.go('>');
  };

  return (
    <section id="featured-cities">
      <div className="fc-container">
        <div className="fc-title section-title" data-aos="fade-down" data-aos-duration="1000" data-aos-delay="300">
          <h3>Featured</h3>
          <h2>Cities</h2>
        </div>
        
        {loading && <div className="text-center text-muted-foreground" style={{ padding: '20px 0' }}>Loading...</div>}
        {!loading && grouped.length === 0 && (
          <div className="text-center text-muted-foreground" style={{ padding: '20px 0' }}>
            Communities coming soon.
          </div>
        )}
        
        {!loading && grouped.length > 0 && (
          <div className="fc-cities-wrapper">
            {/* All cities displayed vertically - like original site */}
            {grouped.map(({ city, areas, idx }) => (
              <div key={city.id || idx} className="fc-city-section">
                {/* City name with prev/next controls - show if more than 3 areas */}
                <div className="fc-controls">
                  {areas.length > 3 && (
                    <button
                      className="prev"
                      onClick={() => handleAreaPrev(city.id || idx)}
                      aria-label="Previous Area"
                    >
                      <span className="hidden">Previous Featured Communities Slide</span>
                      <i className="ai-font-arrow-b"></i>
                    </button>
                  )}
                  <a href={`/community/${city.slug}`} className="fc-controls-city-link">
                    <h3>{city.title || city.name}</h3>
                  </a>
                  {areas.length > 3 && (
                    <button
                      className="next"
                      onClick={() => handleAreaNext(city.id || idx)}
                      aria-label="Next Area"
                    >
                      <span className="hidden">Next Featured Communities Slide</span>
                      <i className="ai-font-arrow-b"></i>
                    </button>
                  )}
                </div>

                {/* Slider if more than 1 area, static grid if 1 area, city card if no areas */}
                <div className="fc-grid" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
                  {areas.length === 0 ? (
                    /* No areas: show the city itself as a single card */
                    <div className="fc-grid-static">
                      <div className="fc-list static">
                        <a href={`/community/${city.slug}`}>
                          <div className="fc-item-image">
                            {city.cover_image && !thumbErrors[`city-${city.id}`] ? (
                              <img
                                src={toAbsoluteUrl(city.cover_image)}
                                alt={city.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                onError={() =>
                                  setThumbErrors((prev) => ({ ...prev, [`city-${city.id}`]: true }))
                                }
                              />
                            ) : (
                              <div className="blog-placeholder" style={{ height: '100%' }}>
                                <div className="placeholder-box" aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          <div className="fc-item-overlay">
                            <strong>{city.title}</strong>
                          </div>
                        </a>
                      </div>
                    </div>
                  ) : areas.length > 1 ? (
                    <Splide
                      ref={(instance) => {
                        if (instance) areaSliderRefs.current[city.id || idx] = instance;
                      }}
                      options={{
                        type: 'loop',
                        perPage: 3,
                        perMove: 1,
                        gap: '20px',
                        pagination: false,
                        arrows: false,
                        autoplay: true,
                        interval: 5000,
                        pauseOnHover: true,
                        pauseOnFocus: true,
                        drag: true,
                        breakpoints: {
                          991: {
                            perPage: 2,
                            gap: '12px',
                          },
                          767: {
                            perPage: 1,
                            gap: '12px',
                          },
                        },
                      }}
                    >
                      {areas.map((community) => (
                        <SplideSlide key={`${community.slug}-${community.city_id || idx}`}>
                          <div className="fc-list">
                            <a href={`/community/${city.slug}/${community.slug}`}>
                              <div className="fc-item-image">
                                {community.cover_image && !thumbErrors[`${community.slug}-${community.city_id || idx}`] ? (
                                  <img
                                    src={toAbsoluteUrl(community.cover_image)}
                                    alt={community.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={() =>
                                      setThumbErrors((prev) => ({ ...prev, [`${community.slug}-${community.city_id || idx}`]: true }))
                                    }
                                  />
                                ) : (
                                  <div className="blog-placeholder" style={{ height: '100%' }}>
                                    <div className="placeholder-box" aria-hidden="true" />
                                  </div>
                                )}
                              </div>
                              <div className="fc-item-overlay">
                                <strong>{community.title}</strong>
                              </div>
                            </a>
                          </div>
                        </SplideSlide>
                      ))}
                    </Splide>
                  ) : (
                    <div className="fc-grid-static">
                      {areas.map((community) => (
                        <div key={`${community.slug}-${community.city_id || idx}`} className="fc-list">
                          <a href={`/community/${city.slug}/${community.slug}`}>
                            <div className="fc-item-image">
                              {community.cover_image && !thumbErrors[`${community.slug}-${community.city_id || idx}`] ? (
                                <img
                                  src={toAbsoluteUrl(community.cover_image)}
                                  alt={community.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  onError={() =>
                                    setThumbErrors((prev) => ({ ...prev, [`${community.slug}-${community.city_id || idx}`]: true }))
                                  }
                                />
                              ) : (
                                <div className="blog-placeholder" style={{ height: '100%' }}>
                                  <div className="placeholder-box" aria-hidden="true" />
                                </div>
                              )}
                            </div>
                            <div className="fc-item-overlay">
                              <strong>{community.title}</strong>
                            </div>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="wc-button">
        <ButtonDali href="/search">
          View All Communities
        </ButtonDali>
      </div>
    </section>
  );
}
