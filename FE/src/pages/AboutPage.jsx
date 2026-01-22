import { Splide, SplideSlide } from '@splidejs/react-splide';
import { aboutContent, aboutTestimonials, aboutCTA } from '../data/aboutData';
import ContactSection from '../components/ContactSection';
import PageHero from '../components/PageHero';
import { contactInfo } from '../data/homeData';
import ContactCtaGrid from '../components/ContactCtaGrid';
import ButtonDali from '../components/ButtonDali';

export default function AboutPage() {
  return (
    <>
      <PageHero breadcrumb="» About" />

      {/* Main About Section */}
      <section className="about-section-new">
        <div className="about-container-new">
          <div className="about-content-grid">
            {/* Left: Text Content */}
            <div className="about-text-content" data-aos="fade-up" data-aos-duration="900" data-aos-delay="150">
              <div className="about-header-new">
                <h1>Dalila Gelsomino</h1>
                <p className="about-tagline">Your Trusted Real Estate Partner in Riviera Maya</p>
              </div>
              <div className="about-description-new">
                {aboutContent.paragraphs.map((p, index) => (
                  <p key={index} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </div>
              <div className="about-contact-info">
                <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} className="about-contact-link">
                  <i className="ai-font-phone"></i>
                  {contactInfo.phone}
                </a>
                <a href={`mailto:${contactInfo.email}`} className="about-contact-link">
                  <i className="ai-font-envelope"></i>
                  {contactInfo.email}
                </a>
                <ButtonDali
                  href="https://calendar.app.google/QoV7AeK9d3B62hqm7"
                  className="contact-schedule-button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule a Call
                </ButtonDali>
              </div>
            </div>

            {/* Right: Photo */}
            <div className="about-photo-content" data-aos="fade-up" data-aos-duration="900" data-aos-delay="250">
              <div className="about-photo-wrapper-new">
                <img src={aboutContent.image} alt="Dalila Gelsomino" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="about-testimonials-luxury">
        <div className="testimonials-luxury-container">
          <div className="testimonials-luxury-header" data-aos="fade-up" data-aos-duration="800">
            <span className="testimonials-subtitle">Success Stories</span>
            <h2>What Clients Say</h2>
            <div className="testimonials-divider"></div>
          </div>
          <div className="testimonials-slider-luxury" data-aos="fade-up" data-aos-duration="900" data-aos-delay="200">
            <Splide
              aria-label="Client testimonials"
              options={{
                type: 'loop',
                perPage: 1,
                arrows: false,
                pagination: false,
                autoplay: true,
                interval: 6000,
                speed: 1000,
                pauseOnHover: true,
                drag: true,
                flickPower: 600,
                flickMaxPages: 1,
              }}
            >
              {aboutTestimonials.map((item, index) => (
                <SplideSlide key={index}>
                  <div className="testimonial-card-luxury-slide">
                    <p className="testimonial-text-luxury">
                      <span className="quote-mark">"</span>{item.quote}<span className="quote-mark">"</span>
                    </p>
                    <div className="testimonial-footer-luxury">
                      <div className="testimonial-avatar">
                        <span>{item.name.charAt(0)}</span>
                      </div>
                      <div className="testimonial-info">
                        <h4>{item.name}</h4>
                      </div>
                    </div>
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
        </div>
      </section>

      {/* Shared CTA grid */}
      <ContactCtaGrid />

      <ContactSection />
    </>
  );
}
