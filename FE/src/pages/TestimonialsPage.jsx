import PageHero from '../components/PageHero';
import ContactSection from '../components/ContactSection';
import TitlePage from '../components/TitlePage';
import { testimonials } from '../data/homeData';

export default function TestimonialsPage() {
  return (
    <>
      <PageHero breadcrumb="» Testimonials" />

      <section className="testimonials-full-section">
        <TitlePage kicker="Testimonials" title="Testimonials" variant="accent" />
        <div className="testimonials-full-wrapper">
          {testimonials.map((item) => (
            <article className="testimonial-full-card" key={item.author}>
              <p className="testimonial-full-quote">“{item.quote}”</p>
              <p className="testimonial-full-author">{item.author}</p>
            </article>
          ))}
        </div>
      </section>
      <ContactSection />
    </>
  );
}
