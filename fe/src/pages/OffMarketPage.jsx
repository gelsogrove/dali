import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';
import PageHero from '../components/PageHero';
import SEO from '../components/SEO';

export default function OffMarketPage() {
  return (
    <>
      <SEO
        title="Off Market Properties in Riviera Maya"
        description="Access private off market properties in Riviera Maya. Exclusive listings available by request."
        keywords="off market Riviera Maya, private listings Mexico, exclusive properties Tulum, Playa del Carmen off market"
        ogTitle="Off Market - Buy With Dali"
        ogDescription="Access private off market properties in Mexico's Riviera Maya."
        canonicalUrl="https://buywithdali.com/off-market"
        breadcrumbs={[
          { name: 'Home', url: 'https://buywithdali.com/' },
          { name: 'Off Market', url: 'https://buywithdali.com/off-market' }
        ]}
      />
      <PageHero breadcrumb="» Off Market" />
      <FeaturedProperties activeTab="off" paginate pageSize={12} showTitle={true} disableAnimations={true} titleKicker="Off" titleText="Market" />
      <ContactWithCta />
    </>
  );
}
