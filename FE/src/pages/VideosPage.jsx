import { useEffect, useMemo, useState } from 'react';
import './VideosPage.css';
import PageHero from '../components/PageHero';
import TitleHeader from '../components/TitleHeader';
import ContactSection from '../components/ContactSection';
import LoadingSpinner from '../components/LoadingSpinner';
import ButtonDali from '../components/ButtonDali';
import SEO from '../components/SEO';
import { api, endpoints } from '../config/api';

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
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
        const response = await api.get(`${endpoints.videos}?is_active=true&per_page=100`);
        if (!response?.success) {
          setError('Failed to load videos');
          return;
        }
        const list = (response?.data?.videos || [])
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setVideos(list);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos');
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

  return (
    <>
      <SEO 
        title="Videos"
        description="Watch video tours of luxury properties in Riviera Maya, Tulum, and Playa del Carmen. Get virtual walkthroughs and expert insights from Dalila Gelsomino."
        keywords="Riviera Maya property videos, Tulum real estate tours, virtual property tours Mexico, Playa del Carmen property videos"
        canonicalUrl="https://buywithdali.com/videos"
      />
      <PageHero breadcrumb="» Videos" />

      <section className="video-listing">
        <div className="video-listing-inner">
          <TitleHeader kicker="Our" title="Videos" />
          
          {loading && <LoadingSpinner />}

          {error && (
            <div className="video-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && videos.length === 0 && (
            <div className="video-empty">
              <p>No videos available at the moment.</p>
            </div>
          )}

          {!loading && !error && videos.map((video, index) => (
            <article className="video-row" key={video.id || index}>
              <div className="video-row-media">
                <a
                  href={video.video_url}
                  className="aios-video-popup"
                  aria-label={`Play ${video.title}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveVideo(video);
                  }}
                  style={{ position: 'relative', display: 'block', width: '100%', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }}
                >
                  {video.thumbnail_url ? (
                    <img 
                      src={toAbsoluteUrl(video.thumbnail_url)} 
                      alt={video.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('video-image-error');
                      }}
                    />
                  ) : (
                    <div className="video-placeholder">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="#c19280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="#c19280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 15L16 10L5 21" stroke="#c19280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div className="fv-play" style={{ pointerEvents: 'none' }}>
                    <div className="fv-outline">
                      <div className="fv-inline">
                        <i className="ai-font-play-button-a"></i>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
              <div className="video-row-body">
                <div className="video-meta"></div>
                <h2>{video.title}</h2>
                <p>{video.description}</p>
                <div className="video-row-actions">
                  <ButtonDali
                    href={video.video_url}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveVideo(video);
                    }}
                  >
                    Watch Video
                  </ButtonDali>
                </div>
              </div>
              {index !== videos.length - 1 && <div className="video-row-divider"></div>}
            </article>
          ))}
        </div>
      </section>

      <ContactSection />

      {activeVideo && (
        <div className="fv-modal" role="dialog" aria-modal="true" onClick={() => setActiveVideo(null)}>
          <div className="fv-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="fv-modal-close" aria-label="Close video" onClick={() => setActiveVideo(null)}>
              &times;
            </button>
            <div className="fv-modal-inner">
              <iframe
                src={`${activeVideo.video_url}?autoplay=1`}
                title={activeVideo.title || 'Video'}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
