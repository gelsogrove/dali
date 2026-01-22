import './HomePage.css';
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
import ContactSection from '../components/ContactSection';

export default function HomePage() {
  return (
    <>
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
      <ContactSection />
    </>
  );
}
