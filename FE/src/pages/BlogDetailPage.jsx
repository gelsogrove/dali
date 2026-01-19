import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, endpoints } from "../config/api";
import ContactSection from "../components/ContactSection";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <section className="page-hero">
        <div className="page-hero-overlay"></div>
      </section>
      <div className="page-breadcrumbs-wrap">
        <div className="page-breadcrumbs">
          <Link to="/">Home</Link> <span>»</span> <Link to="/category/blog">Blog</Link> <span>» <em style={{fontStyle: 'italic', opacity: 0.7}}>{blog.title}</em></span>
        </div>
      </div>

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

        {/* Featured Image */}
        {blog.featured_image && (
          <div className="blog-detail-image">
            <img src={blog.featured_image} alt={blog.title} />
          </div>
        )}

        {/* Content */}
        <div 
          className="blog-detail-content"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

          {/* Navigation */}
          <div className="blog-navigation">
            <Link to="/category/blog" className="blog-back-link">
              <i className="fa fa-arrow-left"></i>
              Back to Blog
            </Link>
          </div>
        </div>
      </section>
      
      <ContactSection />
    </>
  );
};

export default BlogDetailPage;