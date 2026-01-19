import { Link } from 'react-router-dom';
import ContactSection from '../components/ContactSection';
import PageHero from '../components/PageHero';
import TitlePage from '../components/TitlePage';
import { blogPosts } from '../data/blogPosts';

export default function BlogsPage() {
  return (
    <>
      <PageHero breadcrumb="» Blog" />

      <section className="blog-listing">
        <div className="blog-listing-inner">
          <TitlePage kicker="Our" title="Blog" />
          {blogPosts.map((post, index) => (
            <article className="blog-row" key={post.id}>
              <div className="blog-row-media">
                {post.image ? (
                  <img src={post.image} alt={post.title} />
                ) : (
                  <div className="blog-placeholder"></div>
                )}
              </div>
              <div className="blog-row-body">
                <div className="blog-meta">{post.date}</div>
                <h2><Link to={`/blog/${post.slug}`}>{post.title}</Link></h2>
                <p>{post.excerpt}</p>
                <Link to={`/blog/${post.slug}`} className="blog-readmore">
                  Read more
                </Link>
              </div>
              {index !== blogPosts.length - 1 && <div className="blog-row-divider"></div>}
            </article>
          ))}
        </div>
      </section>

      <ContactSection />
    </>
  );
}
