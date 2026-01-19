import PageHero from '../components/PageHero';
import ContactSection from '../components/ContactSection';
import TitlePage from '../components/TitlePage';
import { featuredCities } from '../data/homeData';

const toSlug = (href) => {
  if (!href) return '';
  const parts = href.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
};

export default function CommunitiesPage() {
  return (
    <>
      <PageHero breadcrumb="» Communities" />

      <section className="communities-intro">
        <TitlePage kicker="Neighborhood Guide" title="Communities" variant="accent" />
        <div className="communities-intro-copy">
          <p>
            Browse curated enclaves across Cancún, Playa del Carmen, and Tulum to find the vibe and lifestyle that fit you.
          </p>
        </div>
      </section>

      <section className="communities-grid-section">
        <div className="communities-grid-wrapper">
          {featuredCities.map((city) => (
            <div className="communities-city" key={city.id}>
              <div className="communities-city-head">
                <div>
                  <p className="communities-city-kicker">City</p>
                  <h3>{city.name}</h3>
                </div>
                <span className="communities-count">{city.communities.length} communities</span>
              </div>
              <div className="communities-card-grid">
                {city.communities.map((community) => {
                  const slug = toSlug(community.href);
                  const link = slug ? `/community/${slug}` : community.href;
                  return (
                  <a href={link} className="community-card" key={community.href}>
                    <div className="community-card-image">
                      <img src={community.image} alt={community.title} loading="lazy" />
                      <div className="community-card-gradient" />
                    </div>
                    <div className="community-card-body">
                      <h4>{community.title}</h4>
                      <span className="community-card-link">View neighborhood</span>
                    </div>
                  </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <ContactSection />
    </>
  );
}
