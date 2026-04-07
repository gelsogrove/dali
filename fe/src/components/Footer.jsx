import { useState, useEffect } from 'react';
import { contactInfo, navLinks, featuredCities } from '../data/homeData';
import { api } from '../config/api';

export default function Footer() {
  const [landingPages, setLandingPages] = useState([]);

  useEffect(() => {
    const fetchLandingPages = async () => {
      try {
        const res = await api.get('/landing-pages?is_active=1');
        const allPages = res.data?.landing_pages || [];
        console.log('Footer: Fetched', allPages.length, 'landing pages');
        setLandingPages(allPages);
      } catch (error) {
        console.error('Error fetching landing pages:', error);
      }
    };
    fetchLandingPages();
  }, []);

  const normalize = (value) => (value || '').trim().toLowerCase();
  const navLabelSet = new Set(navLinks.map((item) => normalize(item.label)));
  const navHrefSet = new Set(navLinks.map((item) => normalize(item.href)));

  const filteredLandingPages = landingPages.filter((page) => {
    const title = normalize(page.title);
    const slugPath = normalize(`/${page.slug || ''}`);
    return !navLabelSet.has(title) && !navHrefSet.has(slugPath);
  });

  const communityLinks = [
    { id: 'communities', title: 'Communities', href: '/communities' },
    ...featuredCities.map((city) => ({
      id: `community-${city.id}`,
      title: city.name,
      href: `/community/${city.id}`,
    })),
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <a href="/">
            <img className="lazyload img-responsive" src="/images/logo-black.png" alt="Logo" width="352" height="113" />
          </a>
          <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} className="aios-ai-phone" aria-label={contactInfo.phone}>
            <i className="ai-font-phone"></i> {contactInfo.phone}
          </a>
          <a href={`mailto:${contactInfo.email}`} aria-label={contactInfo.email}>
            <i className="ai-font-envelope"></i> {contactInfo.email}
          </a>
          <a href="https://chat.whatsapp.com/JTvrGRfQ7ANC0DtqlxLDc" className="footer-whatsapp-group" target="_blank" rel="noopener noreferrer" aria-label="Join our WhatsApp Hub">
            <i className="ai-font-whatsapp"></i> Join our WhatsApp Hub
          </a>
        </div>
        <div className="menu-main-navigation-container">
          <ul id="menu-main-navigation" className="footernav">
            {navLinks.map((item) => (
              <li key={item.label} className="menu-item">
                <a href={item.href} data-title={item.label}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {(filteredLandingPages.length > 0 || communityLinks.length > 0) && (
          <div className="footer-services">
            <h4 className="footer-services-title">Services</h4>
            <ul className="footernav">
              {communityLinks.map((item) => (
                <li key={item.id} className="menu-item">
                  <a href={item.href} data-title={item.title}>
                    {item.title}
                  </a>
                </li>
              ))}
              {filteredLandingPages.map((page) => (
                <li key={page.id} className="menu-item">
                  <a href={`/${page.slug}`} data-title={page.title}>
                    {page.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="footer-smi">
          {contactInfo.social
            .filter((social) => social.label !== 'WhatsApp')
            .map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer">
              <span className="hidden">{social.label}</span>
              <i className={social.icon}></i>
            </a>
          ))}
        </div>
      </div>
      <div className="footer-container bottom">
        <div className="footer-disclaimer">
          <p>{contactInfo.addressNote}</p>
        </div>
        <div className="copyright">
          Copyright &copy; 2026. Buy With Dali All rights reserved. <a href="/sitemap">Sitemap</a> |{' '}
          <a href="/privacy-policy/">Privacy Policy</a>.
          <div className="copyright-sponsors">
            <i className="ai-font-eho"></i>
            <i className="ai-font-realtor-mls"></i>
          </div>
        </div>
      </div>
    </footer>
  );
}
