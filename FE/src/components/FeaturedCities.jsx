import { useEffect, useMemo, useRef, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';
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
          api.get('/areas?is_home=1')
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
    const result = [];
    cities.forEach((city, idx) => {
      const cityAreas = areas.filter((a) => a.city_id === city.id);
      if (cityAreas.length > 0) {
        result.push({ city, areas: cityAreas, idx });
      }
    });
    return result;
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
            {/* City Slider - one city at a time */}
            <Splide
              ref={citiesSliderRef}
              options={{
                type: grouped.length > 1 ? 'loop' : 'slide',
                perPage: 1,
                perMove: 1,
                gap: 0,
                pagination: false,
                arrows: false,
                autoplay: false,
                drag: grouped.length > 1,
                speed: 600,
              }}
            >
              {grouped.map(({ city, areas, idx }) => (
                <SplideSlide key={city.id || idx}>
                  <div className="fc-item">
                    {/* City name with prev/next controls for areas */}
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
                      <h3>{city.title || city.name}</h3>
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

                    {/* Areas Slider - 3 visible at a time */}
                    <div className="fc-grid" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
                      <Splide
                        ref={(instance) => {
                          if (instance) areaSliderRefs.current[city.id || idx] = instance;
                        }}
                        options={{
                          type: areas.length > 3 ? 'loop' : 'slide',
                          perPage: 3,
                          perMove: 1,
                          gap: '5px',
                          pagination: false,
                          arrows: false,
                          autoplay: true,
                          interval: 5000,
                          pauseOnHover: true,
                          pauseOnFocus: true,
                          drag: areas.length > 3,
                          breakpoints: {
                            991: {
                              perPage: 2,
                              gap: '5px',
                            },
                            767: {
                              perPage: 1,
                              gap: '5px',
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
                    </div>
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
        )}
      </div>
      <div className="wc-button">
        <ButtonDali href="/communities">
          View All Communities
        </ButtonDali>
      </div>
    </section>
  );
}
