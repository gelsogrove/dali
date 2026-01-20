import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, endpoints } from "../config/api";
import ContactSection from "../components/ContactSection";
import PageHero from "../components/PageHero";
import ButtonDali from "../components/ButtonDali";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = apiBase.replace(/\/api$/, '');

  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${assetBase}${url}`;
  };

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/blogs/slug/${slug}`);
        
        if (response.success) {
          setBlog(response.data);
          // Update page title
          document.title = `${response.data.title} - Buy with Dalila`;
          const metaDesc = document.querySelector('meta[name="description"]') || (() => {
            const m = document.createElement('meta');
            m.setAttribute('name', 'description');
            document.head.appendChild(m);
            return m;
          })();
          const summary = response.data.description || response.data.subtitle || '';
          if (summary) {
            metaDesc.setAttribute('content', summary.slice(0, 160));
          }
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to load blog');
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "100px 5%", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div style={{ padding: "100px 5%", textAlign: "center" }}>
        <h1>Post not found</h1>
        <p>The blog post you're looking for doesn't exist.</p>
        <Link to="/category/blog">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-breadcrumbs-wrap">
        <div className="page-breadcrumbs">
          <Link to="/">Home</Link> <span>»</span> <Link to="/category/blog">Blog</Link> <span>» <em style={{ fontStyle: 'italic', opacity: 0.7 }}>{blog.title}</em></span>
        </div>
      </div>
      <PageHero breadcrumb="» Blog" />

      <section className="blog-detail-section">
        <div className="blog-detail-container">
          <div className="blog-detail-header">
            <h1 className="blog-detail-title">{blog.title}</h1>
            
            {blog.subtitle && (
              <h2 className="blog-detail-subtitle">{blog.subtitle}</h2>
            )}
            
            <div className="blog-detail-meta">
              {formatDate(blog.published_date || blog.created_at)}
            </div>
          </div>

          {/* Content with floating image */}
          <div className="blog-detail-content">
            {blog.content_image ? (
              <div className="blog-detail-image-large">
                <img src={toAbsoluteUrl(blog.content_image)} alt={blog.title} />
              </div>
            ) : blog.featured_image ? (
              <div className="blog-detail-image-inline">
                <img src={toAbsoluteUrl(blog.featured_image)} alt={blog.title} />
              </div>
            ) : (
              <div className="blog-detail-image-inline blog-detail-image-placeholder">
                <i className="fa fa-newspaper blog-detail-image-placeholder-icon"></i>
              </div>
            )}
            
            <div className="blog-detail-body" dangerouslySetInnerHTML={{ __html: blog.content }} />
          </div>

          {/* Navigation */}
          <div className="blog-navigation">
            <ButtonDali href="/category/blog">
              ← Back to Blog
            </ButtonDali>
          </div>
        </div>
      </section>
      
      <ContactSection />
    </>
  );
};

export default BlogDetailPage;
