import { useState } from 'react';

/**
 * SafeImage - Componente immagine con fallback automatico
 * Non mostra mai immagini rotte, usa sempre un placeholder
 */
export default function SafeImage({ 
  src, 
  alt = '', 
  className = '',
  placeholder = 'gradient',
  style = {},
  loading = 'lazy',
  onLoad: externalOnLoad,
  onError: externalOnError,
  ...props 
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = (e) => {
    setError(true);
    if (externalOnError) externalOnError(e);
  };

  const handleLoad = (e) => {
    setLoaded(true);
    if (externalOnLoad) externalOnLoad(e);
  };

  // Se non c'è src o c'è stato un errore, mostra placeholder
  if (!src || error) {
    return (
      <div 
        className={`safe-image-placeholder ${className}`}
        style={{
          width: '100%',
          height: '100%',
          background: placeholder === 'gradient' 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : '#e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
        aria-label={alt || 'Image placeholder'}
      >
        {placeholder === 'gradient' && (
          <svg 
            width="64" 
            height="64" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity: 0.5 }}
          >
            <path 
              d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" 
              fill="white"
            />
          </svg>
        )}
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div 
          className="safe-image-loading"
          style={{
            width: '100%',
            height: '100%',
            background: '#f3f4f6',
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="spinner" style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          ...style,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        {...props}
      />
    </>
  );
}
