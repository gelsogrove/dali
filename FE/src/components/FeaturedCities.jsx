import { useRef } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import CanvasImage from './CanvasImage';
import { featuredCities } from '../data/homeData';
import ButtonDali from './ButtonDali';

export default function FeaturedCities() {
  const sliderRefs = useRef({});

  const handlePrev = (id) => {
    sliderRefs.current[id]?.go('<');
  };

  const handleNext = (id) => {
    sliderRefs.current[id]?.go('>');
  };

  return (
    <section id="featured-cities">
      <div className="fc-container">
        {featuredCities.map((city, index) => (
          <div className="fc-item" key={city.id}>
            {index === 0 && (
              <div className="fc-title section-title" data-aos="fade-down" data-aos-duration="1000" data-aos-delay="300">
                <h3>Featured</h3>
                <h2>Cities</h2>
              </div>
            )}
            <div className="fc-controls" data-aos="fade-down" data-aos-duration="1000" data-aos-delay="300">
              <a
                href="#"
                className="prev"
                aria-label="Prev"
                onClick={(e) => {
                  e.preventDefault();
                  handlePrev(city.id);
                }}
              >
                <span className="hidden">Previous Featured Communities Slide</span>
                <i className="ai-font-arrow-b"></i>
              </a>
              <h3>{city.name}</h3>
              <a
                href="#"
                className="next"
                aria-label="Next"
                onClick={(e) => {
                  e.preventDefault();
                  handleNext(city.id);
                }}
              >
                <span className="hidden">Next Featured Communities Slide</span>
                <i className="ai-font-arrow-b"></i>
              </a>
            </div>
            <Splide
              ref={(instance) => {
                if (instance) sliderRefs.current[city.id] = instance;
              }}
              className="fc-grid"
              options={{
                perPage: 3,
                gap: '20px',
                pagination: false,
                arrows: false,
                type: 'loop',
                autoplay: true,
                interval: 5000,
                breakpoints: {
                  1100: { perPage: 2 },
                  768: { perPage: 1 },
                },
              }}
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="300"
            >
              {city.communities.map((community) => (
                <SplideSlide key={community.href} className="fc-list">
                  <a href={community.href}>
                    <div className="fc-item-image">
                      <CanvasImage src={community.image} width={532} height={325} className="lazyload" />
                    </div>
                    <div className="fc-item-overlay">
                      <strong>{community.title}</strong>
                    </div>
                  </a>
                </SplideSlide>
              ))}
            </Splide>
          </div>
        ))}
      </div>
      <div className="wc-button">
        <ButtonDali href="/communities">
          View All Communities
        </ButtonDali>
      </div>
    </section>
  );
}
