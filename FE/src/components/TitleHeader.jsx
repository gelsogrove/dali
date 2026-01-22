import React from 'react';
import './TitleHeader.css';

/**
 * Centered page/section title with left accent bar.
 * Props:
 * - kicker: small uppercase text above title
 * - title: main heading
 * - subtitle: optional small text under title
 * - align: 'left' | 'center' (default left)
 * - className: extra classes
 */
export default function TitleHeader({ kicker, title, subtitle, align = 'left', className = '', aos = true }) {
  const aosProps = aos
    ? {
        'data-aos': 'fade-up',
        'data-aos-duration': '800',
      }
    : {};

  return (
    <div className={`title-header ${align === 'left' ? 'title-header--left' : 'title-header--center'} ${className}`} {...aosProps}>
      <div className="title-header__inner">
        <span className="title-header__bar" aria-hidden="true" />
        <div className="title-header__text">
          {kicker && <p className="title-header__kicker">{kicker}</p>}
          <h2 className="title-header__title">{title}</h2>
          {subtitle && <p className="title-header__subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
