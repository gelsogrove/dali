import PageHero from '../components/PageHero';
import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';

export default function ActivePropertiesPage() {
  return (
    <>
      <PageHero breadcrumb="» Active Properties" />
      <section className="properties-body">
        <div className="container">
          <FeaturedProperties activeTab="active" paginate pageSize={12} />
        </div>
      </section>
      <ContactWithCta />
    </>
  );
}
