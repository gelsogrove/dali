import PageHero from '../components/PageHero';
import FeaturedProperties from '../components/FeaturedProperties';
import ContactWithCta from '../components/ContactWithCta';

export default function NewDevelopmentsPage() {
  return (
    <>
      <PageHero breadcrumb="» New Developments" />
      <section className="properties-body">
        <div className="container">
          <FeaturedProperties activeTab="new" paginate pageSize={12} />
        </div>
      </section>
      <ContactWithCta />
    </>
  );
}
