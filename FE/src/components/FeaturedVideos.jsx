import { useEffect, useRef, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import CanvasImage from './CanvasImage';
import { videos } from '../data/homeData';
import ButtonDali from './ButtonDali';

export default function FeaturedVideos() {
  const sliderRef = useRef(null);
  const [activeVideo, setActiveVideo] = useState(null);

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
    <section id="featured-videos">
      <div className="fv-container">
        <div className="fv-title section-title" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300">
          <h3>Featured</h3>
          <h2>VIDEOS</h2>
        </div>
        <Splide
          ref={sliderRef}
          className="fv-grid"
          options={{
            perPage: 2,
            gap: '30px',
            pagination: false,
            arrows: false,
            type: 'loop',
            autoplay: true,
            interval: 6000,
            breakpoints: {
              1200: { perPage: 2 },
              768: { perPage: 1 },
            },
          }}
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-delay="300"
        >
          {videos.map((video, index) => (
            <SplideSlide key={video.url} className="fv-list">
              <a
                href={video.url}
                className="aios-video-popup"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Featured Video #${index + 1}`}
                data-aos="zoom-in"
                data-aos-duration="1000"
                data-aos-delay="200"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveVideo(video);
                }}
              >
                <div className="fv-item-bg">
                  <CanvasImage src={video.image} width={1140} height={578} className="lazyload" />
                </div>
                <div className="fv-play">
                  <div className="fv-outline">
                    <div className="fv-inline">
                      <i className="ai-font-play-button-a"></i>
                    </div>
                  </div>
                </div>
              </a>
            </SplideSlide>
          ))}
        </Splide>

        <div id="fv" className="fv-link fc-controls fv-controls" data-aos="fade-down" data-aos-duration="1000" data-aos-delay="300">
          <a
            href="#"
            className="prev"
            aria-label="Previous Featured Video Slide"
            onClick={(e) => {
              e.preventDefault();
              sliderRef.current?.go('<');
            }}
          >
            <span className="hidden">Prev</span>
            <i className="ai-font-arrow-b"></i>
          </a>

          <ButtonDali href="/videos">
            View All Videos
          </ButtonDali>
          <a
            href="#"
            className="next"
            aria-label="Next Featured Video Slide"
            onClick={(e) => {
              e.preventDefault();
              sliderRef.current?.go('>');
            }}
          >
            <span className="hidden">Next</span>
            <i className="ai-font-arrow-b"></i>
          </a>
        </div>
      </div>

      {activeVideo && (
        <div className="fv-modal" role="dialog" aria-modal="true" onClick={() => setActiveVideo(null)}>
          <div className="fv-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="fv-modal-close" aria-label="Close video" onClick={() => setActiveVideo(null)}>
              &times;
            </button>
            <div className="fv-modal-inner">
              <iframe
                src={`${activeVideo.url}?autoplay=1`}
                title="Featured video"
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
