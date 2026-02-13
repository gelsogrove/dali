import CanvasImage from './CanvasImage';
import { ctaCards } from '../data/homeData';

export default function CtaSection() {
  return (
    <section id="cta">
      <div className="cta-container">
        <div className="cta-grid">
          {ctaCards.map((card, index) => (
            <div
              className="cta-list"
              key={card.href}
              data-aos="flip-left"
              data-aos-duration="1000"
              data-aos-delay={index === 0 ? '400' : '700'}
            >
              <a href={card.href}>
                <div className="cta-list-bg">
                  <CanvasImage src={card.image} width={531} height={325} className="lazyload" />
                </div>
                <div className="cta-overlay">
                  <div className="cta-title">
                    <h3>{card.title}</h3>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
