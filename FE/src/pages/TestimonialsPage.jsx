import { useEffect, useState } from 'react';
import PageHero from '../components/PageHero';
import ContactSection from '../components/ContactSection';
import TitlePage from '../components/TitlePage';
import { api, endpoints } from '../config/api';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function TestimonialsPage() {
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
    <>
      <PageHero breadcrumb="» Testimonials" />

      <section className="testimonials-full-section">
        <TitlePage
          kicker="our clients"
          title="Testimonials"
          subtitle="What clients say about working together"
          variant="accent"
        />

        {loading && (
          <div className="text-center text-muted-foreground" style={{ padding: '20px 0' }}>
            Loading testimonials...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center text-muted-foreground" style={{ padding: '20px 0' }}>
            Testimonials coming soon.
          </div>
        )}

        <div className="testimonials-full-wrapper">
          {items.map((item) => (
            <article className="testimonial-full-card" key={item.id || item.author}>
              <p
                className="testimonial-full-quote"
                dangerouslySetInnerHTML={{ __html: item.content || item.quote }}
              />
              <p className="testimonial-full-author">
                {item.author}
                {item.testimonial_date && (
                  <span className="testimonial-full-date"> — {formatDate(item.testimonial_date)}</span>
                )}
              </p>
            </article>
          ))}
        </div>
      </section>
      <ContactSection />
    </>
  );
}
