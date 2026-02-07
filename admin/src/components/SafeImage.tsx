import { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  fallback?: 'gradient' | 'gray';
}

/**
 * SafeImage - Componente immagine con fallback automatico per Admin
 * Non mostra mai immagini rotte
 */
export function SafeImage({ 
  src, 
  alt = '', 
  className = '',
  fallback = 'gradient',
  style = {},
  ...props 
}: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = () => {
    setError(true);
  };

  const handleLoad = () => {
    setLoaded(true);
  };

  // Se non c'è src o c'è stato un errore, mostra placeholder
  if (!src || error) {
    return (
      <div 
        className={`relative flex items-center justify-center ${className}`}
        style={{
          width: '100%',
          height: '100%',
          background: fallback === 'gradient' 
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : '#e5e7eb',
          ...style
        }}
      >
        {fallback === 'gradient' && (
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="opacity-50"
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
    <div className="relative" style={{ width: '100%', height: '100%' }}>
      {!loaded && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-purple-600" />
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
        {...props}
      />
    </div>
  );
}

export default SafeImage;
