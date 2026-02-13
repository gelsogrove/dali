import { Link } from 'react-router-dom';

export default function PageHero({ breadcrumb }) {
  const truncateBreadcrumb = (content) => {
    if (!content) return '';
    // Converto a stringa e contiamo le parole
    const text = content.toString();
    const words = text.trim().split(/\s+/);
    
    if (words.length > 12) {
      return words.slice(0, 12).join(' ') + '...';
    }
    return content;
  };

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-overlay"></div>
      </section>
      <div className="page-breadcrumbs-wrap">
        <div className="page-breadcrumbs">
          <span className="breadcrumbs-content">
            <Link to="/">Home</Link> {breadcrumb && <>{truncateBreadcrumb(breadcrumb)}</>}
          </span>
        </div>
      </div>
    </>
  );
}
