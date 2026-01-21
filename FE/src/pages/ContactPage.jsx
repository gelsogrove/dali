import { contactInfo } from '../data/homeData';
import './ContactPage.css';
import PageHero from '../components/PageHero';
import ContactSection from '../components/ContactSection';
import ContactCtaGrid from '../components/ContactCtaGrid';
import TitleHeader from '../components/TitleHeader';
import SEO from '../components/SEO';

export default function ContactPage() {
  return (
    <>
      <SEO 
        title="Contact Us"
        description="Get in touch with Dalila Gelsomino, your trusted real estate agent in Riviera Maya. Call, email, or schedule a consultation for luxury properties in Tulum and Playa del Carmen."
        keywords="contact real estate agent, Riviera Maya properties, Dalila Gelsomino contact, Tulum real estate agent"
        canonicalUrl="https://buywithdali.com/contact-us"
      />
      <PageHero breadcrumb="» Contact Us" />
      
      {/* Main Contact Section */}
      <section className="contact-main-section">
        <TitleHeader kicker="Let's" title="Connect" />
        
        <div className="contact-wrapper">
          
          {/* Contact Info Card */}
          <div className="contact-card" data-aos="fade-up" data-aos-duration="900" data-aos-delay="150">
            <div className="contact-card-header">
              <h2>Get In Touch</h2>
           
            </div>
            <div className="contact-card-body">
              <div className="contact-info-item">
                <div className="contact-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7293C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6407 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.18999 12.85C3.49997 10.2412 2.44824 7.27099 2.11999 4.18C2.095 3.90347 2.12787 3.62476 2.21649 3.36162C2.30512 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.10999 2H7.10999C7.5953 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.10999 3.72C9.23662 4.68007 9.47144 5.62273 9.80999 6.53C9.94454 6.88792 9.97366 7.27691 9.8939 7.65088C9.81415 8.02485 9.62886 8.36811 9.35999 8.64L8.08999 9.91C9.51355 12.4135 11.5864 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="contact-info-text">
                  <span className="contact-label">Call or WhatsApp</span>
                  <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} className="contact-value">{contactInfo.phone}</a>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 6L12 13L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="contact-info-text">
                  <span className="contact-label">Email Me</span>
                  <a href={`mailto:${contactInfo.email}`} className="contact-value">{contactInfo.email}</a>
                </div>
              </div>
              <div className="contact-info-item">
                <div className="contact-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              <div className="contact-info-text">
                <span className="contact-label">Location</span>
                <span className="contact-value">Playa del Carmen, Riviera Maya</span>
                <br/>
                <a
                  href="https://calendar.app.google/QoV7AeK9d3B62hqm7"
                  className="default-button contact-schedule-button "
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Schedule a Call
                </a>
              </div>
            </div>
          </div>
          </div>

          {/* Dalila Photo Card */}
          <div className="contact-profile-card" data-aos="fade-up" data-aos-duration="900" data-aos-delay="250">
            <div className="contact-profile-image">
              <img src="/images/IMG_4663-min.jpg" alt="Dalila Gelsomino" />
            </div>
            <div className="contact-profile-info">
              <h3>Dalila Gelsomino</h3>
              <p className="contact-profile-title">Licensed Real Estate Agent</p>
              <p className="contact-profile-desc">
                With over 7 years of experience in Riviera Maya, I specialize in luxury properties and personalized service.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Cards */}
      <section className="contact-cta-section">
        <div className="contact-cta-wrapper">
          <a href="/properties" className="contact-cta-modern" data-aos="fade-up" data-aos-duration="800">
            <div className="contact-cta-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Luxury Portfolio</h3>
            <p>Explore our exclusive properties</p>
          </a>
          <a href="/buyers-guide" className="contact-cta-modern" data-aos="fade-up" data-aos-duration="800" data-aos-delay="50">
            <div className="contact-cta-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Buyer's Guide</h3>
            <p>Download our comprehensive guide</p>
          </a>
          <a href="/search" className="contact-cta-modern" data-aos="fade-up" data-aos-duration="800" data-aos-delay="100">
            <div className="contact-cta-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21L16.65 16.65" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Property Search</h3>
            <p>Find your perfect home</p>
          </a>
          <a href="/valuation" className="contact-cta-modern" data-aos="fade-up" data-aos-duration="800" data-aos-delay="150">
            <div className="contact-cta-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7H7.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Property Value</h3>
            <p>Get a free valuation estimate</p>
          </a>
          <a href="/newsletter" className="contact-cta-modern" data-aos="fade-up" data-aos-duration="800" data-aos-delay="200">
            <div className="contact-cta-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Mailing List</h3>
            <p>Stay updated with market news</p>
          </a>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
