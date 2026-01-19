import { Splide, SplideSlide } from '@splidejs/react-splide';
import { heroSlides } from '../data/homeData';

export default function HeroSlider() {
  return (
    <div className="hp-slider">
      <div className="hp-slider-container">
        <div id="aios-slider-hp-slider" className="aios-slider aios-slider-template-default">
          <Splide
            aria-label="Featured homes"
            options={{
              type: 'fade',
              rewind: true,
              autoplay: true,
              speed: 1000,
              interval: 6000,
              pauseOnHover: false,
              pauseOnFocus: false,
              arrows: false,
              pagination: false,
              drag: false,
            }}
            className="aios-slider-splide"
          >
            {heroSlides.map((slide, index) => (
              <SplideSlide key={slide.src} className="aios-slider-slide" data-slide-number={index + 1}>
                <div className="aios-slider-img">
                  <img src={slide.src} alt={slide.alt} loading="lazy" />
                </div>
              </SplideSlide>
            ))}
          </Splide>
        </div>
      </div>
      <div className="hp-slider-overlay" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
        <h1 data-aos="fade-up" data-aos-duration="1000" data-aos-delay="400">Your Dream Home Awaits</h1>
      </div>
    </div>
  );
}
