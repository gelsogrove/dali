import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';
import SEO from '../components/SEO';

export default function ActivePropertiesPage() {
  return (
    <>
      <SEO
        title="Active Properties for Sale"
        description="Browse active luxury properties for sale in Riviera Maya. Find apartments, villas, condos, and homes in Tulum, Playa del Carmen, Puerto Aventuras. Updated listings with prices in USD."
        keywords="properties for sale Riviera Maya, Tulum homes, Playa del Carmen condos, luxury villas Mexico, active listings, real estate Mexico"
        ogTitle="Active Properties - Buy With Dali"
        ogDescription="Explore our selection of luxury properties currently available in Mexico's Riviera Maya."
        canonicalUrl="https://buywithdali.com/active-properties"
        breadcrumbs={[
          { name: 'Home', url: 'https://buywithdali.com/' },
          { name: 'Active Properties', url: 'https://buywithdali.com/active-properties' }
        ]}
      />
      <FeaturedProperties activeTab="active" paginate pageSize={12} showTitle={true} disableAnimations={true} />
      <ContactWithCta />
    </>
  );
}
