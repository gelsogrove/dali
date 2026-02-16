import PageHero from '../components/PageHero';
import ContactWithCta from '../components/ContactWithCta';
import ButtonDali from '../components/ButtonDali';
import SEO from '../components/SEO';

export default function PropertiesPage() {
  return (
    <>
      <SEO
        title="Properties for Sale in Riviera Maya"
        description="Discover luxury properties for sale in Riviera Maya. Browse apartments, villas, condos, and homes in Tulum, Playa del Carmen, Puerto Aventuras with expert guidance."
        keywords="properties for sale Riviera Maya, Tulum homes, Playa del Carmen condos, luxury villas Mexico, real estate Mexico"
        ogTitle="Properties - Buy With Dali"
        ogDescription="Explore our complete selection of luxury properties in Mexico's Riviera Maya."
        canonicalUrl="https://buywithdali.com/properties"
        breadcrumbs={[
          { name: 'Home', url: 'https://buywithdali.com/' },
          { name: 'Properties', url: 'https://buywithdali.com/properties' }
        ]}
      />
      <PageHero breadcrumb="» Properties" />
      <section className="properties-body">
        <div className="container">
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '60px 0',
            flexWrap: 'wrap'
          }}>
            <ButtonDali href="/active-properties">
              Active Properties
            </ButtonDali>
            <ButtonDali href="/new-developments">
              New Developments
            </ButtonDali>
            <ButtonDali href="/hot-deals">
              Hot Deals
            </ButtonDali>
            <ButtonDali href="/land">
              Land
            </ButtonDali>
          </div>
        </div>
      </section>
      <ContactWithCta />
    </>
  );
}
