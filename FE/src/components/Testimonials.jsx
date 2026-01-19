import { Splide, SplideSlide } from '@splidejs/react-splide';
import { testimonials } from '../data/homeData';

export default function Testimonials() {
  return (
    <section id="testimonials">
      <div className="testi-container">
        <div className="testi-title section-title" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300">
          <strong>What Our</strong>
          <h2>Clients Say</h2>
        </div>
        <div className="testi-grid" data-aos="fade-down" data-aos-duration="1000" data-aos-delay="300">
          <Splide
            aria-label="Testimonials"
            options={{
              type: 'loop',
              perPage: 1,
              perMove: 1,
              rewind: true,
              autoplay: true,
              interval: 5000,
              speed: 800,
              arrows: false,
              pagination: false,
              pauseOnHover: false,
              pauseOnFocus: false,
              resetProgress: false,
              drag: true,
            }}
          >
            {testimonials.map((item) => (
              <SplideSlide key={item.author} className="testi-list">
                <div className="testi-quote">
                  <p>{item.quote}</p>
                </div>
                <div className="testi-author">
                  <strong>{item.author}</strong>
                </div>
              </SplideSlide>
            ))}
          </Splide>
        </div>
        <div className="testi-link" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
          <a href="/testimonials" className="default-button">
            View All Testimonials
          </a>
        </div>
      </div>
    </section>
  );
}
