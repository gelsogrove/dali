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

// Layout with header/footer for normal pages
function MainLayout({ children }) {
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
    <div id="main-wrapper">
      <Header onToggleMenu={() => setMenuOpen(true)} forceFixed={forceFixedHeader} />
      <MobileHeader onToggleMenu={() => setMenuOpen(true)} />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main>{children}</main>
      <Footer />
    </div>
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
        <RedirectChecker>
          <Routes>
            <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
            <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
            <Route path="/contact-us" element={<MainLayout><ContactPage /></MainLayout>} />
            <Route path="/testimonials" element={<MainLayout><TestimonialsPage /></MainLayout>} />
            <Route path="/properties" element={<MainLayout><PropertiesPage /></MainLayout>} />
            <Route path="/active-properties" element={<MainLayout><ActivePropertiesPage /></MainLayout>} />
            <Route path="/new-developments" element={<MainLayout><NewDevelopmentsPage /></MainLayout>} />
            <Route path="/hot-deals" element={<MainLayout><HotDealsPage /></MainLayout>} />
            <Route path="/off-market" element={<MainLayout><OffMarketPage /></MainLayout>} />
            <Route path="/land" element={<MainLayout><LandPage /></MainLayout>} />
            <Route path="/communities" element={<MainLayout><CommunitiesPage /></MainLayout>} />
            <Route path="/list-with-dali" element={<MainLayout><ListWithDaliPage /></MainLayout>} />
            <Route path="/videos" element={<MainLayout><VideosPage /></MainLayout>} />
            <Route path="/community/:citySlug/:areaSlug" element={<MainLayout><AreaPage /></MainLayout>} />
            <Route path="/community/:citySlug" element={<MainLayout><CityPage /></MainLayout>} />
            <Route path="/search" element={<MainLayout><SearchPage /></MainLayout>} />
            <Route path="/privacy-policy" element={<MainLayout><PrivacyPolicyPage /></MainLayout>} />
            <Route path="/category/blog" element={<MainLayout><BlogsPage /></MainLayout>} />
            <Route path="/blogs" element={<MainLayout><BlogsPage /></MainLayout>} />
            <Route path="/blog/:slug" element={<MainLayout><BlogDetailPage /></MainLayout>} />
            <Route path="/listings/*" element={<MainLayout><ListingDetailPage /></MainLayout>} />
            <Route path="/properties/:slug" element={<PropertyRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </RedirectChecker>
      </Router>
    </HelmetProvider>
  );
}
