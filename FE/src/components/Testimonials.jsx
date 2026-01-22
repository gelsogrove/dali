import { useEffect, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import { api, endpoints } from '../config/api';
import ButtonDali from './ButtonDali';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const res = await api.get(`${endpoints.testimonials}?is_active=true`);
        if (res?.success) {
          const ordered = (res.data?.testimonials || []).sort(
            (a, b) => (a.display_order || 0) - (b.display_order || 0)
          );
          setItems(ordered);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error('Failed to load testimonials', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <section id="testimonials">
      <div className="testi-container">
        <div className="testi-title section-title" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300">
          <strong>What Our</strong>
          <h2>Clients Say</h2>
        </div>

        {!loading && items.length === 0 && (
          <div className="text-center text-muted-foreground" style={{ padding: '20px 0' }}>
            Testimonials coming soon.
          </div>
        )}

        {items.length > 0 && (
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
              {items.map((item) => (
                <SplideSlide key={item.id || item.author} className="testi-list">
                  <div className="testi-quote">
                    <div
                      className="testi-quote-body"
                      dangerouslySetInnerHTML={{ __html: item.content || item.quote }}
                    />
                  </div>
                  <div className="testi-author">
                    <strong>{item.author}</strong>
                    {item.testimonial_date && <span className="testi-date">{formatDate(item.testimonial_date)}</span>}
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
        )}

        <div className="testi-link" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
          <ButtonDali href="/testimonials">
            View All Testimonials
          </ButtonDali>
        </div>
      </div>
    </section>
  );
}
