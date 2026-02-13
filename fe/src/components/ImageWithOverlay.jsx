import { useState } from 'react';
import SafeImage from './SafeImage';

export default function ImageWithOverlay({ src, alt, children, className = '', beds, baths, size, status = 'FOR SALE', location }) {
  const [loaded, setLoaded] = useState(false);

  // Controlla se ci sono dati validi per beds/baths/size
  const hasBeds = beds && beds !== '0' && beds !== 0;
  const hasBaths = baths && baths !== '0' && baths !== 0;
  const hasSize = size && size !== '0' && size !== 0;
  const hasSpecs = hasBeds || hasBaths || hasSize;

  return (
    <div className={`image-overlay-container ${className}`}>
      <SafeImage
        src={src} 
        alt={alt} 
        className={`image-overlay-img ${loaded ? 'loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        placeholder="gradient"
      />
      {status && <div className="image-overlay-status">{status}</div>}
      {location && (
        <div className="image-overlay-location">
          <span>{location}</span>
        </div>
      )}
      {hasSize && (
        <div className="image-overlay-size">
          <span>Sq. m.</span>
          <strong>{size}</strong>
        </div>
      )}
      <div className="image-overlay-gradient"></div>
      <div className="image-overlay-content">
        {children}
      </div>
    </div>
  );
}
