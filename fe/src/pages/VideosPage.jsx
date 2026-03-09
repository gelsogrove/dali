import { useEffect, useMemo, useState } from 'react';
import './VideosPage.css';
import PageHero from '../components/PageHero';
import TitleHeader from '../components/TitleHeader';
import ContactWithCta from '../components/ContactWithCta';
import LoadingSpinner from '../components/LoadingSpinner';
import ButtonDali from '../components/ButtonDali';
import SafeImage from '../components/SafeImage';
import SEO from '../components/SEO';
import { api, endpoints } from '../config/api';
import { getEmbedUrl, getVideoType } from '../utils/videoHelpers';

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
        const response = await api.get(`${endpoints.videos}?include_deleted=false&per_page=100`);
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

          {!loading && !error && videos.map((video, index) => {
            const openVideo = (e) => {
              if (e) e.preventDefault();
              setActiveVideo(video);
            };

            return (
              <article
                className="video-row"
                key={video.id || index}
                role="button"
                tabIndex={0}
                onClick={openVideo}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openVideo();
                  }
                }}
              >
                <div className="video-row-media">
                  <a
                    href={video.video_url}
                    className="aios-video-popup"
                    aria-label={`Play ${video.title}`}
                    onClick={openVideo}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', width: '100%', height: '100%', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }}
                  >
                    <SafeImage
                      src={toAbsoluteUrl(video.thumbnail_url)} 
                      alt={video.thumbnail_alt || video.title}
                      loading="lazy"
                      placeholder="gradient"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </a>
                </div>
                <div className="video-row-body">
                  <div className="video-meta"></div>
                  <h2>
                    <a
                      href={video.video_url}
                      onClick={openVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {video.title}
                    </a>
                  </h2>
                  <p>{video.description}</p>
                  <div className="video-row-actions">
                    <ButtonDali
                      href={video.video_url}
                      onClick={openVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Watch Video
                    </ButtonDali>
                  </div>
                </div>
                {index !== videos.length - 1 && <div className="video-row-divider"></div>}
              </article>
            );
          })}
        </div>
      </section>

      <ContactWithCta />

      {activeVideo && (() => {
        const provider = getVideoType(activeVideo.video_url);
        const isInstagram = provider === 'instagram';
        return (
          <div className="fv-modal" role="dialog" aria-modal="true" onClick={() => setActiveVideo(null)}>
            <div className={`fv-modal-content${isInstagram ? ' fv-modal-instagram' : ''}`} onClick={(e) => e.stopPropagation()}>
              <button className="fv-modal-close" aria-label="Close video" onClick={() => setActiveVideo(null)}>
                &times;
              </button>
              {isInstagram ? (
                <div className="fv-instagram-card">
                  {activeVideo.thumbnail_url && (
                    <div className="fv-instagram-thumb">
                      <img src={toAbsoluteUrl(activeVideo.thumbnail_url)} alt={activeVideo.title} />
                      <div className="fv-instagram-overlay">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="white"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </div>
                  )}
                  <div className="fv-instagram-info">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor" className="fv-instagram-icon"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    <h3>{activeVideo.title}</h3>
                    <p>This video is hosted on Instagram and cannot be played inline.</p>
                    <a
                      href={activeVideo.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fv-instagram-btn"
                    >
                      Watch on Instagram
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="fv-modal-inner">
                  <iframe
                    src={`${getEmbedUrl(activeVideo.video_url)}?autoplay=1`}
                    title={activeVideo.title || 'Video'}
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
