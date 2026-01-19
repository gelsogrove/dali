import { useEffect, useState } from 'react';
import { navLinks } from '../data/homeData';

export default function Header({ onToggleMenu }) {
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsFixed(window.scrollY > 80);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="header">
      <div className={`header-container ${isFixed ? 'fix' : ''}`}>
        <div className="logo">
          <a href="/" className="header-logo">
            <img className="main-head" src="/images/main-logo.png" alt="Buy with Dali" />
            <img className="not-main" src="/images/logo-black.png" alt="Buy with Dali" />
          </a>
        </div>

        <nav className="navigation">
          <ul id="nav" className="menu">
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
          <div className="burger-menu">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onToggleMenu();
              }}
            >
              <span className="hidden">Menu</span>
              <svg viewBox="0 0 100 80" width="40" height="40" aria-hidden="true" focusable="false">
                <rect y="10" width="100" height="7"></rect>
                <rect y="35" x="20" width="80" height="7"></rect>
                <rect y="60" width="100" height="7"></rect>
              </svg>
              <span>Menu</span>
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
