import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';
import PageHero from '../components/PageHero';
import SEO from '../components/SEO';

export default function HotDealsPage() {
  return (
    <>
      <SEO
        title="Hot Deals (Oportunidades) in Riviera Maya"
        description="Explore exclusive hot deals and limited-time opportunities in Riviera Maya. Hand-picked properties with exceptional value."
        keywords="hot deals Riviera Maya, oportunidades real estate, discounted properties Mexico, investment deals Tulum, Playa del Carmen real estate"
        ogTitle="Hot Deals (Oportunidades) - Buy With Dali"
        ogDescription="Discover exclusive hot deals and limited-time opportunities in Mexico's Riviera Maya."
        canonicalUrl="https://buywithdali.com/hot-deals"
        breadcrumbs={[
          { name: 'Home', url: 'https://buywithdali.com/' },
          { name: 'Hot Deals', url: 'https://buywithdali.com/hot-deals' }
        ]}
      />
      <PageHero breadcrumb="» Hot Deals" />
      <FeaturedProperties activeTab="hot" paginate pageSize={12} showTitle={true} disableAnimations={true} titleKicker="Hot" titleText="Deals" />
      <ContactWithCta />
    </>
  );
}
