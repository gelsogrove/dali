import { contactInfo, navLinks } from '../data/homeData';

export default function Footer() {
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
        <div className="footer-smi">
          {contactInfo.social.map((social) => (
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
