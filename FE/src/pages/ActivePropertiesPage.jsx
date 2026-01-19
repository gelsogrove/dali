import PageHero from '../components/PageHero';
import FeaturedProperties from '../components/FeaturedProperties';
import ContactSection from '../components/ContactSection';

export default function ActivePropertiesPage() {
  return (
    <>
      <PageHero breadcrumb="» Active Properties" />
      <section className="properties-body">
        <div className="container">
          <FeaturedProperties activeTab="active" paginate pageSize={12} />
        </div>
      </section>
      <ContactSection />
    </>
  );
}
