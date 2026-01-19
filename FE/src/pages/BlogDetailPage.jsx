import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { blogPosts } from "../data/blogPosts";
import ContactSection from "../components/ContactSection";
import PageHero from "../components/PageHero";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Find post by slug
  const post = useMemo(() => {
    return blogPosts.find(p => p.slug === slug);
  }, [slug]);

  useEffect(() => {
    if (post) {
      setCurrentPost(post);
      setLoading(false);
      // Update page title
      document.title = `${post.title} - Buy with Dalila`;
    } else {
      setLoading(false);
    }
  }, [post]);

  if (loading) {
    return (
      <div style={{ padding: "100px 5%", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentPost) {
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
          <Link to="/">Home</Link> <span>»</span> <Link to="/category/blog">Blog</Link> <span>» <em style={{fontStyle: 'italic', opacity: 0.7}}>{currentPost.title}</em></span>
        </div>
      </div>

      <section className="blog-detail-section">
        <div className="blog-detail-container">
          <div className="blog-detail-header">
            <h1 className="blog-detail-title">{currentPost.title}</h1>
            
            <div className="blog-detail-meta">
              {currentPost.date} {currentPost.author && `by ${currentPost.author}`}
            </div>
          </div>

        {/* Featured Image */}
        {currentPost.image && (
          <div className="blog-detail-image">
            <img src={currentPost.image} alt={currentPost.title} />
          </div>
        )}

        {/* Content */}
        <div 
          className="blog-detail-content"
          dangerouslySetInnerHTML={{ __html: currentPost.content }}
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