import { contactInfo } from '../data/homeData';

export default function MobileHeader({ onToggleMenu }) {
  return (
    <div className="mobile-header">
      <div className="mobile-header__left">
        <button className="mobile-header__btn" aria-label="Open menu" onClick={onToggleMenu}>
          <span className="mobile-header__burger-line"></span>
          <span className="mobile-header__burger-line"></span>
          <span className="mobile-header__burger-line"></span>
        </button>
      </div>
      <div className="mobile-header__logo">
        <a href="/" aria-label="Home">
          <img src="/images/main-logo.png" alt="Buy with Dali" />
        </a>
      </div>
      <div className="mobile-header__actions">
        <a className="mobile-header__icon" href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} aria-label="Call">
          <i className="ai-font-phone"></i>
        </a>
        <a className="mobile-header__icon" href={`mailto:${contactInfo.email}`} aria-label="Email">
          <i className="ai-font-envelope"></i>
        </a>
      </div>
    </div>
  );
}
