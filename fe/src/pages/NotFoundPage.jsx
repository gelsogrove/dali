import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="minimal-404">
      <SEO
        title="Page not found | Buy With Dali"
        description="The page you are looking for does not exist."
        canonicalUrl="https://new.buywithdali.com/404"
      />
      <div className="minimal-404-content">
        <div className="minimal-404-icon">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="55" stroke="#e9cf95" strokeWidth="3"/>
            <text x="60" y="75" fontSize="48" fontWeight="700" fill="#333" textAnchor="middle">404</text>
          </svg>
        </div>
        <h1>Page Not Found</h1>
        <p>Please check the webpage URL to make sure you have the correct address. It may also be possible that the content of this page is not yet ready for viewing. Feel free to revisit this page at another time or contact the website administrator for further assistance.</p>
        <Link to="/" className="minimal-404-button">Go to Home</Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
