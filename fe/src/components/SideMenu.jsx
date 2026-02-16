import { contactInfo, navLinks } from '../data/homeData';

export default function SideMenu({ open, onClose }) {
  return (
    <>
      {open && <div className="side-menu-overlay" onClick={onClose}></div>}
      <div className={`side-menu ${open ? 'shown' : ''}`}>
        <div className="side-menu-container">
          <div className="side-menu-close">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              <i className="ai-font-x-sign"></i>
              <span>Close</span>
            </a>
          </div>
          <div className="side-menu-logo">
            <a href="/">
              <img className="lazyload img-responsive" src="/images/logo-black.png" alt="Dali" width="352" height="113" />
            </a>
          </div>
          <div className="side-menu-nav">
            <ul id="side_nav" className="menu">
              {navLinks.map((item) => (
                <li key={item.label} className={item.children ? 'menu-item menu-item-has-children' : 'menu-item'}>
                  <a href={item.href} data-title={item.label}>
                    {item.label}
                  </a>
                  {item.children && (
                    <ul className="sub-menu">
                      {item.children.map((child) => (
                        <li key={child.label} className="menu-item">
                          <a href={child.href} data-title={child.label}>
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="side-menu-contact">
            <div className="side-menu-phone">
              <a href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, '')}`} className="aios-ai-phone" aria-label={contactInfo.phone}>
                <i className="ai-font-phone"></i> {contactInfo.phone}
              </a>
            </div>
            <div className="side-menu-email">
              <a href={`mailto:${contactInfo.email}`} aria-label={contactInfo.email}>
                <i className="ai-font-envelope"></i> {contactInfo.email}
              </a>
            </div>
            <div className="side-menu-todo" style={{ marginTop: '20px' }}>
              <a href="https://new.buywithdali.com/admin/todo" target="_blank" rel="noopener noreferrer">
                <i className="ai-font-check-list"></i> TODO
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
