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
        const res = await api.get('/landing-pages?featured=1&is_active=1');
        setPages(res.data?.data || []);
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

  return (
    <section className="featured-landing-pages">
      <div className="container">
        <div className="landing-pages-grid">
          {pages.map((page) => (
              <div 
                key={page.id} 
                className="landing-page-card"
              onClick={() => navigate(`/${page.slug}`)}
              >
              {page.coverImage && (
                <div className="landing-page-card-image">
                  <img 
                    src={page.coverImage} 
                    alt={page.title}
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
