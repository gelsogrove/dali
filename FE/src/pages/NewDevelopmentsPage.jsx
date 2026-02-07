import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';
import SEO from '../components/SEO';

export default function NewDevelopmentsPage() {
  return (
    <>
      <SEO
        title="New Developments in Riviera Maya"
        description="Discover pre-construction and new development projects in Riviera Maya. Invest in luxury condos, residential communities, and exclusive developments in Tulum and Playa del Carmen."
        keywords="new developments Riviera Maya, pre-construction Tulum, luxury condos Playa del Carmen, real estate investment Mexico, new projects Caribbean"
        ogTitle="New Developments - Buy With Dali"
        ogDescription="Explore exclusive new development opportunities in Mexico's Riviera Maya. Pre-construction prices and investment potential."
        canonicalUrl="https://buywithdali.com/new-developments"
        breadcrumbs={[
          { name: 'Home', url: 'https://buywithdali.com/' },
          { name: 'New Developments', url: 'https://buywithdali.com/new-developments' }
        ]}
      />
      <FeaturedProperties activeTab="new" paginate pageSize={12} showTitle={true} disableAnimations={true} />
      <ContactWithCta />
    </>
  );
}
