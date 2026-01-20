import { useEffect, useMemo, useState } from 'react';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import CanvasImage from './CanvasImage';
import { api } from '../config/api';
import ButtonDali from './ButtonDali';

export default function BlogsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = useMemo(() => apiBase.replace(/\/api$/, ''), [apiBase]);

  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${assetBase}${url}`;
  };

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/blogs?is_active=true&per_page=20');
        if (res?.success) {
          const sorted = (res.data?.blogs || []).sort(
            (a, b) => (a.display_order || 0) - (b.display_order || 0)
          );
          setItems(sorted);
        }
      } catch (err) {
        console.error('Failed to load blogs', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <section id="blogs">
      <div className="blogs-container">
        <div className="blogs-bg">
          <CanvasImage src="/images/blogs-bg-new.jpg" width={1600} height={900} className="lazyload" />
        </div>
        <div className="blogs-content">
          <div className="blogs-title section-title" data-aos="fade-right" data-aos-duration="1000" data-aos-delay="300">
            <strong>Featured</strong>
            <h2>Blogs</h2>
          </div>
          <div className="blogs-grid-div">
            {loading && <div className="text-center text-white">Loading blogs...</div>}
            <Splide
              aria-label="Featured blogs"
              options={{
                type: 'loop',
                perPage: 3,
                perMove: 1,
                gap: '25px',
                arrows: false,
                pagination: true,
                autoplay: true,
                interval: 3000,
                speed: 800,
                pauseOnHover: true,
                pauseOnFocus: false,
                resetProgress: false,
                breakpoints: {
                  1100: { perPage: 2 },
                  768: { perPage: 1 },
                },
              }}
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-delay="300"
            >
              {items.map((blog) => (
                <SplideSlide key={blog.id || blog.slug} className="blog-item">
                  <div className="blog-image">
                    <a href={`/blog/${blog.slug}`} aria-label={blog.title}>
                      <CanvasImage src={toAbsoluteUrl(blog.featured_image)} width={360} height={269} className="lazyload" />
                    </a>
                  </div>
                  <div className="blog-item-content">
                    <div className="blog-item-title">
                      <a href={`/blog/${blog.slug}`}>
                        <strong>{blog.title}</strong>
                      </a>
                    </div>
                    <div className="blog-item-date">{formatDate(blog.published_date || blog.created_at)}</div>
                    <div className="blog-item-description">
                      <p>{blog.description}</p>
                    </div>
                    <div className="blog-link">
                      <ButtonDali href={`/blog/${blog.slug}`}>
                        Learn More <span className="screen-reader-text">About {blog.title}</span>
                      </ButtonDali>
                    </div>
                  </div>
                </SplideSlide>
              ))}
            </Splide>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
            <ButtonDali href="/category/blog/">
              View More Blogs
            </ButtonDali>
          </div>
        </div>
      </div>
    </section>
  );
}
