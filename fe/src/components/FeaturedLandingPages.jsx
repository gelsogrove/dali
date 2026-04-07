import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../config/api';
import './FeaturedLandingPages.css';

export default function FeaturedLandingPages() {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await api.get('/landing-pages?is_active=1');
        const allPages = res.data?.landing_pages || [];
        console.log('FeaturedLandingPages: Fetched', allPages.length, 'pages', res);
        setPages(allPages);
      } catch (error) {
        console.error('Error fetching landing pages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, []);

  if (isLoading || !pages || pages.length === 0) {
    return null;
  }

  // Show ALL landing pages (not just 2)
  const allPages = [...pages]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  return (
    <section className="featured-landing-pages">
      <div className="flp-container">
        <div className="flp-title section-title" data-aos="fade-down" data-aos-duration="1000" data-aos-delay="300">
          <h3>Explore Our</h3>
          <h2>Services</h2>
        </div>
        <div className="landing-pages-grid">
          {allPages.map((page) => (
            <div 
              key={page.id} 
              className="landing-page-card"
              onClick={() => navigate(`/${page.slug}`)}
            >
              {(page.content_block_1_image || page.cover_image) && (
                <div className="landing-page-card-image">
                  <img 
                    src={page.content_block_1_image || page.cover_image} 
                    alt={page.cover_image_alt || page.title}
                    loading="lazy"
                  />
                  <div className="landing-page-card-overlay"></div>
                </div>
              )}
              <div className="landing-page-card-content">
                <h3>{page.title}</h3>
                {page.subtitle && <p className="subtitle">{page.subtitle}</p>}
                {page.description && <p className="description">{page.description}</p>}
                <button className="cta-button">
                  Learn More
                  <span className="arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
