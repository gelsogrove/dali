import { useState } from 'react';
import ImageWithOverlay from './ImageWithOverlay';
import TitleHeader from './TitleHeader';
import { featuredProperties } from '../data/homeData';
import ButtonDali from './ButtonDali';

export default function FeaturedProperties({ activeTab = 'properties', paginate = false, pageSize = 12, items }) {
  const data = items || featuredProperties;
  const [page, setPage] = useState(1);

  const totalPages = paginate ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  const start = paginate ? (page - 1) * pageSize : 0;
  const end = paginate ? start + pageSize : data.length;
  const visible = data.slice(start, end);

  const isActive = (tab) => activeTab === tab;

  return (
    <section id="featured-properties">
      <div className="fp-container">
        <TitleHeader kicker="Featured" title="Properties" className="fp-title" />
        <div className="fp-links" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
          <ButtonDali href="/active-properties" className={isActive('active') ? 'active' : ''}>
            Active Properties
          </ButtonDali>
          <ButtonDali href="/new-developments" className={isActive('new') ? 'active' : ''}>
            New Developments
          </ButtonDali>
        </div>
        <div className="fp-grid" data-aos="fade-up" data-aos-duration="1000" data-aos-delay="300">
          {visible.map((item) => {
            // Extract slug from href if not already present
            let link = item.href || '#';
            if (item.slug) {
              link = `/listings/${item.slug}/`;
            } else if (link.includes('/listings/')) {
              // Extract slug from full URL: https://...com/listings/slug-name/...
              const match = link.match(/\/listings\/([^/]+)\//);
              if (match) {
                link = `/listings/${match[1]}/`;
              }
            }

            const location = item.location || item.city || '';

            return (
            <div className="fp-list" key={item.href || item.id}>
              <a href={link} rel="noopener noreferrer">
                <ImageWithOverlay 
                  src={item.image} 
                  alt={item.title}
                  className="fp-list-item-image"
                  beds={item.beds}
                  baths={item.baths}
                  size={item.size}
                  status="FOR SALE"
                  location={location}
                >
                  <div className="fp-item-price">
                    <h3>{item.price || 'Price on Request'}</h3>
                  </div>
                  <div className="fp-item-address">
                    <h4>{item.title}</h4>
                  </div>
                </ImageWithOverlay>
              </a>
            </div>
            );
          })}
        </div>
        {paginate && totalPages > 1 && (
          <div className="fp-pagination" data-aos="fade-up" data-aos-duration="800" data-aos-delay="300">
            <button
              className="fp-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="fp-page-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="fp-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
