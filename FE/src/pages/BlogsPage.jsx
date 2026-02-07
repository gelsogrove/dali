import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ContactWithCta from '../components/ContactWithCta';
import PageHero from '../components/PageHero';
import TitleHeader from '../components/TitleHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ButtonDali from '../components/ButtonDali';
import SafeImage from '../components/SafeImage';
import SEO from '../components/SEO';
import { api, endpoints } from '../config/api';

export default function BlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = apiBase.replace(/\/api$/, '');

  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${assetBase}${url}`;
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await api.get(endpoints.blogs);
        console.debug('Blogs API response', response);

        if (!response?.success) {
          console.error('Blogs API not successful', response);
          setError('Failed to load blogs');
          return;
        }

        const list = (response?.data?.blogs || [])
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        setBlogs(list);
      } catch (err) {
        console.error('Error fetching blogs:', err);
        setError('Failed to load blogs');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <SEO 
        title="Blog"
        description="Read the latest insights on Riviera Maya real estate, property investment tips, market trends, and lifestyle guides for Tulum and Playa del Carmen."
        keywords="Riviera Maya real estate blog, Tulum property tips, real estate investment Mexico, Playa del Carmen lifestyle"
        canonicalUrl="https://buywithdali.com/category/blog"
      />
      <PageHero breadcrumb="» Blog" />

      <section className="blog-listing">
        <div className="blog-listing-inner">
          <TitleHeader kicker="Our" title="Blog" />
          
          {loading && <LoadingSpinner />}

          {error && (
            <div className="blog-error">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && blogs.length === 0 && (
            <div className="blog-empty">
              <p>No blogs available at the moment.</p>
            </div>
          )}

          {!loading && !error && blogs.map((blog, index) => (
            <article className="blog-row" key={blog.id}>
              <div className="blog-row-media">
                <Link to={`/blog/${blog.slug}`}>
                  <SafeImage
                    src={toAbsoluteUrl(blog.featured_image)} 
                    alt={blog.featured_image_alt || blog.title}
                    loading="lazy"
                    placeholder="gradient"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Link>
              </div>
              <div className="blog-row-body">
                <div className="blog-meta">
                  {formatDate(blog.published_date || blog.created_at)}
                </div>
                <h2>
                  <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
                </h2>
                <p>{blog.description}</p>
                <div className="blog-row-actions">
                  <Link to={`/blog/${blog.slug}`} className="button-dali">
                    Read More
                  </Link>
                </div>
              </div>
              {index !== blogs.length - 1 && <div className="blog-row-divider"></div>}
            </article>
          ))}
        </div>
      </section>

      <ContactWithCta />
    </>
  );
}
