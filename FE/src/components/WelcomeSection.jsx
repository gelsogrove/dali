import CanvasImage from './CanvasImage';
import { welcomeSection } from '../data/homeData';

export default function WelcomeSection() {
  return (
    <section id="welcome">
      <div className="wc-container">
        <div className="wc-image" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300">
          <CanvasImage src={welcomeSection.image} width={717} height={721} className="skip-lazyload" />
          <div className="wc-image-accent">
            <img className="skip-lazyload img-responsive" src={welcomeSection.accent} alt="accent" width="571" height="182" />
          </div>
        </div>
        <div className="wc-content" data-aos="fade-left" data-aos-duration="1000" data-aos-delay="300">
          <div className="wc-title section-title">
            <strong>{welcomeSection.kicker}</strong>
            <h2>{welcomeSection.heading}</h2>
          </div>
          <div className="wc-description">
            {welcomeSection.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="wc-button">
            <a href={welcomeSection.cta.href} className="default-button" target="_blank" rel="noopener noreferrer">
              {welcomeSection.cta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
