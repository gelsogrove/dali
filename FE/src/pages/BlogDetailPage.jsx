import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api, endpoints } from "../config/api";
import ContactWithCta from "../components/ContactWithCta";
import PageHero from "../components/PageHero";
import ButtonDali from "../components/ButtonDali";
import SEO from "../components/SEO";
import BlogsPage from "./BlogsPage";

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [canonicalUrl, setCanonicalUrl] = useState(null);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const assetBase = apiBase.replace(/\/api$/, '');

  const toAbsoluteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${assetBase}${url}`;
  };

  const buildMeta = (b) => {
    if (!b) return null;
    const meta = {};
    meta.title = b.seoTitle || b.title;
    meta.description =
      b.seoDescription ||
      b.description ||
      b.subtitle ||
      `Read ${b.title} - insights on Riviera Maya real estate from Dalila Gelsomino`;
    meta.ogTitle = b.ogTitle || meta.title;
    meta.ogDescription = b.ogDescription || meta.description;
    meta.ogImage = b.ogImage
      ? toAbsoluteUrl(b.ogImage)
      : b.content_image
      ? toAbsoluteUrl(b.content_image)
      : b.featured_image
      ? toAbsoluteUrl(b.featured_image)
      : undefined;
    meta.canonical = b.canonicalUrl || canonicalUrl || `https://buywithdali.com/blog/${slug}`;
    return meta;
  };

  useEffect(() => {
    let isMounted = true;

    const parseSlugFromUrl = (url) => {
      if (!url) return null;
      try {
        const parsed = url.startsWith('http') ? new URL(url).pathname : url;
        const match = parsed.match(/\/blog\/([^/?#]+)/);
        return match ? match[1] : null;
      } catch (e) {
        console.error('Failed to parse redirect target', e);
        return null;
      }
    };

    const load = async () => {
      setLoading(true);
      setError(null);
      setShowList(false);

      let slugToFetch = slug;
      let canonical = null;

      try {
        const res = await fetch(`/api/redirects/resolve?urlOld=/blog/${slug}`);
        if (res.ok) {
          const data = await res.json();
          const target = data?.data?.urlNew;
          const targetSlug = parseSlugFromUrl(target);
          // If the target is not a blog detail URL, go to that page (e.g., list page)
          if (target && !targetSlug) {
            if (target.includes('/category/blog')) {
              if (!isMounted) return;
              setShowList(true);
              setCanonicalUrl(target.startsWith('http') ? target : `https://buywithdali.com${target}`);
              setLoading(false);
              return;
            } else {
              window.location.href = target;
              return;
            }
          }
          if (targetSlug && targetSlug !== slug) {
            slugToFetch = targetSlug;
            canonical = target.startsWith('http') ? target : `https://buywithdali.com${target}`;
          }
        }
      } catch (e) {
        console.error('Redirect resolve failed', e);
      }

      try {
        const response = await api.get(`/blogs/slug/${slugToFetch}`);
        if (!isMounted) return;

        if (response.success) {
          setBlog(response.data);
          setCanonicalUrl(canonical || `https://buywithdali.com/blog/${slugToFetch}`);
        } else if (slugToFetch !== slug) {
          // fallback: attempt original slug if redirected slug missing
          const fallback = await api.get(`/blogs/slug/${slug}`);
          if (fallback.success) {
            setBlog(fallback.data);
            setCanonicalUrl(`https://buywithdali.com/blog/${slug}`);
          } else {
            setError('Blog not found');
          }
        } else {
          setError('Blog not found');
        }
      } catch (err) {
        console.error('Error fetching blog:', err);
        if (isMounted) setError('Failed to load blog');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
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

  if (showList) {
    return <BlogsPage />;
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
      {(() => {
        const meta = buildMeta(blog);
        if (!meta) return null;
        return (
          <SEO 
            title={meta.title}
            description={meta.description}
            ogTitle={meta.ogTitle}
            ogDescription={meta.ogDescription}
            keywords={`${blog.title}, Riviera Maya real estate, Tulum property, real estate blog`}
            ogImage={meta.ogImage}
            canonicalUrl={meta.canonical}
            ogType="article"
          />
        );
      })()}
      <PageHero
        breadcrumb={
          <>
            <span>»</span>{' '}
            <a href="/category/blog">Blog</a>
            {blog?.title && (
              <>
                {' '}<span>»</span>{' '}
                <span>{blog.title}</span>
              </>
            )}
          </>
        }
      />

      <section className="blog-detail-section">
        <div className="blog-detail-container">
          <div className="blog-detail-layout">
            <div className="blog-detail-header">
              <h1 className="blog-detail-title short">{blog.title}</h1>
              {(() => {
                const subtitle = blog.subtitle || blog.description;
                if (!subtitle) return null;
                return <h2 className="blog-detail-subtitle">{subtitle}</h2>;
              })()}
            </div>

            {/* Content with floating image */}
            <div className="blog-detail-content">
              {blog.content_image ? (
                <div className="blog-detail-image-large">
                  <img src={toAbsoluteUrl(blog.content_image)} alt={blog.content_image_alt || blog.title} />
                </div>
              ) : blog.featured_image ? (
                <div className="blog-detail-image-inline">
                  <img src={toAbsoluteUrl(blog.featured_image)} alt={blog.featured_image_alt || blog.title} />
                </div>
              ) : (
                <div className="blog-detail-image-inline blog-detail-image-placeholder">
                  <div className="placeholder-box" aria-hidden="true"></div>
                </div>
              )}
              
              <div className="blog-detail-body" dangerouslySetInnerHTML={{ __html: blog.content }} />
              
              <div className="blog-detail-meta">
                {formatDate(blog.published_date || blog.created_at)}
              </div>

            </div>
          </div>
        </div>
      </section>
      
      <ContactWithCta />
    </>
  );
};

export default BlogDetailPage;
