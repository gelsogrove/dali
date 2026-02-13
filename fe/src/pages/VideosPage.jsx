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
import { getEmbedUrl } from '../utils/videoHelpers';

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
                    style={{ position: 'relative', display: 'block', width: '100%', border: 'none', padding: 0, background: 'transparent', cursor: 'pointer' }}
                  >
                    <SafeImage
                      src={toAbsoluteUrl(video.thumbnail_url)} 
                      alt={video.thumbnail_alt || video.title}
                      loading="lazy"
                      placeholder="gradient"
                      style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                    <div className="fv-play" aria-hidden="true">
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

      {activeVideo && (
        <div className="fv-modal" role="dialog" aria-modal="true" onClick={() => setActiveVideo(null)}>
          <div className="fv-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="fv-modal-close" aria-label="Close video" onClick={() => setActiveVideo(null)}>
              &times;
            </button>
            <div className="fv-modal-inner">
              <iframe
                src={`${getEmbedUrl(activeVideo.video_url)}?autoplay=1`}
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
