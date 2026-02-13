import './HomePage.css';
import SEO from '../components/SEO';
import GuidePopup from '../components/GuidePopup';
import HeroSlider from '../components/HeroSlider';
import WelcomeSection from '../components/WelcomeSection';
import FeaturedProperties from '../components/FeaturedProperties';
import FeaturedCities from '../components/FeaturedCities';
import WhyWork from '../components/WhyWork';
import Testimonials from '../components/Testimonials';
import CtaSection from '../components/CtaSection';
import FeaturedVideos from '../components/FeaturedVideos';
import BlogsSection from '../components/BlogsSection';
import ContactWithCta from '../components/ContactWithCta';

export default function HomePage() {
  return (
    <>
      <SEO
        title="Luxury Real Estate in Riviera Maya"
        description="Find your dream property in Riviera Maya with Dalila Gelsomino. Expert real estate services in Tulum, Playa del Carmen, Puerto Aventuras. Luxury homes, condos, and developments."
        keywords="Riviera Maya real estate, Tulum property, Playa del Carmen homes, luxury condos Mexico, beachfront property, Caribbean real estate, Dalila Gelsomino"
        ogTitle="Buy With Dali - Luxury Real Estate in Riviera Maya"
        ogDescription="Your trusted partner for luxury real estate in Mexico's Riviera Maya. Explore premium properties in Tulum, Playa del Carmen, and beyond."
        canonicalUrl="https://buywithdali.com/"
        breadcrumbs={[
          { name: 'Home', url: 'https://buywithdali.com/' }
        ]}
      />
      <GuidePopup />
      <HeroSlider />
      <WelcomeSection />
      <FeaturedProperties />
      <FeaturedCities />
      <WhyWork />
      <Testimonials />
      <CtaSection />
      <FeaturedVideos />
      <BlogsSection />
      <ContactWithCta />
    </>
  );
}
