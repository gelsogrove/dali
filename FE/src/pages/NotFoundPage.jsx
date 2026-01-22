import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const NotFoundPage = () => {
  return (
    <>
      <SEO
        title="Page not found | Buy With Dali"
        description="The page you are looking for does not exist. Discover our latest blogs, properties and videos."
        canonicalUrl="https://buywithdali.com/404"
      />
      <section className="not-found-page">
        <div className="not-found-bg" aria-hidden="true" />
        <div className="not-found-inner">
          <p className="not-found-kicker">404</p>
          <h1 className="not-found-title">Page not found</h1>
          <p className="not-found-text">
            The link may be outdated or mistyped. Explore our latest stories and experiences from the Riviera Maya.
          </p>
          <div className="not-found-actions">
            <Link to="/" className="button-dali">Go to Home</Link>
            <Link to="/category/blog" className="button-dali outline">View Blogs</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default NotFoundPage;
