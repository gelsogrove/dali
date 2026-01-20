import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import PasswordGate from './components/PasswordGate';
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
import CommunitiesPage from './pages/CommunitiesPage';
import ListWithDaliPage from './pages/ListWithDaliPage';
import CommunityPage from './pages/CommunityPage';
import BuyersGuidePage from './pages/BuyersGuidePage';
import ListingDetailPage from './pages/ListingDetailPage';

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    AOS.init({ once: false, duration: 1000, delay: 200, offset: 120 });
    const onLoad = () => AOS.refresh();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <PasswordGate>
      <Router>
        <div id="main-wrapper">
          <Header onToggleMenu={() => setMenuOpen(true)} />
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
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/list-with-dali" element={<ListWithDaliPage />} />
              <Route path="/community/:slug" element={<CommunityPage />} />
              <Route path="/buyers-guide" element={<BuyersGuidePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/category/blog" element={<BlogsPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              <Route path="/listings/*" element={<ListingDetailPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </PasswordGate>
  );
}
