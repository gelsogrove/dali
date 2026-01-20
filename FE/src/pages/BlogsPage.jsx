import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ContactSection from '../components/ContactSection';
import PageHero from '../components/PageHero';
import TitlePage from '../components/TitlePage';
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
          .filter((blog) => blog.is_active)
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
      <PageHero breadcrumb="» Blog" />

      <section className="blog-listing">
        <div className="blog-listing-inner">
          <TitlePage kicker="Our" title="Blog" className="blog-title-center" />
          
          {loading && (
            <div className="blog-loading">
              <p>Loading blogs...</p>
            </div>
          )}

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
                  {blog.featured_image ? (
                    <img 
                      src={toAbsoluteUrl(blog.featured_image)} 
                      alt={blog.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="blog-placeholder"></div>
                  )}
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
                <Link to={`/blog/${blog.slug}`} className="blog-readmore">
                  Read more
                </Link>
              </div>
              {index !== blogs.length - 1 && <div className="blog-row-divider"></div>}
            </article>
          ))}
        </div>
      </section>

      <ContactSection />
    </>
  );
}
