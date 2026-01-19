import PageHero from '../components/PageHero';
import FeaturedProperties from '../components/FeaturedProperties';
import ContactSection from '../components/ContactSection';
import { properties } from '../data/propertiesData';

export default function PropertiesPage() {
  return (
    <>
      <PageHero breadcrumb="» Properties" />
      <FeaturedProperties activeTab="active" paginate pageSize={12} items={properties} />
      <ContactSection />
    </>
  );
}
