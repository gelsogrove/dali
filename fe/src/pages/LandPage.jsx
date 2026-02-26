import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';
import PageHero from '../components/PageHero';
import SEO from '../components/SEO';

export default function LandPage() {
  return (
    <>
      <SEO
        title="Land for Sale in Riviera Maya"
        description="Browse land for sale in Riviera Maya. Discover lots and parcels in Tulum, Playa del Carmen, and beyond."
        keywords="land for sale Riviera Maya, lots Tulum, tierra Playa del Carmen, investment land Mexico"
        ogTitle="Land - Buy With Dali"
        ogDescription="Explore land opportunities in Mexico's Riviera Maya."
        canonicalUrl="https://buywithdali.com/land"
        breadcrumbs={[
          { name: 'Home', url: 'https://buywithdali.com/' },
          { name: 'Land', url: 'https://buywithdali.com/land' }
        ]}
      />
      <PageHero breadcrumb="» Land" />
      <FeaturedProperties activeTab="land" paginate pageSize={12} showTitle={true} disableAnimations={true} titleKicker="Land" titleText="Land" />
      <ContactWithCta />
    </>
  );
}
