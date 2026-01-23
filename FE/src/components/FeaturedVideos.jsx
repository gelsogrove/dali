import { useEffect, useMemo, useRef, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import ButtonDali from './ButtonDali';
import TitlePage from './TitlePage';
import { api, endpoints } from '../config/api';

export default function FeaturedVideos() {
  const sliderRef = useRef(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thumbErrors, setThumbErrors] = useState({});
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = useMemo(() => apiBase.replace(/\/api$/, ''), [apiBase]);

  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${assetBase}${url}`;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const res = await api.get(`${endpoints.videos}?is_home=1&limit=5`);
        if (res?.success) {
          const list = (res.data?.videos || []).sort(
            (a, b) => (a.display_order || 0) - (b.display_order || 0)
          );
          setItems(list);
        }
      } catch (err) {
        console.error('Failed to load videos', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    if (!activeVideo) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveVideo(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeVideo]);

  const handleVideoPrev = () => {
    if (sliderRef.current) {
      sliderRef.current.go('<');
    }
  };

  const handleVideoNext = () => {
    if (sliderRef.current) {
      sliderRef.current.go('>');
    }
  };

  const showArrows = items.length > 3;
  const hasItems = items.length > 0;

  return (
    <section id="featured-videos">
      <div className="fv-container">
        <TitlePage kicker="Our" title="Videos" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300" />
        {loading && (
          <div className="text-center text-muted-foreground" style={{ padding: '20px 0' }}>
            Loading videos...
          </div>
        )}
        {!loading && !hasItems && (
          <div className="text-center text-muted-foreground" style={{ padding: '20px 0' }}>
            Videos coming soon.
          </div>
        )}
        
        {/* Controls: prev/next (only if >3 videos) */}
        {hasItems && showArrows && (
          <div className="fv-controls" data-aos="fade-down" data-aos-duration="1000" data-aos-delay="300">
            <button
              className="prev"
              onClick={handleVideoPrev}
              aria-label="Previous Video"
            >
              <span className="hidden">Previous Featured Video Slide</span>
              <i className="ai-font-arrow-b"></i>
            </button>
            <button
              className="next"
              onClick={handleVideoNext}
              aria-label="Next Video"
            >
              <span className="hidden">Next Featured Video Slide</span>
              <i className="ai-font-arrow-b"></i>
            </button>
          </div>
        )}

        {/* Conditional: Slider if >3, static grid if ≤3 */}
        {hasItems && (
          <div className="fv-grid" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
            {items.length > 3 ? (
              <Splide
                ref={sliderRef}
                options={{
                  type: 'loop',
                  perPage: 3,
                  perMove: 1,
                  gap: '0px',
                  pagination: false,
                  arrows: false,
                  autoplay: true,
                  interval: 6000,
                  pauseOnHover: true,
                  pauseOnFocus: true,
                  drag: true,
                  breakpoints: {
                    991: {
                      perPage: 2,
                      gap: '0px',
                    },
                    767: {
                      perPage: 1,
                      gap: '0px',
                    },
                  },
                }}
              >
                {items.map((video, index) => (
                  <SplideSlide key={video.id || video.video_url || index}>
                    <div className="fv-list">
                      <a
                        href={video.video_url}
                        className="aios-video-popup"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Featured Video #${index + 1}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveVideo(video);
                        }}
                      >
                        <div className="fv-item-bg">
                          {video.thumbnail_url && !thumbErrors[video.id || video.video_url] ? (
                            <img
                              src={toAbsoluteUrl(video.thumbnail_url)}
                              alt={video.thumbnail_alt || video.title}
                              loading="lazy"
                              onError={() =>
                                setThumbErrors((prev) => ({
                                  ...prev,
                                  [video.id || video.video_url]: true,
                                }))
                              }
                            />
                          ) : (
                            <div className="fv-thumb-placeholder">
                              <div className="placeholder-box" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="fv-play">
                          <div className="fv-outline">
                            <div className="fv-inline">
                              <i className="ai-font-play-button-a"></i>
                            </div>
                          </div>
                        </div>
                      </a>
                    </div>
                  </SplideSlide>
                ))}
              </Splide>
            ) : (
              <div className="fv-grid-static">
                {items.map((video, index) => (
                  <div key={video.id || video.video_url || index} className="fv-list">
                    <a
                      href={video.video_url}
                      className="aios-video-popup"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Featured Video #${index + 1}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveVideo(video);
                      }}
                    >
                      <div className="fv-item-bg">
                        {video.thumbnail_url && !thumbErrors[video.id || video.video_url] ? (
                          <img
                            src={toAbsoluteUrl(video.thumbnail_url)}
                            alt={video.thumbnail_alt || video.title}
                            loading="lazy"
                            onError={() =>
                              setThumbErrors((prev) => ({
                                ...prev,
                                [video.id || video.video_url]: true,
                              }))
                            }
                          />
                        ) : (
                          <div className="fv-thumb-placeholder">
                            <div className="placeholder-box" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="fv-play">
                        <div className="fv-outline">
                          <div className="fv-inline">
                            <i className="ai-font-play-button-a"></i>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {hasItems && (
          <div className="fv-link" data-aos="fade-down" data-aos-duration="1000" data-aos-delay="300">
            <ButtonDali href="/videos">
              View All Videos
            </ButtonDali>
          </div>
        )}
      </div>

      {activeVideo && (
        <div className="fv-modal" role="dialog" aria-modal="true" onClick={() => setActiveVideo(null)}>
          <div className="fv-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="fv-modal-close" aria-label="Close video" onClick={() => setActiveVideo(null)}>
              &times;
            </button>
            <div className="fv-modal-inner">
              <iframe
                src={`${activeVideo.video_url}?autoplay=1`}
                title={activeVideo.title || 'Featured video'}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
