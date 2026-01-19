import PageHero from '../components/PageHero';
import FeaturedProperties from '../components/FeaturedProperties';
import ContactSection from '../components/ContactSection';

export default function NewDevelopmentsPage() {
  return (
    <>
      <PageHero breadcrumb="» New Developments" />
      <section className="properties-body">
        <div className="container">
          <FeaturedProperties activeTab="new" paginate pageSize={12} />
        </div>
      </section>
      <ContactSection />
    </>
  );
}
