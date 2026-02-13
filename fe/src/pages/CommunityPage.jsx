import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import ContactWithCta from '../components/ContactWithCta';
import TitlePage from '../components/TitlePage';
import { featuredCities } from '../data/homeData';

const flattenCommunities = () => {
  const list = [];
  featuredCities.forEach((city) => {
    city.communities.forEach((community) => {
      const parts = community.href.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] || community.title.toLowerCase().replace(/\s+/g, '-');
      list.push({ ...community, slug, city: city.name });
    });
  });
  return list;
};

export default function CommunityPage() {
  const { slug } = useParams();

  const community = useMemo(() => {
    const all = flattenCommunities();
    return all.find((c) => c.slug === slug);
  }, [slug]);

  if (!community) {
    return (
      <>
        <PageHero breadcrumb="» Community" />
        <section className="community-detail">
          <div className="community-detail-wrapper">
            <h1>Community not found</h1>
            <p>Please return to Communities to browse available neighborhoods.</p>
            <a href="/communities" className="default-button">Back to Communities</a>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero breadcrumb={`» Communities » ${community.title}`} />

      <section className="community-intro">
        <TitlePage kicker={community.city} title={community.title} variant="accent" />
        <div className="community-intro-copy">
          <p>
            Discover the lifestyle, amenities, and charm of {community.title} in {community.city}. Explore available listings and learn what makes this enclave unique.
          </p>
          <div className="community-hero-actions">
            <a href="/properties" className="default-button">View Properties</a>
            <a href="/contact-us" className="default-button ghost">Schedule a Call</a>
          </div>
        </div>
      </section>

      <section className="community-detail">
        <div className="community-detail-wrapper">
          <div className="community-detail-card">
            <h3>About {community.title}</h3>
            <p>
              {community.title} is one of the featured enclaves in {community.city}. Reach out to learn more about available listings,
              lifestyle perks, and the best opportunities in this neighborhood.
            </p>
            <ul className="community-highlights">
              <li>Curated properties across Riviera Maya</li>
              <li>Guided tours and investment insights</li>
              <li>Concierge support from first visit to closing</li>
            </ul>
          </div>
        </div>
      </section>

      <ContactWithCta />
    </>
  );
}
