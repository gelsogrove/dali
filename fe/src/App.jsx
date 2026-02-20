import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AOS from 'aos';
import RedirectChecker from './components/RedirectChecker';
import Header from './components/Header';
import SideMenu from './components/SideMenu';
import Footer from './components/Footer';
import MobileHeader from './components/MobileHeader';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PropertiesPage from './pages/PropertiesPage';
import SearchPage from './pages/SearchPage';
import BlogsPage from './pages/BlogsPage';
import BlogDetailPage from './pages/BlogDetailPage';
import TestimonialsPage from './pages/TestimonialsPage';
import ActivePropertiesPage from './pages/ActivePropertiesPage';
import NewDevelopmentsPage from './pages/NewDevelopmentsPage';
import HotDealsPage from './pages/HotDealsPage';
import LandPage from './pages/LandPage';
import VideosPage from './pages/VideosPage';
import CommunitiesPage from './pages/CommunitiesPage';
import ListWithDaliPage from './pages/ListWithDaliPage';
import OffMarketPage from './pages/OffMarketPage';
import CommunityPage from './pages/CommunityPage';
import CityPage from './pages/CityPage';
import AreaPage from './pages/AreaPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ListingDetailPage from './pages/ListingDetailPage';
import NotFoundPage from './pages/NotFoundPage';

// Redirect component for old /properties/:slug URLs
function PropertyRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/listings/${slug}`} replace />;
}

function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const forceFixedHeader = [
    '/active-properties',
    '/new-developments',
    '/hot-deals',
    '/land'
  ].includes(location.pathname);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <RedirectChecker>
      <div id="main-wrapper">
        <Header onToggleMenu={() => setMenuOpen(true)} forceFixed={forceFixedHeader} />
        <MobileHeader onToggleMenu={() => setMenuOpen(true)} />
        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact-us" element={<ContactPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/active-properties" element={<ActivePropertiesPage />} />
            <Route path="/new-developments" element={<NewDevelopmentsPage />} />
            <Route path="/hot-deals" element={<HotDealsPage />} />
            <Route path="/off-market" element={<OffMarketPage />} />
            <Route path="/land" element={<LandPage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/list-with-dali" element={<ListWithDaliPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/community/:citySlug/:areaSlug" element={<AreaPage />} />
            <Route path="/community/:citySlug" element={<CityPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/category/blog" element={<BlogsPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/listings/*" element={<ListingDetailPage />} />
            {/* Redirect old /properties/:slug to /listings/:slug */}
            <Route path="/properties/:slug" element={<PropertyRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </RedirectChecker>
  );
}

export default function App() {
  useEffect(() => {
    AOS.init({ once: false, duration: 1000, delay: 200, offset: 120 });
    const onLoad = () => AOS.refresh();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <AppLayout />
      </Router>
    </HelmetProvider>
  );
}
